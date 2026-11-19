import { categoriesData } from "@/data";
import { CATALOG_VERSION, catalogData, catalogFixes } from "@/data/catalog";
import type { Article, Category } from "@/domain/model";
import type { ShoppingDatabase } from "./database";
import { buildInitialData } from "./seed";

/**
 * Mise à jour du catalogue sans réinstaller (docs/06 § 7) : à chaque nouvelle version du
 * catalogue embarqué, les catégories et articles apparus depuis (`since`) sont ajoutés à
 * la base, s'ils n'y sont pas déjà (même clé, ou même nom pour un article créé à la
 * main). Rien de ce que l'utilisateur a créé, modifié ou supprimé avant n'est touché.
 * Une nouvelle catégorie n'est rangée dans aucun rayon : elle apparaît dans les
 * « Catégories non rattachées » de chaque magasin. Les corrections (`catalogFixes`)
 * ne touchent qu'un article jamais modifié. Renvoie le nombre d'ajouts et de corrections.
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
      const categorySlugs = new Set(categories.map((c) => c.slug));
      const freshCategories = new Map(
        fresh.categories.map((c) => [c.catalogKey, c]),
      );
      const newCategories: Category[] = [];
      for (const data of categoriesData) {
        if (!isNew(data.since) || categoryByKey.has(data.key)) continue;
        const category = freshCategories.get(data.key);
        if (!category || categorySlugs.has(category.slug)) continue;
        newCategories.push(category);
        categoryByKey.set(data.key, category.id);
      }
      await database.categories.bulkAdd(newCategories);
      added += newCategories.length;

      const units = await database.units.toArray();
      const unitByKey = new Map(
        units.map((u) => [u.catalogKey ?? u.slug, u.id]),
      );
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

      await database.meta.put({
        key: "settings",
        value: { ...row.value, catalogVersion: CATALOG_VERSION },
      });
      return added;
    },
  );
}
