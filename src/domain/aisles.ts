import type {
  Aisle,
  Article,
  ArticleAisleOverride,
  ID,
  ListItem,
} from "./model";
import { compareLines } from "./lines";

/**
 * Tri de la liste par rayon (docs/02 § 4, docs/07 § 7.4 et 7.5).
 */
type AisleArticle = Pick<Article, "id" | "categoryId">;

/**
 * Rayon effectif d'un article dans un magasin : son exception pour ce magasin, sinon
 * le rayon principal de sa catégorie, sinon « Non classé ». Les tables sont
 * construites une fois, pour résoudre ensuite autant d'articles qu'on veut.
 */
export function aisleResolver<A extends Aisle>(
  storeId: ID,
  aisles: readonly A[],
  overrides: readonly ArticleAisleOverride[],
): (article: AisleArticle) => A | undefined {
  const byId = new Map<ID, A>();
  const primaryOf = new Map<ID, A>();
  let unsorted: A | undefined;
  for (const aisle of aisles) {
    if (aisle.storeId !== storeId) continue;
    byId.set(aisle.id, aisle);
    if (aisle.isUnsorted) unsorted ??= aisle;
    for (const c of aisle.categories)
      if (c.primary && !primaryOf.has(c.categoryId))
        primaryOf.set(c.categoryId, aisle);
  }
  const overrideOf = new Map<ID, A>();
  for (const o of overrides) {
    const aisle = o.storeId === storeId ? byId.get(o.aisleId) : undefined;
    if (aisle && !overrideOf.has(o.articleId))
      overrideOf.set(o.articleId, aisle);
  }
  return (article) =>
    overrideOf.get(article.id) ?? primaryOf.get(article.categoryId) ?? unsorted;
}

/** Rayon effectif d'un seul article (voir `aisleResolver`). */
export function effectiveAisle<A extends Aisle>(
  article: AisleArticle,
  storeId: ID,
  aisles: readonly A[],
  overrides: readonly ArticleAisleOverride[],
): A | undefined {
  return aisleResolver(storeId, aisles, overrides)(article);
}

export interface AisleGroup<A extends Aisle, I extends ListItem> {
  aisle: A;
  items: I[];
}

/**
 * Lignes groupées par rayon effectif, rayons dans l'ordre du parcours (« Non classé »
 * en dernier). Dans un rayon : à acheter, puis cochées, puis introuvables ; chacune
 * avec les articles génériques en tête, puis par ordre appris (`articleOrder`,
 * plus petit d'abord), puis alphabétique.
 * Les lignes archivées (clôturées) sont exclues, les rayons vides omis.
 */
export function groupListForStore<
  A extends Aisle,
  I extends ListItem,
  R extends AisleArticle & Pick<Article, "name" | "generic">,
>(
  items: readonly I[],
  articles: ReadonlyMap<ID, R>,
  storeId: ID,
  aisles: readonly A[],
  overrides: readonly ArticleAisleOverride[],
  articleOrder: Readonly<Record<ID, number>> = {},
): AisleGroup<A, I>[] {
  const groups = new Map<ID, AisleGroup<A, I>>();
  const aisleOf = aisleResolver(storeId, aisles, overrides);
  for (const item of items) {
    if (item.closedInSessionId) continue;
    const article = articles.get(item.articleId);
    if (!article) continue;
    const aisle = aisleOf(article);
    if (!aisle) continue;
    let group = groups.get(aisle.id);
    if (!group) {
      group = { aisle, items: [] };
      groups.set(aisle.id, group);
    }
    group.items.push(item);
  }

  const byItem = compareLines<I>(articles, articleOrder);

  return [...groups.values()]
    .sort(
      (a, b) =>
        Number(a.aisle.isUnsorted) - Number(b.aisle.isUnsorted) ||
        a.aisle.position - b.aisle.position,
    )
    .map((group) => ({ ...group, items: group.items.sort(byItem) }));
}
