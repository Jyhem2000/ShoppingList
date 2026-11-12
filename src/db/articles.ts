import { mergedArticleFields } from "@/domain/duplicates";
import type { Article, ID } from "@/domain/model";
import { formatQuantity, mergeQuantity } from "@/domain/quantity";
import { slugify } from "@/domain/slug";
import type { ShoppingDatabase } from "./database";

/**
 * Fiche article (docs/02 § 2, docs/03 G1) : modification, suppression, fusion, doublons.
 * Le libellé n'est jamais recopié ailleurs : lignes et historique pointent vers l'id.
 */

export type ArticleChanges = Partial<
  Pick<
    Article,
    | "name"
    | "categoryId"
    | "defaultUnitId"
    | "defaultQuantity"
    | "types"
    | "aliases"
    | "icon"
    | "favorite"
    | "generic"
  >
>;

export type UpdateArticleResult = "saved" | "nameTaken";

/** Renommer recalcule le slug, qui reste unique (docs/02 § 1). */
export async function updateArticle(
  database: ShoppingDatabase,
  id: ID,
  changes: ArticleChanges,
  now = Date.now(),
): Promise<UpdateArticleResult> {
  return database.transaction("rw", database.articles, async () => {
    const next: Partial<Article> = { ...changes, updatedAt: now };
    if (changes.name !== undefined) {
      const name = changes.name.trim();
      const slug = slugify(name);
      const other = await database.articles.where("slug").equals(slug).first();
      if (other && other.id !== id) return "nameTaken";
      next.name = name;
      next.slug = slug;
    }
    await database.articles.update(id, next);
    return "saved";
  });
}

/** Où l'article est utilisé : lignes à acheter (toutes listes confondues). */
export async function articleUsage(
  database: ShoppingDatabase,
  id: ID,
): Promise<{ lines: number; lists: number }> {
  const items = await database.items
    .where("articleId")
    .equals(id)
    .filter((item) => !item.closedInSessionId)
    .toArray();
  return {
    lines: items.length,
    lists: new Set(items.map((item) => item.listId)).size,
  };
}

/**
 * Supprimer un article et ses lignes dans les listes, ses exceptions de rayon et son
 * ordre appris. L'historique des achats reste (sans libellé, il ne s'affiche plus).
 */
export async function deleteArticle(
  database: ShoppingDatabase,
  id: ID,
): Promise<void> {
  await database.transaction(
    "rw",
    [database.articles, database.items, database.overrides, database.stores],
    async () => {
      await database.items.where("articleId").equals(id).delete();
      await database.overrides.filter((o) => o.articleId === id).delete();
      await database.stores.toCollection().modify((store) => {
        if (store.articleOrder && id in store.articleOrder)
          store.articleOrder = Object.fromEntries(
            Object.entries(store.articleOrder).filter(([key]) => key !== id),
          );
      });
      await database.articles.toCollection().modify((article) => {
        if (article.notDuplicateOf.includes(id))
          article.notDuplicateOf = article.notDuplicateOf.filter(
            (x) => x !== id,
          );
      });
      await database.articles.delete(id);
    },
  );
}

/**
 * Fusionner `removedId` dans `keepId` (docs/02 § 2) : lignes, historique, exceptions et
 * ordre appris passent à l'article gardé ; le nom du second devient un nom alternatif.
 * Deux lignes du même article dans une liste n'en font qu'une (quantités additionnées,
 * ou ajoutées en note si les unités ne se convertissent pas).
 */
export async function mergeArticles(
  database: ShoppingDatabase,
  keepId: ID,
  removedId: ID,
  now = Date.now(),
): Promise<void> {
  if (keepId === removedId) return;
  await database.transaction(
    "rw",
    [
      database.articles,
      database.items,
      database.purchases,
      database.overrides,
      database.stores,
      database.units,
    ],
    async () => {
      const [keep, removed] = await database.articles.bulkGet([
        keepId,
        removedId,
      ]);
      if (!keep || !removed) return;
      const units = await database.units.toArray();
      const unitById = new Map(units.map((u) => [u.id, u]));

      const keptLines = await database.items
        .where("articleId")
        .equals(keepId)
        .toArray();
      for (const line of await database.items
        .where("articleId")
        .equals(removedId)
        .toArray()) {
        const twin = line.closedInSessionId
          ? undefined
          : keptLines.find(
              (k) => k.listId === line.listId && !k.closedInSessionId,
            );
        if (!twin) {
          await database.items.update(line.id, {
            articleId: keepId,
            updatedAt: now,
          });
          continue;
        }
        const a = unitById.get(twin.unitId);
        const b = unitById.get(line.unitId);
        const merged =
          a && b
            ? mergeQuantity(
                { quantity: twin.quantity, unit: a },
                { quantity: line.quantity, unit: b },
                units,
              )
            : undefined;
        if (merged?.kind === "merged")
          await database.items.update(twin.id, {
            quantity: merged.quantity,
            unitId: merged.unit.id,
            updatedAt: now,
          });
        else if (b) {
          const extra = `+ ${formatQuantity(line.quantity, b, "long")}`;
          await database.items.update(twin.id, {
            note: twin.note ? `${twin.note} · ${extra}` : extra,
            updatedAt: now,
          });
        }
        await database.items.delete(line.id);
      }

      await database.purchases
        .where("articleId")
        .equals(removedId)
        .modify({ articleId: keepId });

      const overrides = await database.overrides.toArray();
      for (const o of overrides.filter((x) => x.articleId === removedId)) {
        const taken = overrides.some(
          (x) => x.articleId === keepId && x.storeId === o.storeId,
        );
        if (taken) await database.overrides.delete(o.id);
        else await database.overrides.update(o.id, { articleId: keepId });
      }

      await database.stores.toCollection().modify((store) => {
        const order = store.articleOrder;
        if (!order || !(removedId in order)) return;
        const { [removedId]: score, ...rest } = order;
        store.articleOrder =
          keepId in rest || score === undefined
            ? rest
            : { ...rest, [keepId]: score };
      });

      await database.articles.update(keepId, {
        ...mergedArticleFields(keep, removed, slugify),
        updatedAt: now,
      });
      await database.articles.toCollection().modify((article) => {
        if (article.notDuplicateOf.includes(removedId))
          article.notDuplicateOf = article.notDuplicateOf.filter(
            (x) => x !== removedId,
          );
      });
      await database.articles.delete(removedId);
    },
  );
}

/** « Ce ne sont pas des doublons » : la paire ne sera plus proposée. */
export async function markNotDuplicate(
  database: ShoppingDatabase,
  a: ID,
  b: ID,
): Promise<void> {
  await database.transaction("rw", database.articles, async () => {
    for (const [id, other] of [
      [a, b],
      [b, a],
    ] as const) {
      const article = await database.articles.get(id);
      if (article && !article.notDuplicateOf.includes(other))
        await database.articles.update(id, {
          notDuplicateOf: [...article.notDuplicateOf, other],
        });
    }
  });
}
