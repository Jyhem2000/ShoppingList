import type { Article, ID, ItemStatus, ListItem } from "./model";

/**
 * Une ligne par article **et par choix de types** dans une liste (docs/02 § 6) :
 * « Pommes · Golden » et « Pommes · Granny Smith » sont deux lignes, les mêmes types
 * (dans n'importe quel ordre, majuscules comprises) font la même ligne, et « peu
 * importe » (aucun type) est un choix comme un autre.
 */
export function typesKey(types: readonly string[]): string {
  return [...new Set(types.map((type) => type.trim().toLocaleLowerCase("fr")))]
    .sort()
    .join("|");
}

export function sameTypes(a: readonly string[], b: readonly string[]): boolean {
  return typesKey(a) === typesKey(b);
}

/** Identité d'une ligne dans une liste : l'article et ses types. */
export function lineKey(line: {
  articleId: ID;
  acceptedTypes: readonly string[];
}): string {
  return `${line.articleId}#${typesKey(line.acceptedTypes)}`;
}

/**
 * « Une autre sorte » (docs/02 § 6) : les types de l'article qui n'ont pas encore leur
 * propre ligne (ce type seul) parmi les lignes actives de la liste.
 */
export function otherTypes(
  article: { id: ID; types: readonly string[] },
  lines: readonly { articleId: ID; acceptedTypes: readonly string[] }[],
): string[] {
  const taken = new Set(
    lines
      .filter((line) => line.articleId === article.id)
      .map((line) => typesKey(line.acceptedTypes)),
  );
  return article.types.filter((type) => !taken.has(typesKey([type])));
}

const STATUS_ORDER: Record<ItemStatus, number> = {
  todo: 0,
  checked: 1,
  unavailable: 2,
};

const collator = new Intl.Collator("fr");

/**
 * Ordre des lignes dans un groupe (rayon, catégorie, « À placer ») : à prendre, puis
 * cochées, puis pas prises ; l'article générique (« Fruits au choix ») en tête ; puis
 * l'ordre appris `order` (plus petit d'abord, les articles sans ordre après) ; puis
 * par nom ; les lignes d'un même article (types différents) côte à côte.
 */
export function compareLines<
  I extends Pick<ListItem, "articleId" | "status" | "acceptedTypes">,
>(
  articles: ReadonlyMap<ID, Pick<Article, "name" | "generic">>,
  order: Readonly<Record<ID, number>> = {},
): (a: I, b: I) => number {
  const name = (item: I) => articles.get(item.articleId)?.name ?? "";
  const generic = (item: I) => articles.get(item.articleId)?.generic === true;
  const rank = (item: I) => order[item.articleId] ?? Number.POSITIVE_INFINITY;
  return (a, b) =>
    STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
    Number(generic(b)) - Number(generic(a)) ||
    (rank(a) === rank(b) ? 0 : rank(a) < rank(b) ? -1 : 1) ||
    collator.compare(name(a), name(b)) ||
    collator.compare(typesKey(a.acceptedTypes), typesKey(b.acceptedTypes));
}
