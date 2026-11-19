/**
 * Slug et clé de recherche (docs/02 § 1, docs/07 § 7.1).
 *
 * Le slug sert à l'unicité et à reconnaître un objet ; il ne traduit rien. La clé
 * de recherche, plus tolérante (singulier approximatif), ne sert qu'à la recherche.
 */
export function slugify(label: string): string {
  return label
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

const LATIN_WORD = /^[a-z0-9]+$/;

/**
 * Mots de liaison ignorés quand on compare des types (« jus d'orange » → type
 * « orange », « champignons de Paris » → type « de Paris »).
 */
export const LINK_WORDS: ReadonlySet<string> = new Set([
  "a",
  "au",
  "aux",
  "d",
  "de",
  "des",
  "du",
  "en",
  "l",
  "la",
  "le",
  "ou",
]);

/** Mots d'une clé de recherche, sans les mots de liaison. */
export function coreWords(key: string): string[] {
  return key.split("-").filter((word) => word && !LINK_WORDS.has(word));
}

/**
 * Slug puis retrait d'un `s` ou `x` final de chaque mot de plus de 3 lettres
 * (règle du français, mots en alphabet latin seulement) : `oeufs` → `oeuf`.
 */
export function searchKey(label: string): string {
  return slugify(label)
    .split("-")
    .map((word) =>
      word.length > 3 && LATIN_WORD.test(word)
        ? word.replace(/[sx]$/, "")
        : word,
    )
    .join("-");
}

/**
 * Clé de recherche qui garde les accents (`Pâté` → `pâté`, `Pâtes` → `pâte`) :
 * départage deux libellés qui ne diffèrent que par leurs accents, quand on les tape.
 */
export function accentKey(label: string): string {
  return label
    .toLocaleLowerCase("fr")
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .map((word) => (word.length > 3 ? word.replace(/[sx]$/, "") : word))
    .join("-");
}

/** « pommes » → « Pommes » : première lettre en majuscule, espaces autour retirés. */
export function capitalize(text: string): string {
  const clean = text.trim();
  return clean.charAt(0).toLocaleUpperCase("fr") + clean.slice(1);
}

/** Clé d'un type : son slug, ou son texte s'il n'en a pas (« 🌶️ »). */
function typeKey(type: string): string {
  return slugify(type) || type.trim();
}

/**
 * Types réunis sans doublon (même slug) : ceux de `added` qui manquent à `types`,
 * dans l'ordre, après eux (docs/02 § 6). Un type vide est ignoré.
 */
export function mergeTypes(
  types: readonly string[],
  added: readonly string[],
): string[] {
  const keys = new Set(types.map(typeKey));
  const result = [...types];
  for (const type of added) {
    const key = typeKey(type);
    if (!key || keys.has(key)) continue;
    keys.add(key);
    result.push(type.trim());
  }
  return result;
}

/**
 * Alias d'un article après l'ajout de `text` (son slug) : inchangés s'il est vide,
 * égal au slug de l'article ou déjà connu.
 */
export function addAlias(
  article: { slug: string; aliases: readonly string[] },
  text: string,
): string[] {
  const alias = slugify(text);
  return alias && alias !== article.slug && !article.aliases.includes(alias)
    ? [...article.aliases, alias]
    : [...article.aliases];
}

const collator = new Intl.Collator("fr");

/**
 * Comparaison de deux textes dans l'ordre alphabétique français. Un seul
 * `Intl.Collator` pour toute l'app : `localeCompare(…, "fr")` en recrée un à chaque
 * appel, lent sous WebKit.
 */
export function compareText(a: string, b: string): number {
  return collator.compare(a, b);
}

/** Tri par nom, dans l'ordre alphabétique français. */
export function byName(a: { name: string }, b: { name: string }): number {
  return collator.compare(a.name, b.name);
}

/** La saisie contient-elle des accents ? (sinon, on ne départage pas par eux) */
export function hasAccents(text: string): boolean {
  return /[̀-ͯ]/.test(text.normalize("NFD"));
}
