import { describe, expect, it } from "vitest";
import {
  changeUnit,
  convert,
  formatQuantity,
  mergeQuantity,
  unitGroup,
  unitOptionLabel,
  simplify,
  stepAmount,
  stepCount,
} from "@/domain/quantity";
import { unit, units } from "./fixtures";

function show(amount: { quantity: number; unit: { slug: string } }): string {
  return `${amount.quantity} ${amount.unit.slug}`;
}

describe("convert et changeUnit (docs/02 § 5)", () => {
  it("convertit entre unités de même dimension", () => {
    expect(convert(1200, unit("g"), unit("kg"))).toBe(1.2);
    expect(convert(1.5, unit("l"), unit("cl"))).toBe(150);
    expect(convert(0.1, unit("kg"), unit("g"))).toBe(100);
  });

  it("ne convertit jamais une dimension « autre » ni entre dimensions", () => {
    expect(convert(2, unit("boite"), unit("bouteille"))).toBeUndefined();
    expect(convert(500, unit("g"), unit("ml"))).toBeUndefined();
    expect(convert(3, unit("piece"), unit("kg"))).toBeUndefined();
  });

  it("changer l'unité d'une ligne convertit, ou garde la quantité", () => {
    expect(changeUnit(1200, unit("g"), unit("kg"))).toBe(1.2);
    expect(changeUnit(3, unit("piece"), unit("kg"))).toBe(3);
  });
});

describe("simplify", () => {
  it.each([
    [1200, "g", "1.2 kg"],
    [1250, "ml", "1.25 l"],
    [150, "cl", "1.5 l"],
    [250, "g", "250 g"],
    [33, "cl", "33 cl"],
    [0.5, "kg", "500 g"],
    [1234.5678, "g", "1234.5678 g"],
    [6, "piece", "6 piece"],
  ])("%s %s → %s", (quantity, slug, expected) => {
    expect(show(simplify({ quantity, unit: unit(slug) }, units))).toBe(
      expected,
    );
  });
});

describe("stepAmount : − / + (docs/02 § 5)", () => {
  const step = (
    quantity: number,
    slug: string,
    direction: 1 | -1,
    options: { home?: string } = {},
  ) => {
    const result = stepAmount(
      { quantity, unit: unit(slug) },
      direction,
      units,
      { home: options.home ? unit(options.home) : undefined },
    );
    return result ? show(result) : undefined;
  };

  it.each([
    [500, "g", "550 g"],
    [950, "g", "1 kg"],
    [1, "kg", "1.5 kg"],
    [2.5, "kg", "3 kg"],
    [1.25, "kg", "1.5 kg"],
    [950, "ml", "1 l"],
    [33, "cl", "35 cl"],
    [1200, "g", "1250 g"],
    [3, "piece", "4 piece"],
  ])("+ : %s %s → %s", (quantity, slug, expected) => {
    expect(step(quantity, slug, 1)).toBe(expected);
  });

  it.each([
    [1.5, "kg", "1 kg"],
    [1.25, "kg", "1 kg"],
    [1, "kg", "950 g"],
    [0.5, "kg", "450 g"],
    [550, "g", "500 g"],
    [1, "l", "95 cl"],
    [2, "piece", "1 piece"],
  ])("− : %s %s → %s", (quantity, slug, expected) => {
    expect(step(quantity, slug, -1)).toBe(expected);
  });

  it("− repasse à l'unité de l'article, sans jamais en descendre", () => {
    expect(step(1, "l", -1, { home: "ml" })).toBe("950 ml");
    expect(step(1, "kg", -1, { home: "g" })).toBe("950 g");
    // Article au kg (pommes de terre) ou au litre (lait) : on reste dans son unité.
    expect(step(1, "kg", -1, { home: "kg" })).toBe("0.5 kg");
    expect(step(0.5, "kg", -1, { home: "kg" })).toBeUndefined();
    expect(step(1, "l", -1, { home: "l" })).toBeUndefined();
  });

  it("s'arrête au dernier pas", () => {
    expect(step(50, "g", -1)).toBeUndefined();
    expect(step(1, "piece", -1)).toBeUndefined();
  });
});

describe("stepCount : personnes ou parts", () => {
  it.each([
    [2, 1, 3],
    [2.5, 1, 3],
    [2.5, -1, 2],
    [1.5, -1, 1],
    [2, -1, 1],
    [1, -1, undefined],
  ] as const)("%s, %s → %s", (value, direction, expected) => {
    expect(stepCount(value, direction)).toBe(expected);
  });
});

describe("mergeQuantity (docs/02 § 6)", () => {
  it("même unité : additionne", () => {
    const result = mergeQuantity(
      { quantity: 2, unit: unit("kg") },
      { quantity: 1, unit: unit("kg") },
      units,
    );
    expect(result.kind === "merged" && show(result)).toBe("3 kg");
  });

  it("unités convertibles : additionne puis simplifie (300 g + 1 kg = 1,3 kg)", () => {
    const result = mergeQuantity(
      { quantity: 300, unit: unit("g") },
      { quantity: 1, unit: unit("kg") },
      units,
    );
    expect(result.kind === "merged" && show(result)).toBe("1.3 kg");
  });

  it("sans erreur d'arrondi", () => {
    const result = mergeQuantity(
      { quantity: 0.1, unit: unit("l") },
      { quantity: 0.2, unit: unit("l") },
      units,
    );
    expect(result.kind === "merged" && result.quantity).toBe(0.3);
  });

  it("unités non convertibles : l'interface demande", () => {
    expect(
      mergeQuantity(
        { quantity: 3, unit: unit("piece") },
        { quantity: 200, unit: unit("g") },
        units,
      ),
    ).toEqual({ kind: "incompatible" });
  });
});

describe("formatQuantity", () => {
  it("affiche l'abréviation, « × n » pour les pièces, le pluriel des mots", () => {
    expect(formatQuantity(1.2, unit("kg"))).toBe("1,2 kg");
    expect(formatQuantity(6, unit("l"))).toBe("6 L");
    expect(formatQuantity(3, unit("piece"))).toBe("× 3");
    expect(formatQuantity(2, unit("boite"))).toBe("2 boîtes");
    expect(formatQuantity(1, unit("boite"))).toBe("1 boîte");
    expect(formatQuantity(3, unit("bouteille"))).toBe("3 bouteilles");
  });

  it("écrit l'unité en toutes lettres dans les phrases", () => {
    expect(formatQuantity(6, unit("l"), "long")).toBe("6 litres");
    expect(formatQuantity(1, unit("l"), "long")).toBe("1 litre");
    expect(formatQuantity(1.5, unit("kg"), "long")).toBe("1,5 kilogramme");
  });
});

describe("sélecteur d'unité (docs/06 § 1)", () => {
  it("nomme les poids et volumes avec leur symbole, les autres unités en clair", () => {
    expect(unitOptionLabel(unit("g"))).toBe("gramme (g)");
    expect(unitOptionLabel(unit("l"))).toBe("litre (L)");
    expect(unitOptionLabel(unit("barquette"))).toBe("barquette");
    expect(unitOptionLabel(unit("tranche"))).toBe("tranche");
  });

  it("déduit le groupe d'une unité qui n'en a pas de sa dimension", () => {
    expect(unitGroup({ dimension: "mass" })).toBe("mass");
    expect(unitGroup({ dimension: "other" })).toBe("count");
    expect(unitGroup(unit("c-a-s"))).toBe("kitchen");
  });
});
