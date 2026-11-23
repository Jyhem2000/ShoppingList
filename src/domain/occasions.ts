/**
 * Occasions d'achat (docs/07 § 7.7, § 7.14) : brique commune du rythme d'achat
 * (anti-oubli) et de l'unité selon l'usage.
 */

/** Achats d'un article à moins de 12 heures du premier de l'occasion : une seule fois. */
const SAME_OCCASION_MS = 12 * 60 * 60 * 1000;

/**
 * Les achats à moins de 12 heures du premier achat de l'occasion (deux lignes, deux
 * magasins le même jour) comptent pour un. Renvoie l'heure du dernier achat de chaque
 * occasion, dans l'ordre.
 */
export function purchaseOccasions(times: readonly number[]): number[] {
  const sorted = [...times].sort((a, b) => a - b);
  const occasions: number[] = [];
  let start = -Infinity;
  for (const at of sorted) {
    if (at - start < SAME_OCCASION_MS) occasions[occasions.length - 1] = at;
    else {
      start = at;
      occasions.push(at);
    }
  }
  return occasions;
}
