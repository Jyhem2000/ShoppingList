import { searchKey } from "./slug";

/**
 * Dictionnaire de mots-clés (docs/06 § 5) : devine la catégorie, l'unité et l'icône
 * d'un article créé par l'utilisateur. Comparaison sur les mots du libellé ;
 * la première règle trouvée gagne (les mots spécifiques sont rangés avant les génériques).
 */
export interface KeywordGuess {
  match: string[];
  category: string;
  unit: string;
  icon?: string;
}

export function guessFromKeywords<R extends KeywordGuess>(
  label: string,
  rules: readonly R[],
): R | undefined {
  const words = new Set(searchKey(label).split("-"));
  return rules.find((rule) =>
    rule.match.some((keyword) => words.has(searchKey(keyword))),
  );
}
