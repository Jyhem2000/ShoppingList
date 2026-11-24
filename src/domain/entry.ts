import type { Article, Unit } from "./model";
import {
  parseNumber,
  pieceUnit,
  simplify,
  unitGroup,
  type Amount,
} from "./quantity";
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
  "slug" | "singular" | "plural" | "abbr" | "aliases" | "group" | "dimension"
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

// Segments : virgule (jamais dans un nombre : 1,5), point-virgule, retour à la ligne,
// « et », « puis » (se dit naturellement entre deux articles), et le point d'une fin de
// phrase suivi d'une majuscule (« Des pommes. Du lait. », ajouté par la dictée) : pas
// celui d'une abréviation (« 2 tr. de jambon »).
const SEPARATOR = String.raw`[;\n]|(?<!\d),|,(?!\d)|\.(?=\s+\p{Lu})|\s+(?:[Ee][Tt]|[Pp][Uu][Ii][Ss])\s+`;
// Dans la barre d'ajout seulement, une puce restée d'une liste dont les retours à la
// ligne ont sauté : entourée d'espaces (« - beurre - lait »), ou collée au mot d'avant
// quand le retour à la ligne a disparu sans laisser d'espace (« beurre- lait »). Pas le
// trait d'union (« dix-sept »), ni « * 3 » (« lait * 3 »).
const BULLET_SEPARATOR = String.raw`\s+[•·▪◦‣∙\-–—]\s+|\s+\*\s+(?!\d)|(?<=[\p{L}\p{N}])[•·▪◦‣∙\-–—]\s+|(?<=\p{L})\*\s+(?!\d)`;
const SEPARATORS = new RegExp(String.raw`\s*(?:${SEPARATOR})\s*`, "u");
const BULLET_SEPARATORS = new RegExp(
  String.raw`\s*(?:${SEPARATOR}|${BULLET_SEPARATOR})\s*`,
  "u",
);
/**
 * Puce en début de ligne : •, -, *, case à cocher, ou numéro suivi d'une espace
 * (« 1. pain », mais pas « 2.5 kg de farine »).
 */
export const LINE_BULLET =
  /^\s*(?:(?:[•·▪◦‣∙*\-–—✓✔☐☑]|\[[ xX]?\])\s*|\d+[.)]\s+)(?:\[[ xX]?\]\s*)?(?=\S)/u;
/** Puce en tête d'un segment de la saisie (« - beurre ») : la même, sans les numéros. */
const SEGMENT_BULLET =
  /^(?:[•·▪◦‣∙*\-–—✓✔☐☑]|\[[ xX]?\])\s*(?:\[[ xX]?\]\s*)?(?=\S)/u;
/** Partitifs et articles en tête : du, de la, de l', des, d', de, l'. */
const PARTITIVE = /^(?:(?:de\s+l|d|l)['’]\s*|(?:du|des|de\s+la|de)\s+)/i;
const NUMBER = /^(\d+(?:[.,]\d+)?)(.*)$/;
const TIMES = /^[x×*](\d+(?:[.,]\d+)?)$/i;

interface UnitIndex {
  /** Nom, abréviation ou alias (clé de recherche) → slug. */
  names: Map<string, string>;
  /**
   * Unités de cuisine (verre, cuillère, pincée, décilitre) quand elles ne s'achètent pas
   * (saisie d'une liste) ; vide pour les ingrédients d'une recette.
   */
  kitchen: Set<string>;
}

function unitIndex(units: readonly ParsingUnit[], recipe: boolean): UnitIndex {
  const index = new Map<string, string>();
  const kitchen = new Set<string>();
  for (const unit of units) {
    if (!recipe && unitGroup(unit) === "kitchen") kitchen.add(unit.slug);
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
  return { names: index, kitchen };
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
  { names: units, kitchen }: UnitIndex,
): Quantity | undefined {
  const [first = "", second = ""] = words;
  const firstKey = slugify(first);
  let result: Quantity | undefined;
  const numeric = NUMBER.exec(first);
  if (numeric) {
    const [, digits = "", glued = ""] = numeric;
    const gluedUnit = glued ? units.get(searchKey(glued)) : undefined;
    if (glued && !gluedUnit) return undefined;
    result = { quantity: parseNumber(digits), unitSlug: gluedUnit, length: 1 };
  } else if (HALF_DOZEN.has(firstKey)) {
    return { quantity: 6, length: 1 };
  } else if (DOZEN.has(firstKey)) {
    return { quantity: 12, length: 1 };
  } else if (Object.hasOwn(NUMBER_WORDS, firstKey)) {
    result = { quantity: NUMBER_WORDS[firstKey] ?? 1, length: 1 };
  } else {
    return undefined;
  }
  const secondKey = slugify(second);
  if (DOZEN.has(secondKey))
    return { quantity: result.quantity * 12, length: 2 };
  if (HALF_DOZEN.has(secondKey))
    return { quantity: result.quantity * 6, length: 2 };
  // Unité séparée du nombre, s'il reste un article après : « 2 pots de moutarde ». Une
  // unité de cuisine seulement devant « de » (« 1 verre de vin ») : « 6 verres en
  // plastique » sont des verres.
  const unit = result.unitSlug ? undefined : units.get(searchKey(second));
  if (
    unit &&
    words.length > 2 &&
    (!kitchen.has(unit) || PARTITIVE.test(words.slice(2).join(" ")))
  )
    return { ...result, unitSlug: unit, length: 2 };
  return result;
}

/** Quantité à la fin des mots : `x3`, `*3`, `x 3`, `500 g`, `500g`, `3`. */
function trailingQuantity(
  words: string[],
  { names: units }: UnitIndex,
): Quantity | undefined {
  if (words.length < 2) return undefined;
  const last = words.at(-1) ?? "";
  const beforeLast = words.at(-2) ?? "";
  const times = TIMES.exec(last);
  if (times) return { quantity: parseNumber(times[1] ?? ""), length: 1 };
  if (/^[x×*]$/i.test(beforeLast) && /^\d+(?:[.,]\d+)?$/.test(last))
    return { quantity: parseNumber(last), length: 2 };
  const numeric = NUMBER.exec(last);
  if (numeric) {
    const [, digits = "", glued = ""] = numeric;
    if (!glued) return { quantity: parseNumber(digits), length: 1 };
    const unit = units.get(searchKey(glued));
    return unit
      ? { quantity: parseNumber(digits), unitSlug: unit, length: 1 }
      : undefined;
  }
  const unit = units.get(searchKey(last));
  if (unit && words.length > 2 && /^\d+(?:[.,]\d+)?$/.test(beforeLast))
    return { quantity: parseNumber(beforeLast), unitSlug: unit, length: 2 };
  return undefined;
}

function parseSegment(
  segment: string,
  units: UnitIndex,
): ParsedEntry | undefined {
  let words = segment.replace(SEGMENT_BULLET, "").split(/\s+/).filter(Boolean);
  let found = leadingQuantity(words, units);
  if (found) {
    words = words.slice(found.length);
  } else {
    found = trailingQuantity(words, units);
    if (found) words = words.slice(0, words.length - found.length);
  }
  // Sans le tiret ou les deux-points qui séparaient la quantité (« Lait - 2 L »).
  const text = words
    .join(" ")
    .replace(PARTITIVE, "")
    .replace(/\s*[-–—:]$/u, "")
    .trim();
  if (!text) return undefined;
  const entry: ParsedEntry = { text };
  // Unité de cuisine : on n'achète pas « 1 verre » de vin, la ligne prend la quantité
  // habituelle de l'article (comme l'ajout d'une recette, docs/02 § 7).
  if (found?.unitSlug && units.kitchen.has(found.unitSlug)) return entry;
  if (found) entry.quantity = found.quantity;
  if (found?.unitSlug) entry.unitSlug = found.unitSlug;
  return entry;
}

/**
 * Liste collée dans la barre d'ajout (Notes, une autre app) : le champ n'a qu'une ligne
 * et perdrait les retours à la ligne, qui deviennent des virgules ; puces et numéros
 * tombent (« - 200 g de beurre ⏎ - 3 cl de lait » → « 200 g de beurre, 3 cl de lait »).
 * Un texte d'une seule ligne reste tel quel.
 */
export function pastedEntry(text: string): string {
  const lines = text.split(/\r?\n|\r/);
  if (lines.length < 2) return text;
  return lines
    .map((line) => line.replace(LINE_BULLET, "").trim())
    .filter(Boolean)
    .join(", ");
}

/**
 * Découpe une saisie en lignes et lit leurs quantités et unités. `bullets` : une puce
 * au milieu du texte sépare aussi deux articles (barre d'ajout) ; pas dans les lignes
 * d'un texte importé, où « Lait - 2 L » est un seul article. `recipe` : ingrédients
 * d'une recette, où les unités de cuisine se lisent comme les autres ; ailleurs, elles
 * ne s'achètent pas et l'article garde sa quantité habituelle.
 */
export function parseEntry(
  text: string,
  units: readonly ParsingUnit[],
  {
    bullets = true,
    recipe = false,
  }: { bullets?: boolean; recipe?: boolean } = {},
): ParsedEntry[] {
  const index = unitIndex(units, recipe);
  return text
    .trim()
    .split(bullets ? BULLET_SEPARATORS : SEPARATORS)
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
  /** Libellé ou alias exact ; faux : meilleur résultat de la recherche. */
  exact: boolean;
}

/** Clé d'un type pour la saisie : mots significatifs de sa clé de recherche. */
function typeKey(type: string): string {
  return coreWords(searchKey(type)).join("-");
}

/**
 * Les mots restants désignent-ils des types de l'article ? (`gala` → « Gala ») ; un
 * début de type reconnu sans ambiguïté vaut le type entier (`gol` → « Golden »).
 */
function matchTypes(rest: string[], types: string[]): string[] | undefined {
  const byKey = new Map(types.map((type) => [typeKey(type), type]));
  const words = coreWords(rest.join("-"));
  if (words.length === 0) return undefined;
  const whole = byKey.get(words.join("-"));
  if (whole) return [whole];
  const matched = words.map((word) => byKey.get(word));
  if (matched.every((type) => type !== undefined)) return matched;
  const typed = words.join("-");
  const started = types.filter((type) => typeKey(type).startsWith(typed));
  return started.length === 1 ? started : undefined;
}

/** Libellés et alias exacts (clé de recherche) → articles qui les portent. */
/** Index par tableau d'articles : une liste importée le consulte à chaque ligne. */
const labelIndexes = new WeakMap<
  readonly ResolvableArticle[],
  Map<string, { article: ResolvableArticle; label: string }[]>
>();

function labelIndex<A extends ResolvableArticle>(
  articles: readonly A[],
): Map<string, { article: A; label: string }[]> {
  const cached = labelIndexes.get(articles);
  if (cached) return cached as Map<string, { article: A; label: string }[]>;
  const exact = new Map<string, { article: A; label: string }[]>();
  labelIndexes.set(articles, exact);
  for (const article of articles) {
    for (const label of [article.name, ...article.aliases]) {
      const key = searchKey(label);
      const found = exact.get(key) ?? [];
      if (!found.some((f) => f.article === article))
        found.push({ article, label });
      exact.set(key, found);
    }
  }
  return exact;
}

/**
 * Suggestions par type (docs/03 A2) : quand la saisie commence par le nom d'un article
 * et continue par le début d'un de ses types (`pommes g`), les types qui conviennent
 * (« Pommes · Gala », « Pommes · Golden »). Rien tant que l'on ne tape que le nom :
 * la liste des suggestions reste courte.
 */
export function typeSuggestions<A extends ResolvableArticle>(
  text: string,
  articles: readonly A[],
): { article: A; type: string }[] {
  const words = searchKey(text).split("-").filter(Boolean);
  if (words.length < 2) return [];
  const exact = labelIndex(articles);
  for (let length = words.length - 1; length > 0; length--) {
    const found = exact.get(words.slice(0, length).join("-"));
    if (!found) continue;
    const typed = coreWords(words.slice(length).join("-")).join("-");
    if (!typed) continue;
    const result = found.flatMap(({ article }) =>
      article.types
        .filter((type) => typeKey(type).startsWith(typed))
        .map((type) => ({ article, type })),
    );
    if (result.length) return result;
  }
  return [];
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
  const found = exactEntry(text, articles);
  if (found) return { ...found, exact: true };
  const [best] = searchArticles(text, articles);
  return best
    ? { article: best.article, acceptedTypes: [], exact: false }
    : { acceptedTypes: [], exact: false };
}

/** Libellé ou alias exact (avec ses types), sans recherche ; `undefined` sinon. */
export function exactEntry<A extends ResolvableArticle>(
  text: string,
  articles: readonly A[],
): { article: A; acceptedTypes: string[] } | undefined {
  const words = searchKey(text).split("-").filter(Boolean);
  if (words.length === 0) return undefined;
  const exact = labelIndex(articles);
  // Libellés qui ne diffèrent que par les accents ou le pluriel (« pâté », « pâtes ») :
  // la saisie exacte, puis le pluriel tapé, puis les accents tapés ; sinon le premier
  // résultat de la recherche.
  const pick = (found: { article: A; label: string }[], typed: string) => {
    if (found.length === 1) return found[0]?.article;
    const same = (key: (s: string) => string) =>
      found.filter((f) => key(f.label) === key(typed));
    for (const key of [
      (s: string) => s.toLowerCase().normalize("NFC").trim(),
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
  return undefined;
}

/**
 * Quantité et unité de la ligne : celles saisies, sinon celles de l'article
 * (quantité par défaut, ou 1, ou le pas de l'unité s'il est plus grand) ; l'unité
 * saisie l'emporte toujours. Une quantité ou une unité tapée est simplifiée si le
 * réglage est actif (1200 g → 1,2 kg) ; la quantité par défaut de l'article, jamais
 * (0,5 kg reste 0,5 kg).
 *
 * Un nombre tapé seul compte des objets (docs/03 A2) : pour un article au poids, des
 * pièces s'il se compte à la pièce, sinon N portions de sa quantité par défaut
 * (« 2 beurres » → 500 g) ; pour les autres unités, N de cette unité.
 */
export function entryAmount(
  entry: ParsedEntry,
  article: Pick<Article, "defaultUnitId" | "defaultQuantity" | "countable">,
  units: readonly Unit[],
  simplifyQuantities: boolean,
): Amount<Unit> | undefined {
  const typed = entry.unitSlug
    ? units.find((u) => u.slug === entry.unitSlug)
    : undefined;
  const defaultUnit = units.find((u) => u.id === article.defaultUnitId);
  const unit = typed ?? defaultUnit;
  if (!unit) return undefined;
  const defaultQuantity =
    (unit.id === article.defaultUnitId ? article.defaultQuantity : undefined) ??
    Math.max(1, unit.step);
  if (!typed && entry.quantity !== undefined && unit.dimension === "mass") {
    const piece = article.countable ? pieceUnit(units) : undefined;
    const amount = piece
      ? { quantity: entry.quantity, unit: piece }
      : { quantity: entry.quantity * defaultQuantity, unit };
    return simplifyQuantities ? simplify(amount, units) : amount;
  }
  const quantity = entry.quantity ?? defaultQuantity;
  const amount = { quantity, unit };
  const entered = entry.quantity !== undefined || entry.unitSlug !== undefined;
  return simplifyQuantities && entered ? simplify(amount, units) : amount;
}
