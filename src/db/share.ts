import { planListMerge, type MergeSource } from "@/domain/listMerge";
import type { Article, Category, ID, Unit } from "@/domain/model";
import {
  defaultChoice,
  findCategory,
  findUnit,
  importAmount,
  newArticleCategory,
  type CategoryDesc,
  type ImportChoice,
  type ImportLine,
  type UnitDesc,
} from "@/domain/share";
import { slugify } from "@/domain/slug";
import type { ShoppingDatabase } from "./database";
import { activeItems, applyListMerge, createList } from "./lists";
import { updateSettings } from "./settings";

/**
 * Import d'une liste partagée ou d'un texte collé (docs/02 § 9, docs/07 § 7.9), en une
 * transaction : catégories, unités et articles manquants créés, associations
 * mémorisées (le libellé reçu devient un alias), puis les lignes ajoutées à la liste
 * choisie comme l'ajout d'une liste dans une autre (quantités fusionnées).
 */
export type ImportTarget =
  { kind: "new"; name: string } | { kind: "list"; listId: ID };

export async function applyImport(
  database: ShoppingDatabase,
  lines: readonly ImportLine[],
  choices: readonly (ImportChoice | undefined)[],
  target: ImportTarget,
  now = Date.now(),
): Promise<{ listId: ID; count: number }> {
  return database.transaction(
    "rw",
    [
      database.articles,
      database.categories,
      database.units,
      database.items,
      database.lists,
      database.meta,
    ],
    async () => {
      const units = await database.units.toArray();
      const categories = await database.categories.toArray();
      const base = () => ({
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      });

      const ensureUnit = async (desc: UnitDesc): Promise<Unit> => {
        const found = findUnit(desc, units);
        if (found) return found;
        const unit: Unit = { ...base(), ...desc };
        await database.units.add(unit);
        units.push(unit);
        return unit;
      };
      const ensureCategory = async (desc: CategoryDesc): Promise<Category> => {
        const found = findCategory(desc, categories);
        if (found) return found;
        const category: Category = {
          ...base(),
          slug: desc.slug,
          name: desc.name,
          icon: desc.icon,
          color: desc.color,
          useIconAsFallback: desc.catalogKey === undefined,
          isSystem: false,
          catalogKey: desc.catalogKey,
        };
        await database.categories.add(category);
        categories.push(category);
        return category;
      };
      /** Alias libre : ni le nom ni un alias d'un autre article (saisie ambiguë sinon). */
      const free = async (alias: string, own?: ID) => {
        const other =
          (await database.articles.where("slug").equals(alias).first()) ??
          (await database.articles.where("aliases").equals(alias).first());
        return other === undefined || other.id === own;
      };
      /** Libellé reçu en alias, types acceptés ajoutés aux types de l'article. */
      const complete = async (
        article: Article,
        line: ImportLine,
        alias: boolean,
      ): Promise<Article> => {
        const label = slugify(line.received.label);
        const aliases =
          alias &&
          label &&
          label !== article.slug &&
          !article.aliases.includes(label) &&
          (await free(label, article.id))
            ? [...article.aliases, label]
            : article.aliases;
        const known = new Set(article.types.map(slugify));
        const types = [
          ...article.types,
          ...line.acceptedTypes.filter((type) => !known.has(slugify(type))),
        ];
        if (
          aliases.length === article.aliases.length &&
          types.length === article.types.length
        )
          return article;
        await database.articles.update(article.id, {
          aliases,
          types,
          updatedAt: now,
        });
        return { ...article, aliases, types };
      };
      const create = async (
        line: ImportLine,
        typed: string,
        oneOff: boolean,
      ) => {
        const { received } = line;
        const name = typed.trim() || received.name;
        const slug = slugify(name);
        if (!slug) return undefined;
        const existing = await database.articles
          .where("slug")
          .equals(slug)
          .first();
        if (existing) return complete(existing, line, true);
        // Juste cette fois : « Achats ponctuels », la catégorie reçue n'est pas créée.
        const { existing: found, desc } = newArticleCategory(
          line,
          oneOff,
          categories,
        );
        const category = found ?? (await ensureCategory(desc));
        const unit = await ensureUnit(received.unit);
        const keyTaken =
          received.catalogKey !== undefined &&
          (await database.articles
            .where("catalogKey")
            .equals(received.catalogKey)
            .first()) !== undefined;
        const known = new Set(received.types.map(slugify));
        const aliases: string[] = [];
        for (const alias of new Set([
          ...received.aliases,
          slugify(received.label),
        ]))
          if (alias && alias !== slug && (await free(alias)))
            aliases.push(alias);
        const article: Article = {
          ...base(),
          slug,
          name,
          categoryId: category.id,
          defaultUnitId: unit.id,
          defaultQuantity: received.defaultQuantity,
          countable: received.countable,
          generic: received.generic,
          types: [
            ...received.types,
            ...line.acceptedTypes.filter((type) => !known.has(slugify(type))),
          ],
          aliases,
          icon: received.icon,
          favorite: false,
          barcodes: [],
          notDuplicateOf: [],
          catalogKey: keyTaken ? undefined : received.catalogKey,
        };
        await database.articles.add(article);
        return article;
      };

      const sources: MergeSource[] = [];
      for (const [index, line] of lines.entries()) {
        const choice = choices[index] ?? defaultChoice(line);
        let article: Article | undefined;
        if (choice.kind === "skip") continue;
        if (choice.kind === "use") {
          const chosen = await database.articles.get(choice.articleId);
          if (!chosen) continue;
          // Association choisie ou confirmée : mémorisée pour la prochaine fois.
          const confirmed =
            line.match.kind !== "known" ||
            line.match.articleId !== choice.articleId;
          article = await complete(chosen, line, confirmed);
        } else article = await create(line, choice.name, choice.oneOff);
        if (!article) continue;
        if ("quantity" in line.amount) await ensureUnit(line.amount.unit);
        const amount = importAmount(line, article, units);
        if (!amount) continue;
        sources.push({
          articleId: article.id,
          quantity: amount.quantity,
          unitId: amount.unit.id,
          acceptedTypes: line.acceptedTypes,
          note: line.note,
        });
      }

      let listId: ID;
      if (target.kind === "new")
        listId = (await createList(database, target.name, undefined, now)).id;
      else {
        listId = target.listId;
        await updateSettings(database, { currentListId: listId });
      }
      const plan = planListMerge(
        await activeItems(database, listId),
        sources,
        units,
      );
      await applyListMerge(database, listId, plan, now);
      return { listId, count: sources.length };
    },
  );
}
