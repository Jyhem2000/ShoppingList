import type { Article, ID } from "./model";
import { mergeTypes, searchKey, slugify } from "./slug";

/**
 * Doublons probables (docs/03 G1, docs/07 § 7.12) : paires d'articles de même catégorie
 * et même icône, dont les noms sont proches (au plus 2 lettres d'écart, ou l'un contient
 * l'autre) ou qui partagent un nom alternatif. Les paires écartées par l'utilisateur
 * (« Ce ne sont pas des doublons », `notDuplicateOf`) ne reviennent jamais.
 */
type DuplicateCandidate = Pick<
  Article,
  "id" | "name" | "categoryId" | "icon" | "aliases" | "notDuplicateOf"
>;

/** Distance d'édition (insertion, suppression, remplacement), arrêtée au-delà de `max`. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const value = Math.min(
        (previous[j] ?? 0) + 1,
        (current[j - 1] ?? 0) + 1,
        (previous[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      current.push(value);
      best = Math.min(best, value);
    }
    if (best > max) return max + 1;
    previous = current;
  }
  return previous[b.length] ?? max + 1;
}

/** Clé de recherche du nom, puis celles des noms alternatifs. */
type Keys = [string, ...string[]];

function close([ka, ...aliasesA]: Keys, [kb, ...aliasesB]: Keys): boolean {
  if (ka.includes(kb) || kb.includes(ka)) return true;
  if (editDistance(ka, kb) <= 2) return true;
  const labelsA = new Set([ka, ...aliasesA]);
  return [kb, ...aliasesB].some((key) => labelsA.has(key));
}

export function findLikelyDuplicates<A extends DuplicateCandidate>(
  articles: readonly A[],
): [A, A][] {
  const groups = new Map<string, A[]>();
  for (const article of articles) {
    if (!article.icon) continue;
    const key = `${article.categoryId}|${article.icon}`;
    const group = groups.get(key);
    if (group) group.push(article);
    else groups.set(key, [article]);
  }
  // Clés calculées une fois par article, pas à chaque paire.
  const keys = new Map<A, Keys>();
  const keysOf = (article: A): Keys => {
    let found = keys.get(article);
    if (!found) {
      found = [searchKey(article.name), ...article.aliases.map(searchKey)];
      keys.set(article, found);
    }
    return found;
  };
  const pairs: [A, A][] = [];
  for (const group of groups.values())
    for (let i = 0; i < group.length; i++)
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        if (!a || !b) continue;
        if (a.notDuplicateOf.includes(b.id) || b.notDuplicateOf.includes(a.id))
          continue;
        if (close(keysOf(a), keysOf(b))) pairs.push([a, b]);
      }
  return pairs;
}

/** Ce que devient l'article gardé lors d'une fusion : noms, types et alias réunis. */
export function mergedArticleFields(
  keep: Pick<
    Article,
    "name" | "aliases" | "types" | "notDuplicateOf" | "favorite"
  >,
  removed: Pick<
    Article,
    "id" | "name" | "aliases" | "types" | "notDuplicateOf" | "favorite"
  >,
): Pick<Article, "aliases" | "types" | "notDuplicateOf" | "favorite"> {
  const keepSlug = slugify(keep.name);
  const aliases = [
    ...new Set([...keep.aliases, slugify(removed.name), ...removed.aliases]),
  ].filter((alias) => alias !== keepSlug);
  const types = mergeTypes(keep.types, removed.types);
  const notDuplicateOf: ID[] = [
    ...new Set([...keep.notDuplicateOf, ...removed.notDuplicateOf]),
  ].filter((id) => id !== removed.id);
  return {
    aliases,
    types,
    notDuplicateOf,
    favorite: keep.favorite || removed.favorite,
  };
}
