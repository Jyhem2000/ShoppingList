import { describe, expect, it } from "vitest";
import { entryAmount } from "@/domain/entry";
import type { Purchase, Unit } from "@/domain/model";
import { usualAmounts, withUsualAmount } from "@/domain/usage";

const unit = (id: string, extra: Partial<Unit> = {}): Unit => ({
  id,
  slug: id,
  singular: id,
  plural: `${id}s`,
  dimension: "other",
  group: "container",
  step: 1,
  aliases: [],
  createdAt: 0,
  updatedAt: 0,
  ...extra,
});
const units = [
  unit("bouteille"),
  unit("pack"),
  unit("g", { dimension: "mass", group: "mass", factor: 1, step: 50 }),
  unit("verre", { group: "kitchen" }),
];
let at = 0;
const bought = (
  articleId: string,
  unitId: string,
  quantity = 1,
): Pick<Purchase, "articleId" | "unitId" | "quantity" | "at"> => ({
  articleId,
  unitId,
  quantity,
  at: ++at,
});

describe("unité selon l'usage (docs/03 A2)", () => {
  it("l'unité la plus achetée, seulement à partir de 3 achats", () => {
    const usual = usualAmounts(
      [
        bought("lait", "pack"),
        bought("lait", "bouteille", 2),
        bought("lait", "pack"),
        bought("beurre", "g", 250),
        bought("beurre", "g", 250),
      ],
      units,
    );
    expect(usual.get("lait")).toEqual({ unitId: "pack", quantity: 1 });
    expect(usual.has("beurre")).toBe(false);
  });

  it("la quantité la plus prise dans cette unité ; à égalité, la plus récente", () => {
    const usual = usualAmounts(
      [
        bought("comte", "g", 200),
        bought("comte", "g", 300),
        bought("comte", "g", 200),
        bought("comte", "g", 300),
      ],
      units,
    );
    expect(usual.get("comte")).toEqual({ unitId: "g", quantity: 300 });
  });

  it("ignore les unités de cuisine et les unités supprimées", () => {
    const usual = usualAmounts(
      [
        bought("vin", "verre"),
        bought("vin", "verre"),
        bought("vin", "disparue"),
        bought("vin", "bouteille"),
      ],
      units,
    );
    expect(usual.has("vin")).toBe(false);
  });

  it("l'emporte sur l'unité par défaut, sauf choisie à la main", () => {
    const lait = { defaultUnitId: "bouteille", defaultQuantity: undefined };
    const usual = { unitId: "pack", quantity: 1 };
    expect(
      entryAmount({ text: "lait" }, withUsualAmount(lait, usual), units, true),
    ).toMatchObject({ quantity: 1, unit: { id: "pack" } });
    // Nombre tapé sans unité : dans l'unité habituelle.
    expect(
      entryAmount(
        { text: "lait", quantity: 2 },
        withUsualAmount(lait, usual),
        units,
        true,
      ),
    ).toMatchObject({ quantity: 2, unit: { id: "pack" } });
    // Unité tapée : elle l'emporte.
    expect(
      entryAmount(
        { text: "lait", quantity: 1, unitSlug: "bouteille" },
        withUsualAmount(lait, usual),
        units,
        true,
      ),
    ).toMatchObject({ unit: { id: "bouteille" } });
    expect(
      withUsualAmount({ ...lait, defaultUnitChosen: true }, usual),
    ).toEqual({ ...lait, defaultUnitChosen: true });
  });

  it("même unité que celle par défaut : la quantité par défaut est gardée", () => {
    const oeufs = { defaultUnitId: "pack", defaultQuantity: 6 };
    expect(withUsualAmount(oeufs, { unitId: "pack", quantity: 1 })).toBe(oeufs);
  });
});
