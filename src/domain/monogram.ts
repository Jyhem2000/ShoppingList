import { appLanguage, type ByLanguage } from "./language";

/**
 * Monogramme d'un article sans icône (docs/05 § 4) : initiales des deux premiers
 * mots significatifs. « Sauce nuoc-mâm » → « SN », « Lessive » → « L »,
 * « Pain de mie » → « PM », « L'huile d'olive » → « HO » ; en anglais,
 * « Tuna in brine » → « TB », « Salt and vinegar crisps » → « SV ».
 */
const SMALL_WORDS: ByLanguage<ReadonlySet<string>> = {
  fr: new Set([
    "de",
    "du",
    "des",
    "la",
    "le",
    "les",
    "à",
    "a",
    "au",
    "aux",
    "en",
    "et",
  ]),
  en: new Set(["a", "an", "the", "of", "and", "in", "with", "for"]),
};

export function monogram(label: string): string {
  const small = SMALL_WORDS[appLanguage()];
  const words = label
    .trim()
    .split(/\s+/)
    // « l'huile » → « huile », « d'olive » → « olive »
    .map((word) => word.replace(/^[ldLD]['’]/, ""))
    .filter((word) => /\p{L}|\p{N}/u.test(word));
  const significant = words.filter((word) => !small.has(word.toLowerCase()));
  const chosen = (significant.length > 0 ? significant : words).slice(0, 2);
  const letters = chosen
    .map((word) => /[\p{L}\p{N}]/u.exec(word)?.[0] ?? "")
    .join("");
  return letters.toUpperCase() || "?";
}
