import { describe, expect, it } from "vitest";
import type { Recipe } from "@/domain/model";
import { planRecipeAdd, recipeMerge, scaleRecipe } from "@/domain/recipes";
import { unit, units } from "./fixtures";

const ingredient = (
  articleId: string,
  quantity: number,
  unitSlug: string,
  extra: Partial<Recipe["ingredients"][number]> = {},
): Recipe["ingredients"][number] => ({
  articleId,
  quantity,
  unitId: unit(unitSlug).id,
  acceptedTypes: [],
  optional: false,
  fixed: false,
  ...extra,
});

const recipe = (
  quantity: number,
  yieldUnit: string,
  ingredients: Recipe["ingredients"],
): Pick<Recipe, "yield" | "ingredients"> => ({
  yield: { quantity, unit: yieldUnit },
  ingredients,
});

const amounts = (scaled: { quantity: number; unitId: string }[]) =>
  scaled.map(({ quantity, unitId }) => [
    quantity,
    units.find((candidate) => candidate.id === unitId)?.slug,
  ]);

describe("recalcul d'une recette (docs/03 E2)", () => {
  const tart = recipe(4, "personnes", [
    ingredient("oignons", 2, "piece"),
    ingredient("farine", 500, "g"),
  ]);

  it("pour 6 au lieu de 4 : 3 oignons et 750 g de farine", () => {
    expect(amounts(scaleRecipe(tart, 6, units))).toEqual([
      [3, "piece"],
      [750, "g"],
    ]);
  });

  it("arrondit au pas supérieur de l'unité : 1,5 oignon → 2, 375 g → 400 g", () => {
    expect(amounts(scaleRecipe(tart, 3, units))).toEqual([
      [2, "piece"],
      [400, "g"],
    ]);
  });

  it("simplifie après le calcul : 2 kg de farine pour 16", () => {
    expect(amounts(scaleRecipe(tart, 16, units))[1]).toEqual([2, "kg"]);
  });

  it("garde les quantités de la fiche pour son propre rendement", () => {
    const sauce = recipe(4, "personnes", [ingredient("beurre", 20, "g")]);
    expect(amounts(scaleRecipe(sauce, 4, units))).toEqual([[20, "g"]]);
  });

  it("« 1 cake » avec 3 œufs, pour 2 cakes → 6 œufs", () => {
    const cake = recipe(1, "cake", [ingredient("oeufs", 3, "piece")]);
    expect(amounts(scaleRecipe(cake, 2, units))).toEqual([[6, "piece"]]);
  });

  it("une quantité fixe ne suit pas le rendement : raclette pour 10 → 1 pot", () => {
    const raclette = recipe(4, "personnes", [
      ingredient("creme", 1, "pot", { fixed: true }),
      ingredient("pommes-de-terre", 1, "kg"),
    ]);
    expect(amounts(scaleRecipe(raclette, 10, units))).toEqual([
      [1, "pot"],
      [2.5, "kg"],
    ]);
  });
});

describe("aperçu de l'ajout à une liste (docs/02 § 7)", () => {
  const tart = recipe(4, "personnes", [
    ingredient("oignons", 2, "piece"),
    ingredient("farine", 500, "g"),
    ingredient("lardons", 200, "g", { optional: true }),
  ]);

  it("décoche les facultatifs et montre la quantité déjà dans la liste", () => {
    const target = [
      {
        id: "l1",
        articleId: "farine",
        quantity: 1,
        unitId: unit("kg").id,
        acceptedTypes: [],
      },
    ];
    const plan = planRecipeAdd(tart, 6, target, units);
    expect(plan.map((line) => line.checked)).toEqual([true, true, false]);
    expect(plan[0]?.existing).toBeUndefined();
    expect(plan[0]?.result.kind).toBe("new");
    // 1 kg de farine déjà dans la liste + 750 g → 1,75 kg.
    expect(plan[1]?.existing).toMatchObject({ id: "l1", quantity: 1 });
    expect(plan[1]?.result).toMatchObject({
      existingId: "l1",
      quantity: 1.75,
      unitId: unit("kg").id,
      kind: "merged",
    });
  });

  it("ne fusionne qu'avec la ligne aux mêmes types", () => {
    const apples = recipe(4, "personnes", [
      ingredient("pommes", 3, "piece", { acceptedTypes: ["Golden"] }),
    ]);
    const target = [
      {
        id: "any",
        articleId: "pommes",
        quantity: 2,
        unitId: unit("piece").id,
        acceptedTypes: [],
      },
      {
        id: "golden",
        articleId: "pommes",
        quantity: 1,
        unitId: unit("piece").id,
        acceptedTypes: ["golden"],
      },
    ];
    const [line] = planRecipeAdd(apples, 4, target, units);
    expect(line?.existing?.id).toBe("golden");
    expect(line?.result).toMatchObject({ quantity: 4, kind: "merged" });
  });

  it("unités non convertibles : la quantité de la recette passe en note", () => {
    const target = [
      {
        id: "l1",
        articleId: "oignons",
        quantity: 1,
        unitId: unit("kg").id,
        acceptedTypes: [],
      },
    ];
    const [line] = planRecipeAdd(tart, 4, target, units);
    expect(line?.result).toMatchObject({
      existingId: "l1",
      quantity: 1,
      unitId: unit("kg").id,
      note: "+ × 2",
      kind: "note",
    });
  });

  it("n'ajoute que les ingrédients cochés, en additionnant un article présent deux fois", () => {
    const doubled = recipe(4, "personnes", [
      ingredient("beurre", 100, "g"),
      ingredient("farine", 500, "g"),
      ingredient("beurre", 150, "g"),
    ]);
    const plan = planRecipeAdd(doubled, 4, [], units).map((line) =>
      line.articleId === "farine" ? { ...line, checked: false } : line,
    );
    expect(recipeMerge(plan, [], units)).toEqual([
      expect.objectContaining({
        articleId: "beurre",
        quantity: 250,
        unitId: unit("g").id,
        kind: "new",
      }),
    ]);
  });
});
