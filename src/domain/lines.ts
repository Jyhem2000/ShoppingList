import type { ID } from "./model";

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
