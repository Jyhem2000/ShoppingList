import type { Article, Category, ID, ItemStatus, ListItem } from "./model";

/**
 * Regroupement par catégorie (docs/03 B1) : la liste est indépendante de tout magasin,
 * ses lignes sont rangées par catégorie ; le regroupement par rayon n'apparaît qu'en
 * mode courses, une fois le magasin choisi.
 */

const collator = new Intl.Collator("fr");

/**
 * Ordre des catégories : celui du catalogue de départ (`catalogOrder`, clés), puis les
 * catégories créées par l'utilisateur par ordre alphabétique ; les catégories système
 * (« Autres », « Achats ponctuels ») en dernier.
 */
export function sortCategories<
  C extends Pick<Category, "name" | "isSystem" | "catalogKey">,
>(categories: readonly C[], catalogOrder: readonly string[]): C[] {
  const rank = (key: string | undefined) => {
    const index = key === undefined ? -1 : catalogOrder.indexOf(key);
    return index < 0 ? catalogOrder.length : index;
  };
  return [...categories].sort(
    (a, b) =>
      Number(a.isSystem) - Number(b.isSystem) ||
      rank(a.catalogKey) - rank(b.catalogKey) ||
      collator.compare(a.name, b.name),
  );
}

export interface CategoryGroup<C, I> {
  category: C;
  items: I[];
}

const STATUS_ORDER: Record<ItemStatus, number> = {
  todo: 0,
  checked: 1,
  unavailable: 2,
};

/**
 * Lignes groupées par catégorie, catégories dans l'ordre de `sortCategories`,
 * catégories vides omises ; dans un groupe : à acheter, puis cochées, puis pas prises,
 * l'article générique (« Fruits au choix ») en tête, puis par ordre alphabétique.
 * Les lignes archivées (courses terminées) sont exclues.
 */
export function groupListByCategory<
  C extends Pick<Category, "id" | "name" | "isSystem" | "catalogKey">,
  I extends ListItem,
>(
  items: readonly I[],
  articles: ReadonlyMap<ID, Pick<Article, "name" | "categoryId" | "generic">>,
  categories: readonly C[],
  catalogOrder: readonly string[],
): CategoryGroup<C, I>[] {
  const byCategory = new Map<ID, I[]>();
  for (const item of items) {
    if (item.closedInSessionId) continue;
    const article = articles.get(item.articleId);
    if (!article) continue;
    byCategory.set(article.categoryId, [
      ...(byCategory.get(article.categoryId) ?? []),
      item,
    ]);
  }
  const name = (item: I) => articles.get(item.articleId)?.name ?? "";
  const generic = (item: I) => articles.get(item.articleId)?.generic === true;
  return sortCategories(categories, catalogOrder).flatMap((category) => {
    const lines = byCategory.get(category.id);
    if (!lines) return [];
    return [
      {
        category,
        items: [...lines].sort(
          (a, b) =>
            STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
            Number(generic(b)) - Number(generic(a)) ||
            collator.compare(name(a), name(b)),
        ),
      },
    ];
  });
}
