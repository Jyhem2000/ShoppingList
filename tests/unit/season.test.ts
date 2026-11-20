import { describe, expect, it } from "vitest";
import { SEASON_ZONE, catalogData } from "@/data/catalog";
import { buildInitialData } from "@/db/seed";
import {
  MONTHS,
  SEASON_CATEGORIES,
  hasSeason,
  inSeason,
  monthOf,
  showsSeason,
  toggleMonth,
} from "@/domain/season";

describe("saisonnalité (docs/03 D3)", () => {
  it("de saison seulement pendant ses mois, y compris à cheval sur l'année", () => {
    const poireaux = { seasonMonths: [9, 10, 11, 12, 1, 2, 3, 4] };
    expect(inSeason(poireaux, 11)).toBe(true);
    expect(inSeason(poireaux, 1)).toBe(true);
    expect(inSeason(poireaux, 7)).toBe(false);
  });

  it("pas de pastille sans mois ni pour un article de toute l'année", () => {
    expect(hasSeason({})).toBe(false);
    expect(hasSeason({ seasonMonths: [] })).toBe(false);
    expect(hasSeason({ seasonMonths: [...MONTHS] })).toBe(false);
    expect(inSeason({ seasonMonths: [...MONTHS] }, 5)).toBe(false);
  });

  it("le calendrier ajoute ou retire un mois, mois triés", () => {
    expect(toggleMonth(undefined, 5)).toEqual([5]);
    expect(toggleMonth([9, 10, 1], 12)).toEqual([1, 9, 10, 12]);
    expect(toggleMonth([1, 9, 10], 9)).toEqual([1, 10]);
  });

  it("calendrier proposé dans la fiche pour les fruits, légumes et herbes", () => {
    expect(showsSeason({}, "legumes")).toBe(true);
    expect(showsSeason({}, "fromages")).toBe(false);
    expect(showsSeason({ seasonMonths: [11, 12] }, "fromages")).toBe(true);
  });

  it("mois de la date, à l'heure du téléphone", () => {
    expect(monthOf(new Date(2026, 10, 19).getTime())).toBe(11);
    expect(monthOf(new Date(2027, 0, 1).getTime())).toBe(1);
  });
});

describe("mois de saison du catalogue (docs/06 § 4)", () => {
  it("des mois valides, sans doublon, seulement pour les fruits, légumes et herbes", () => {
    for (const article of catalogData) {
      if (!article.season) continue;
      expect(SEASON_CATEGORIES, article.key).toContain(article.category);
      for (const months of Object.values(article.season)) {
        expect(new Set(months).size, article.key).toBe(months.length);
        for (const month of months)
          expect(MONTHS, article.key).toContain(month);
      }
    }
  });

  it("la plupart des fruits, légumes et herbes ont une saison", () => {
    const seasonal = catalogData.filter((a) =>
      SEASON_CATEGORIES.includes(a.category),
    );
    const withMonths = seasonal.filter((a) => a.season?.[SEASON_ZONE]);
    expect(withMonths.length).toBeGreaterThan(seasonal.length * 0.75);
  });

  it("copiés dans l'article au premier lancement, pour la zone de l'app", () => {
    const { articles } = buildInitialData(0);
    const fraises = articles.find((a) => a.catalogKey === "fraises");
    const bananes = articles.find((a) => a.catalogKey === "bananes");
    expect(fraises?.seasonMonths).toEqual(
      catalogData.find((a) => a.key === "fraises")?.season?.[SEASON_ZONE],
    );
    expect(bananes?.seasonMonths).toBeUndefined();
  });
});
