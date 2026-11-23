import { categoriesData, unitsData } from "@/data";
import {
  CATALOG_VERSION,
  SEASONS_SINCE,
  catalogData,
  catalogFixes,
} from "@/data/catalog";
import type { Article, ID } from "@/domain/model";
import type { ShoppingDatabase } from "./database";
import { buildInitialData } from "./seed";

/**
 * Mise à jour du catalogue sans réinstaller (docs/06 § 7) : à chaque nouvelle version du
 * catalogue embarqué, les unités, catégories et articles apparus depuis (`since`) sont
 * ajoutés à la base, s'ils n'y sont pas déjà (même clé, ou même nom pour une ligne créée
 * à la main). Rien de ce que l'utilisateur a créé, modifié ou supprimé avant n'est touché.
 * Une nouvelle catégorie n'est rangée dans aucun rayon : elle apparaît dans les
 * « Catégories non rattachées » de chaque magasin. Les corrections (`catalogFixes`)
 * ne touchent qu'un article jamais modifié ; les mois de saison, qu'un article qui n'en
 * a pas encore. Renvoie le nombre d'ajouts et de corrections.
 */
export async function updateCatalog(
  database: ShoppingDatabase,
  now = Date.now(),
): Promise<number> {
  return database.transaction(
    "rw",
    [database.meta, database.categories, database.articles, database.units],
    async () => {
      const row = await database.meta.get("settings");
      if (!row || row.value.catalogVersion >= CATALOG_VERSION) return 0;
      const from = row.value.catalogVersion;
      const fresh = buildInitialData(now);
      const isNew = (since: number | undefined) => (since ?? 1) > from;
      let added = 0;

      const categories = await database.categories.toArray();
      const categoryByKey = new Map(
        categories.map((c) => [c.catalogKey, c.id]),
      );
      const newCategories = newRows(
        categoriesData.filter((data) => isNew(data.since)),
        fresh.categories,
        categories,
        categoryByKey,
      );
      await database.categories.bulkAdd(newCategories);
      added += newCategories.length;

      const units = await database.units.toArray();
      const unitByKey = new Map<string | undefined, ID>(
        units.map((u) => [u.catalogKey ?? u.slug, u.id]),
      );
      const newUnits = newRows(
        unitsData.filter((data) => isNew(data.since)),
        fresh.units,
        units,
        unitByKey,
      );
      await database.units.bulkAdd(newUnits);
      added += newUnits.length;

      const articles = await database.articles.toArray();
      const articleKeys = new Set(articles.map((a) => a.catalogKey));
      const articleSlugs = new Set(articles.map((a) => a.slug));
      const freshArticles = new Map(
        fresh.articles.map((a) => [a.catalogKey, a]),
      );
      const newArticles: Article[] = [];
      for (const data of catalogData) {
        if (!isNew(data.since) || articleKeys.has(data.key)) continue;
        const article = freshArticles.get(data.key);
        const categoryId = categoryByKey.get(data.category);
        const unitId = unitByKey.get(data.unit);
        if (
          !article ||
          !categoryId ||
          !unitId ||
          articleSlugs.has(article.slug)
        )
          continue;
        newArticles.push({ ...article, categoryId, defaultUnitId: unitId });
      }
      await database.articles.bulkAdd(newArticles);
      added += newArticles.length;

      const articleByKey = new Map(articles.map((a) => [a.catalogKey, a]));

      for (const fix of catalogFixes) {
        if (!isNew(fix.since)) continue;
        const article = articleByKey.get(fix.key);
        const unitId =
          fix.unit === undefined ? undefined : unitByKey.get(fix.unit);
        // Modifié par l'utilisateur (date de mise à jour) : on n'y touche pas.
        if (
          !article ||
          (fix.unit !== undefined && !unitId) ||
          article.updatedAt !== article.createdAt
        )
          continue;
        await database.articles.update(article.id, {
          ...(unitId && { defaultUnitId: unitId }),
          ...(fix.quantity !== undefined && {
            defaultQuantity: fix.quantity ?? undefined,
          }),
          ...(fix.countable !== undefined && { countable: fix.countable }),
        });
        added++;
      }

      // Mois de saison, arrivés après les articles : un champ nouveau, que l'utilisateur
      // n'a donc pas pu choisir. Copiés même dans un article modifié depuis, sauf s'il a
      // déjà des mois (calendrier de la fiche, même vidé).
      if (isNew(SEASONS_SINCE)) {
        const seasons = articles.flatMap((article) => {
          const months = freshArticles.get(article.catalogKey)?.seasonMonths;
          return months && article.seasonMonths === undefined
            ? [{ key: article.id, changes: { seasonMonths: months } }]
            : [];
        });
        await database.articles.bulkUpdate(seasons);
        added += seasons.length;
      }

      await database.meta.put({
        key: "settings",
        value: { ...row.value, catalogVersion: CATALOG_VERSION },
      });
      return added;
    },
  );
}

/**
 * Lignes du catalogue à ajouter (catégories, unités) : celles de `data` qui ne sont pas
 * déjà dans la base, ni par leur clé (`idByKey`), ni par leur slug (créées à la main).
 * `idByKey` reçoit les ajouts : les articles nouveaux s'y rattachent.
 */
function newRows<T extends { id: ID; slug: string; catalogKey?: string }>(
  data: readonly { key: string }[],
  fresh: readonly T[],
  existing: readonly { slug: string }[],
  idByKey: Map<string | undefined, ID>,
): T[] {
  const freshByKey = new Map(fresh.map((row) => [row.catalogKey, row]));
  const slugs = new Set(existing.map((row) => row.slug));
  const rows: T[] = [];
  for (const { key } of data) {
    const row = freshByKey.get(key);
    if (idByKey.has(key) || !row || slugs.has(row.slug)) continue;
    rows.push(row);
    idByKey.set(key, row.id);
  }
  return rows;
}
