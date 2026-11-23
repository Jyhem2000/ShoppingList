import type { Article } from "./model";

/**
 * Saisonnalité (docs/03 D3). Un article est « de saison » un mois donné s'il a des mois
 * de saison, pas tous les douze, et que ce mois en fait partie : un article de saison
 * toute l'année (carottes, thym) n'a pas de pastille, elle ne lui apprendrait rien.
 */
export type Seasonal = Pick<Article, "seasonMonths">;

export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** Catégories du catalogue dont les articles ont une saison (calendrier de la fiche). */
export const SEASON_CATEGORIES: readonly string[] = [
  "fruits",
  "legumes",
  "herbes-aromatiques",
];

/**
 * Calendrier proposé dans la fiche : article d'une catégorie de saison, ou qui a déjà
 * des mois (saisis à la main dans une autre catégorie).
 */
export function showsSeason(
  article: Seasonal,
  categoryKey: string | undefined,
): boolean {
  return (
    (categoryKey !== undefined && SEASON_CATEGORIES.includes(categoryKey)) ||
    (article.seasonMonths?.length ?? 0) > 0
  );
}

/** Mois (1 à 12) d'une date, à l'heure du téléphone. */
export function monthOf(time: number): number {
  return new Date(time).getMonth() + 1;
}

/** A une saison : des mois, mais pas toute l'année. */
export function hasSeason(article: Seasonal): boolean {
  // Mois sans doublon (catalogue, `toggleMonth`).
  const count = article.seasonMonths?.length ?? 0;
  return count > 0 && count < MONTHS.length;
}

/** De saison ce mois-ci (pastille, filtre « De saison »). */
export function inSeason(article: Seasonal, month: number): boolean {
  return hasSeason(article) && (article.seasonMonths ?? []).includes(month);
}

/** Ajoute ou retire un mois (calendrier de la fiche article) : mois triés, sans doublon. */
export function toggleMonth(
  months: readonly number[] | undefined,
  month: number,
): number[] {
  const set = new Set(months);
  if (set.has(month)) set.delete(month);
  else set.add(month);
  return MONTHS.filter((m) => set.has(m));
}
