import type { ID } from "./model";
import {
  accentKey,
  coreWords,
  hasAccents,
  searchKey,
  compareText,
} from "./slug";

/**
 * Recherche d'articles pour la barre d'ajout (docs/07 § 7.2) : libellés et alias,
 * insensible aux accents, à la casse et au pluriel, avec une faute de frappe tolérée.
 */
export interface SearchableArticle {
  id: ID;
  name: string;
  /** Slugifiés. */
  aliases: string[];
  types?: string[];
}

/** Du plus pertinent au moins pertinent. */
export type MatchKind =
  "prefix" | "wordPrefix" | "alias" | "type" | "contains" | "typo";

const RANK: Record<MatchKind, number> = {
  prefix: 0,
  wordPrefix: 1,
  alias: 2,
  type: 3,
  contains: 4,
  typo: 5,
};

export interface SearchResult<T extends SearchableArticle> {
  article: T;
  match: MatchKind;
}

/** Vrai si `a` et `b` diffèrent d'au plus une lettre (ajout, retrait, remplacement, inversion). */
export function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) {
    // Remplacement ou inversion de deux lettres voisines.
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return (
      a[i] === b[i + 1] &&
      a[i + 1] === b[i] &&
      a.slice(i + 2) === b.slice(i + 2)
    );
  }
  const [longer, shorter] = a.length > b.length ? [a, b] : [b, a];
  return longer.slice(i + 1) === shorter.slice(i);
}

/**
 * Position du mot du libellé où commence la correspondance : chaque mot de la
 * requête commence un mot différent du libellé, dans l'ordre ; -1 sinon.
 */
function wordsStartWith(words: string[], queryWords: string[]): number {
  let from = 0;
  let first = -1;
  for (const queryWord of queryWords) {
    const index = words.findIndex(
      (word, position) => position >= from && word.startsWith(queryWord),
    );
    if (index < 0) return -1;
    if (first < 0) first = index;
    from = index + 1;
  }
  return first;
}

interface Match {
  kind: MatchKind;
  /** Position du mot trouvé dans le libellé (0 = début). */
  word: number;
}

/** Clé de recherche d'un libellé et ses mots. */
interface Label {
  key: string;
  words: string[];
}

/** Clés de recherche d'un article, calculées une fois et non à chaque lettre tapée. */
interface Prepared {
  name: Label;
  aliases: Label[];
  /** Mots des types de l'article. */
  typeWords: string[];
  /** Libellé et alias avec leurs accents, calculés au premier besoin. */
  accents?: string[];
}

function label(text: string): Label {
  const key = searchKey(text);
  return { key, words: key.split("-") };
}

// Par article : un article lu en base n'est jamais modifié, une nouvelle lecture donne
// de nouveaux objets (donc de nouvelles clés).
const preparedArticles = new WeakMap<SearchableArticle, Prepared>();

function prepare(article: SearchableArticle): Prepared {
  let prepared = preparedArticles.get(article);
  if (!prepared) {
    prepared = {
      name: label(article.name),
      aliases: article.aliases.map(label),
      typeWords: (article.types ?? []).flatMap((type) =>
        searchKey(type).split("-"),
      ),
    };
    preparedArticles.set(article, prepared);
  }
  return prepared;
}

/**
 * Début du libellé (ou d'un alias) suivi de types de l'article :
 * « citron vert », « jus d'orange », « crème liquide ».
 */
function matchesWithTypes(queryWords: string[], article: Prepared): boolean {
  const { name, aliases, typeWords } = article;
  if (queryWords.length < 2 || typeWords.length === 0) return false;
  for (let split = 1; split < queryWords.length; split++) {
    const head = queryWords.slice(0, split);
    const tail = coreWords(queryWords.slice(split).join("-"));
    const named =
      wordsStartWith(name.words, head) >= 0 ||
      aliases.some((alias) => wordsStartWith(alias.words, head) >= 0);
    if (
      named &&
      tail.length > 0 &&
      tail.every((word) => typeWords.some((t) => t.startsWith(word)))
    )
      return true;
  }
  return false;
}

function matchArticle(query: string, article: Prepared): Match | undefined {
  const { key, words } = article.name;
  if (key.startsWith(query)) return { kind: "prefix", word: 0 };
  const queryWords = query.split("-");
  const word = wordsStartWith(words, queryWords);
  if (word >= 0) return { kind: "wordPrefix", word };
  for (const alias of article.aliases) {
    if (
      alias.key.startsWith(query) ||
      wordsStartWith(alias.words, queryWords) >= 0
    )
      return { kind: "alias", word: 0 };
  }
  if (matchesWithTypes(queryWords, article)) return { kind: "type", word: 0 };
  if (key.includes(query))
    return {
      kind: "contains",
      word: Math.max(
        0,
        words.findIndex((w) => w.includes(query)),
      ),
    };
  // Faute de frappe : première lettre juste (« tomtes » ne trouve pas « Comté »).
  if (query.length < 5) return undefined;
  const firstLetter = query.slice(0, 1);
  const typo = (candidate: string) =>
    candidate.length >= 5 &&
    candidate.startsWith(firstLetter) &&
    withinOneEdit(query, candidate);
  if (typo(key)) return { kind: "typo", word: 0 };
  const typoWord = words.findIndex(typo);
  return typoWord >= 0 ? { kind: "typo", word: typoWord } : undefined;
}

/**
 * Articles correspondant à la requête, du plus pertinent au moins pertinent ;
 * à pertinence égale, le mot trouvé le plus tôt dans le libellé, puis les plus
 * achetés, puis l'ordre alphabétique. Si la requête porte des accents, les libellés
 * qui les contiennent passent devant les autres.
 */
export function searchArticles<T extends SearchableArticle>(
  query: string,
  articles: readonly T[],
  purchaseCounts: ReadonlyMap<ID, number> = new Map(),
): SearchResult<T>[] {
  const key = searchKey(query);
  if (!key) return [];
  // Accents tapés : les libellés qui les contiennent passent devant (« pâté » avant
  // « pâtes ») ; sans accents, tout ce qui correspond reste à égalité.
  const accented = hasAccents(query) ? accentKey(query) : undefined;
  const accentRank = (article: T, prepared: Prepared) => {
    if (accented === undefined) return 1;
    prepared.accents ??= [article.name, ...article.aliases].map(accentKey);
    return prepared.accents.some((text) => text.includes(accented)) ? 0 : 1;
  };
  const results: (SearchResult<T> & { word: number; accent: number })[] = [];
  for (const article of articles) {
    const prepared = prepare(article);
    const match = matchArticle(key, prepared);
    if (match)
      results.push({
        article,
        match: match.kind,
        word: match.word,
        accent: accentRank(article, prepared),
      });
  }
  return results
    .sort(
      (a, b) =>
        a.accent - b.accent ||
        RANK[a.match] - RANK[b.match] ||
        a.word - b.word ||
        (purchaseCounts.get(b.article.id) ?? 0) -
          (purchaseCounts.get(a.article.id) ?? 0) ||
        compareText(a.article.name, b.article.name),
    )
    .map(({ article, match }) => ({ article, match }));
}
