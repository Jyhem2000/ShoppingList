import { describe, expect, it } from "vitest";
import {
  dismissSuggestion,
  isDismissed,
  purchaseRhythms,
  restockSuggestions,
  tourCategories,
} from "@/domain/suggestions";
import { article, categories } from "./fixtures";

const DAY = 86_400_000;
const bought = (articleId: string, day: number) => ({
  articleId,
  at: day * DAY,
});
/** Achats d'un article tous les `every` jours, le dernier au jour `last`. */
const every = (articleId: string, every: number, last: number, count = 4) =>
  Array.from({ length: count }, (_, i) =>
    bought(articleId, last - (count - 1 - i) * every),
  );
const options = (now: number, extra = {}) => ({
  inList: new Set<string>(),
  exists: () => true,
  dismissed: [],
  lastClosedAt: undefined,
  now: now * DAY,
  ...extra,
});

describe("rythme d'achat (docs/07 § 7.7)", () => {
  it("intervalle médian et dernier achat, à partir de 3 achats", () => {
    const rhythms = purchaseRhythms([
      bought("lait", 0),
      bought("lait", 7),
      bought("lait", 30), // une absence (vacances) ne fausse pas la médiane
      bought("lait", 36),
      bought("beurre", 0),
      bought("beurre", 10),
    ]);
    expect(rhythms.get("lait")).toEqual({ interval: 7 * DAY, last: 36 * DAY });
    expect(rhythms.has("beurre")).toBe(false);
  });

  it("deux achats du même jour comptent pour un", () => {
    const rhythms = purchaseRhythms([
      bought("pain", 0),
      bought("pain", 0.1),
      bought("pain", 2),
      { articleId: "pain", at: 2 * DAY + 3600_000 },
    ]);
    // Deux occasions seulement : pas encore de rythme.
    expect(rhythms.has("pain")).toBe(false);
  });

  it("une occasion ne s'étire pas d'achat en achat", () => {
    const HOUR = 3600_000;
    // 11 h d'écart à chaque fois : une occasion dure 12 h depuis son premier achat,
    // d'où trois occasions (8 h-19 h, 30 h-41 h, 52 h), pas une seule.
    const rhythms = purchaseRhythms(
      [8, 19, 30, 41, 52].map((hour) => ({
        articleId: "pain",
        at: hour * HOUR,
      })),
    );
    expect(rhythms.get("pain")).toEqual({
      interval: 16.5 * HOUR,
      last: 52 * HOUR,
    });
  });
});

describe("suggestions anti-oubli (docs/03 D1)", () => {
  const rhythms = purchaseRhythms([
    ...every("lait", 7, 20), // 90 % de 7 j = 6,3 j
    ...every("beurre", 14, 10),
    ...every("farine", 30, 25),
  ]);

  it("suggéré à 90 % de l'intervalle, les plus en retard d'abord", () => {
    // Jour 27 : lait 7 j / 7 = 1 ; beurre 17 j / 14 ≈ 1,2 ; farine 2 j / 30.
    expect(
      restockSuggestions(rhythms, options(27)).map((s) => s.articleId),
    ).toEqual(["beurre", "lait"]);
    // Jour 26 : lait 6 j < 6,3 j, pas encore.
    expect(
      restockSuggestions(rhythms, options(26)).map((s) => s.articleId),
    ).toEqual(["beurre"]);
  });

  it("ni ce qui est dans la liste, ni un article supprimé, ni plus de 5", () => {
    expect(
      restockSuggestions(
        rhythms,
        options(27, {
          inList: new Set(["beurre"]),
          exists: (id: string) => id !== "lait",
        }),
      ),
    ).toEqual([]);
    const many = purchaseRhythms(
      Array.from({ length: 7 }, (_, i) => every(`a${i}`, 7, 0)).flat(),
    );
    expect(restockSuggestions(many, options(10))).toHaveLength(5);
  });

  it("« Pas cette fois » : masqué jusqu'aux prochaines courses terminées", () => {
    const dismissed = dismissSuggestion([], "beurre", 20 * DAY, 27 * DAY);
    const at27 = (lastClosedAt: number) =>
      restockSuggestions(rhythms, options(27, { dismissed, lastClosedAt })).map(
        (s) => s.articleId,
      );
    expect(at27(20 * DAY)).toEqual(["lait"]);
    // Courses terminées après l'écart : il revient s'il n'a pas été acheté.
    expect(at27(28 * DAY)).toEqual(["beurre", "lait"]);
    expect(isDismissed("beurre", dismissed, 28 * DAY)).toBe(false);
    // Les écarts caducs sont retirés au passage.
    expect(dismissSuggestion(dismissed, "lait", 28 * DAY, 29 * DAY)).toEqual([
      { articleId: "lait", at: 29 * DAY },
    ]);
  });
});

describe("tour de la cuisine (docs/03 D2)", () => {
  it("par catégorie : favoris et articles achetés au moins 2 fois", () => {
    const lait = article("Lait");
    const beurre = { ...article("Beurre"), favorite: true };
    const creme = article("Crème fraîche");
    const pommes = article("Pommes");
    const groups = tourCategories(
      categories,
      [lait, beurre, creme, pommes],
      new Map([
        [lait.id, 5],
        [creme.id, 1],
        [pommes.id, 1],
      ]),
    );
    const dairy = groups.find((g) => g.category.id === lait.categoryId);
    expect(dairy?.articles.map((a) => a.name)).toEqual(["Lait", "Beurre"]);
    expect(groups.some((g) => g.category.id === pommes.categoryId)).toBe(false);
  });
});
