import type {
  Aisle,
  Article,
  ArticleAisleOverride,
  ID,
  ItemStatus,
  ListItem,
} from "./model";

/**
 * Tri de la liste par rayon (docs/02 § 4, docs/07 § 7.4 et 7.5).
 */
type AisleArticle = Pick<Article, "id" | "categoryId">;

/**
 * Rayon effectif d'un article dans un magasin : son exception pour ce magasin, sinon
 * le rayon principal de sa catégorie, sinon « Non classé ».
 */
export function effectiveAisle<A extends Aisle>(
  article: AisleArticle,
  storeId: ID,
  aisles: readonly A[],
  overrides: readonly ArticleAisleOverride[],
): A | undefined {
  const storeAisles = aisles.filter((aisle) => aisle.storeId === storeId);
  const override = overrides.find(
    (o) => o.storeId === storeId && o.articleId === article.id,
  );
  const overridden =
    override && storeAisles.find((aisle) => aisle.id === override.aisleId);
  if (overridden) return overridden;
  const primary = storeAisles.find((aisle) =>
    aisle.categories.some(
      (c) => c.categoryId === article.categoryId && c.primary,
    ),
  );
  return primary ?? storeAisles.find((aisle) => aisle.isUnsorted);
}

export interface AisleGroup<A extends Aisle, I extends ListItem> {
  aisle: A;
  items: I[];
}

const STATUS_ORDER: Record<ItemStatus, number> = {
  todo: 0,
  checked: 1,
  unavailable: 2,
};

const collator = new Intl.Collator("fr");

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
  for (const item of items) {
    if (item.closedInSessionId) continue;
    const article = articles.get(item.articleId);
    if (!article) continue;
    const aisle = effectiveAisle(article, storeId, aisles, overrides);
    if (!aisle) continue;
    let group = groups.get(aisle.id);
    if (!group) {
      group = { aisle, items: [] };
      groups.set(aisle.id, group);
    }
    group.items.push(item);
  }

  const name = (item: I) => articles.get(item.articleId)?.name ?? "";
  const isGeneric = (item: I) => articles.get(item.articleId)?.generic === true;
  const byItem = (a: I, b: I) => {
    const status = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (status) return status;
    const generic = Number(isGeneric(b)) - Number(isGeneric(a));
    if (generic) return generic;
    const orderA = articleOrder[a.articleId];
    const orderB = articleOrder[b.articleId];
    if (orderA !== undefined && orderB !== undefined && orderA !== orderB)
      return orderA - orderB;
    if (orderA !== undefined && orderB === undefined) return -1;
    if (orderA === undefined && orderB !== undefined) return 1;
    return collator.compare(name(a), name(b));
  };

  return [...groups.values()]
    .sort(
      (a, b) =>
        Number(a.aisle.isUnsorted) - Number(b.aisle.isUnsorted) ||
        a.aisle.position - b.aisle.position,
    )
    .map((group) => ({ ...group, items: group.items.sort(byItem) }));
}
