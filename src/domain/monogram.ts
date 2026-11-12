/**
 * Monogramme d'un article sans icône (docs/05 § 4) : initiales des deux premiers
 * mots significatifs. « Sauce nuoc-mâm » → « SN », « Lessive » → « L »,
 * « Pain de mie » → « PM », « L'huile d'olive » → « HO ».
 */
const SMALL_WORDS = new Set([
  "de",
  "du",
  "des",
  "la",
  "le",
  "les",
  "à",
  "au",
  "aux",
  "en",
  "et",
  "a",
  "an",
  "the",
  "of",
]);

export function monogram(label: string): string {
  const words = label
    .trim()
    .split(/\s+/)
    // « l'huile » → « huile », « d'olive » → « olive »
    .map((word) => word.replace(/^[ldLD]['’]/, ""))
    .filter((word) => /\p{L}|\p{N}/u.test(word));
  const significant = words.filter(
    (word) => !SMALL_WORDS.has(word.toLocaleLowerCase("fr")),
  );
  const chosen = (significant.length > 0 ? significant : words).slice(0, 2);
  const letters = chosen
    .map((word) => /[\p{L}\p{N}]/u.exec(word)?.[0] ?? "")
    .join("");
  return letters.toLocaleUpperCase("fr") || "?";
}
