import type { Article, Category, ID, ListItem } from "./model";
import { compareLines } from "./lines";
import { byName } from "./slug";

/**
 * Regroupement par catégorie (docs/03 B1) : la liste est indépendante de tout magasin,
 * ses lignes sont rangées par catégorie ; le regroupement par rayon n'apparaît qu'en
 * mode courses, une fois le magasin choisi.
 */

/**
 * Catégorie système des achats ponctuels (docs/03 A4) : un article qu'on n'achète
 * qu'une fois (une friteuse) y est rangé sans encombrer le catalogue ; il passe en
 * article normal en recevant une vraie catégorie.
 */
export const ONE_OFF_CATEGORY = "achats-ponctuels";

export function isOneOff(
  category: Pick<Category, "catalogKey"> | undefined,
): boolean {
  return category?.catalogKey === ONE_OFF_CATEGORY;
}

/** Catégorie système « Autres » : le repli quand rien n'est deviné (docs/06). */
export const OTHERS_CATEGORY = "autres";

/** La catégorie « Autres » de l'utilisateur (celle du catalogue, même renommée). */
export function othersCategory<C extends Pick<Category, "catalogKey" | "slug">>(
  categories: readonly C[],
): C | undefined {
  return (
    categories.find((c) => c.catalogKey === OTHERS_CATEGORY) ??
    categories.find((c) => c.slug === OTHERS_CATEGORY)
  );
}

/** La catégorie « Achats ponctuels » de l'utilisateur. */
export function oneOffCategory<C extends Pick<Category, "catalogKey">>(
  categories: readonly C[],
): C | undefined {
  return categories.find(isOneOff);
}

/**
 * Ordre des catégories : celui du catalogue de départ (`catalogOrder`, clés), puis les
 * catégories créées par l'utilisateur par ordre alphabétique ; les catégories système
 * (« Autres », « Achats ponctuels ») en dernier.
 */
export function sortCategories<
  C extends Pick<Category, "name" | "isSystem" | "catalogKey">,
>(categories: readonly C[], catalogOrder: readonly string[]): C[] {
  const order = new Map(catalogOrder.map((key, index) => [key, index]));
  const rank = (key: string | undefined) =>
    (key === undefined ? undefined : order.get(key)) ?? catalogOrder.length;
  return [...categories].sort(
    (a, b) =>
      Number(a.isSystem) - Number(b.isSystem) ||
      rank(a.catalogKey) - rank(b.catalogKey) ||
      byName(a, b),
  );
}

export interface CategoryGroup<C, I> {
  category: C;
  items: I[];
}

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
    const lines = byCategory.get(article.categoryId);
    if (lines) lines.push(item);
    else byCategory.set(article.categoryId, [item]);
  }
  const byLine = compareLines<I>(articles);
  return sortCategories(categories, catalogOrder).flatMap((category) => {
    const lines = byCategory.get(category.id);
    return lines ? [{ category, items: lines.sort(byLine) }] : [];
  });
}
