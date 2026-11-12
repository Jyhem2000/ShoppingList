import type { Article, Unit } from "./model";
import { simplify, type Amount } from "./quantity";
import { searchArticles } from "./search";
import { accentKey, coreWords, searchKey, slugify } from "./slug";

/**
 * Saisie naturelle (docs/03 § A2, docs/07 § 7.3) : « 2 baguettes, du beurre et
 * 6 œufs » → trois lignes. `parseEntry` découpe et lit quantités et unités ;
 * `resolveEntry` trouve ensuite l'article et ses types.
 */
export interface ParsedEntry {
  text: string;
  quantity?: number;
  unitSlug?: string;
}

export type ParsingUnit = Pick<
  Unit,
  "slug" | "singular" | "plural" | "abbr" | "aliases"
>;

const NUMBER_WORDS: Record<string, number> = {
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  onze: 11,
  douze: 12,
  treize: 13,
  quatorze: 14,
  quinze: 15,
  seize: 16,
  "dix-sept": 17,
  "dix-huit": 18,
  "dix-neuf": 19,
  vingt: 20,
};

const DOZEN = new Set(["douzaine", "douzaines"]);
const HALF_DOZEN = new Set(["demi-douzaine", "demi-douzaines"]);

/** Segments : `,` (sauf virgule décimale), `;`, `et`, retour à la ligne. */
const SEPARATORS = /\s*(?:[;\n]|(?<!\d),|,(?!\d)|\s+et\s+)\s*/i;
/** Partitifs et articles en tête : du, de la, de l', des, d', de, l'. */
const PARTITIVE = /^(?:(?:de\s+l|d|l)['’]\s*|(?:du|des|de\s+la|de)\s+)/i;
const NUMBER = /^(\d+(?:[.,]\d+)?)(.*)$/;
const TIMES = /^[x×*](\d+(?:[.,]\d+)?)$/i;

function toNumber(text: string): number {
  return Number(text.replace(",", "."));
}

function unitIndex(units: readonly ParsingUnit[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const unit of units) {
    const names = [
      unit.slug,
      unit.singular,
      unit.plural,
      unit.abbr ?? "",
      ...unit.aliases,
    ];
    for (const name of names) {
      const key = searchKey(name);
      if (key && !index.has(key)) index.set(key, unit.slug);
    }
  }
  return index;
}

interface Quantity {
  quantity: number;
  unitSlug?: string;
  /** Nombre de mots lus. */
  length: number;
}

/** Quantité au début des mots : `3`, `500g`, `1,5 kg`, `deux`, `une douzaine`. */
function leadingQuantity(
  words: string[],
  units: Map<string, string>,
): Quantity | undefined {
  const [first = "", second = ""] = words;
  const firstKey = slugify(first);
  let result: Quantity | undefined;
  const numeric = NUMBER.exec(first);
  if (numeric) {
    const [, digits = "", glued = ""] = numeric;
    const gluedUnit = glued ? units.get(searchKey(glued)) : undefined;
    if (glued && !gluedUnit) return undefined;
    result = { quantity: toNumber(digits), unitSlug: gluedUnit, length: 1 };
  } else if (HALF_DOZEN.has(firstKey)) {
    return { quantity: 6, length: 1 };
  } else if (DOZEN.has(firstKey)) {
    return { quantity: 12, length: 1 };
  } else if (firstKey in NUMBER_WORDS) {
    result = { quantity: NUMBER_WORDS[firstKey] ?? 1, length: 1 };
  } else {
    return undefined;
  }
  const secondKey = slugify(second);
  if (DOZEN.has(secondKey))
    return { quantity: result.quantity * 12, length: 2 };
  if (HALF_DOZEN.has(secondKey))
    return { quantity: result.quantity * 6, length: 2 };
  // Unité séparée du nombre, s'il reste un article après : « 2 pots de moutarde ».
  const unit = result.unitSlug ? undefined : units.get(searchKey(second));
  if (unit && words.length > 2) return { ...result, unitSlug: unit, length: 2 };
  return result;
}

/** Quantité à la fin des mots : `x3`, `*3`, `x 3`, `500 g`, `500g`, `3`. */
function trailingQuantity(
  words: string[],
  units: Map<string, string>,
): Quantity | undefined {
  if (words.length < 2) return undefined;
  const last = words.at(-1) ?? "";
  const beforeLast = words.at(-2) ?? "";
  const times = TIMES.exec(last);
  if (times) return { quantity: toNumber(times[1] ?? ""), length: 1 };
  if (/^[x×*]$/i.test(beforeLast) && /^\d+(?:[.,]\d+)?$/.test(last))
    return { quantity: toNumber(last), length: 2 };
  const numeric = NUMBER.exec(last);
  if (numeric) {
    const [, digits = "", glued = ""] = numeric;
    if (!glued) return { quantity: toNumber(digits), length: 1 };
    const unit = units.get(searchKey(glued));
    return unit
      ? { quantity: toNumber(digits), unitSlug: unit, length: 1 }
      : undefined;
  }
  const unit = units.get(searchKey(last));
  if (unit && words.length > 2 && /^\d+(?:[.,]\d+)?$/.test(beforeLast))
    return { quantity: toNumber(beforeLast), unitSlug: unit, length: 2 };
  return undefined;
}

function parseSegment(
  segment: string,
  units: Map<string, string>,
): ParsedEntry | undefined {
  let words = segment.split(/\s+/).filter(Boolean);
  let found = leadingQuantity(words, units);
  if (found) {
    words = words.slice(found.length);
  } else {
    found = trailingQuantity(words, units);
    if (found) words = words.slice(0, words.length - found.length);
  }
  const text = words.join(" ").replace(PARTITIVE, "").trim();
  if (!text) return undefined;
  const entry: ParsedEntry = { text };
  if (found) entry.quantity = found.quantity;
  if (found?.unitSlug) entry.unitSlug = found.unitSlug;
  return entry;
}

/** Découpe une saisie en lignes et lit leurs quantités et unités. */
export function parseEntry(
  text: string,
  units: readonly ParsingUnit[],
): ParsedEntry[] {
  const index = unitIndex(units);
  return text
    .trim()
    .split(SEPARATORS)
    .map((segment) => parseSegment(segment.trim(), index))
    .filter((entry) => entry !== undefined);
}

export type ResolvableArticle = Pick<
  Article,
  "id" | "name" | "aliases" | "types"
>;

export interface ResolvedEntry<A extends ResolvableArticle> {
  /** Absent : article inconnu, à créer. */
  article?: A;
  acceptedTypes: string[];
}

/** Les mots restants désignent-ils des types de l'article ? (`gala` → « Gala ») */
function matchTypes(rest: string[], types: string[]): string[] | undefined {
  const byKey = new Map(
    types.map((type) => [coreWords(searchKey(type)).join("-"), type]),
  );
  const words = coreWords(rest.join("-"));
  if (words.length === 0) return undefined;
  const whole = byKey.get(words.join("-"));
  if (whole) return [whole];
  const matched = words.map((word) => byKey.get(word));
  return matched.every((type) => type !== undefined) ? matched : undefined;
}

/**
 * Trouve l'article d'une saisie : libellé ou alias exact sur le texte complet,
 * puis sur des débuts de plus en plus courts dont la suite désigne des types de
 * l'article (`pommes gala`) ; à défaut, le meilleur résultat de recherche.
 */
export function resolveEntry<A extends ResolvableArticle>(
  text: string,
  articles: readonly A[],
): ResolvedEntry<A> {
  const words = searchKey(text).split("-").filter(Boolean);
  if (words.length === 0) return { acceptedTypes: [] };
  const exact = new Map<string, { article: A; label: string }[]>();
  for (const article of articles) {
    for (const label of [article.name, ...article.aliases]) {
      const key = searchKey(label);
      const found = exact.get(key) ?? [];
      if (!found.some((f) => f.article === article))
        found.push({ article, label });
      exact.set(key, found);
    }
  }
  // Libellés qui ne diffèrent que par les accents ou le pluriel (« pâté », « pâtes ») :
  // la saisie exacte, puis le pluriel tapé, puis les accents tapés ; sinon le premier
  // résultat de la recherche.
  const pick = (found: { article: A; label: string }[], typed: string) => {
    if (found.length === 1) return found[0]?.article;
    const same = (key: (s: string) => string) =>
      found.filter((f) => key(f.label) === key(typed));
    for (const key of [
      (s: string) => s.toLocaleLowerCase("fr").normalize("NFC").trim(),
      slugify,
      accentKey,
    ]) {
      const matched = same(key);
      if (matched.length === 1) return matched[0]?.article;
    }
    const candidates = found.map((f) => f.article);
    return searchArticles(typed, candidates)[0]?.article ?? candidates[0];
  };
  // Mêmes coupures que la clé de recherche, pour garder les accents et le pluriel tapés.
  const typedWords = text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  for (let length = words.length; length > 0; length--) {
    const found = exact.get(words.slice(0, length).join("-"));
    if (!found) continue;
    const article = pick(found, typedWords.slice(0, length).join(" "));
    if (!article) continue;
    const rest = words.slice(length);
    if (rest.length === 0) return { article, acceptedTypes: [] };
    const types = matchTypes(rest, article.types);
    if (types) return { article, acceptedTypes: types };
  }
  const [best] = searchArticles(text, articles);
  return best
    ? { article: best.article, acceptedTypes: [] }
    : { acceptedTypes: [] };
}

/**
 * Quantité et unité de la ligne : celles saisies, sinon celles de l'article
 * (quantité par défaut, ou 1, ou le pas de l'unité s'il est plus grand) ; l'unité
 * saisie l'emporte toujours. Une quantité ou une unité tapée est simplifiée si le
 * réglage est actif (1200 g → 1,2 kg) ; la quantité par défaut de l'article, jamais
 * (0,5 kg reste 0,5 kg).
 */
export function entryAmount(
  entry: ParsedEntry,
  article: Pick<Article, "defaultUnitId" | "defaultQuantity">,
  units: readonly Unit[],
  simplifyQuantities: boolean,
): Amount<Unit> | undefined {
  const typed = entry.unitSlug
    ? units.find((u) => u.slug === entry.unitSlug)
    : undefined;
  const unit = typed ?? units.find((u) => u.id === article.defaultUnitId);
  if (!unit) return undefined;
  const quantity =
    entry.quantity ??
    (unit.id === article.defaultUnitId ? article.defaultQuantity : undefined) ??
    Math.max(1, unit.step);
  const amount = { quantity, unit };
  const entered = entry.quantity !== undefined || entry.unitSlug !== undefined;
  return simplifyQuantities && entered ? simplify(amount, units) : amount;
}
