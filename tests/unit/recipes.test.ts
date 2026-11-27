import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { articleUsage, deleteArticle, mergeArticles } from "@/db/articles";
import { ShoppingDatabase } from "@/db/database";
import {
  addRecipeToList,
  createRecipe,
  duplicateRecipe,
  stepIngredient,
} from "@/db/recipes";
import { activeItems } from "@/db/items";
import { seedDatabase } from "@/db/seed";
import { deleteUnit } from "@/db/units";
import { setAppLanguage } from "@/domain/language";
import type { Recipe } from "@/domain/model";
import {
  planRecipeAdd,
  recipeMerge,
  scaleRecipe,
  uniqueRecipeName,
  yieldLabel,
} from "@/domain/recipes";
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

  it("arrondit dans la plus petite unité, quelle que soit celle de la fiche : 1 kg pour 3 au lieu de 4 → 750 g", () => {
    const cake = recipe(4, "personnes", [ingredient("farine", 1, "kg")]);
    expect(amounts(scaleRecipe(cake, 3, units))).toEqual([[750, "g"]]);
    expect(amounts(scaleRecipe(cake, 6, units))).toEqual([[1.5, "kg"]]);
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

describe("rendement en clair (docs/02 § 7)", () => {
  it("accorde l'unité au nombre demandé", () => {
    expect(yieldLabel(4, "personnes")).toBe("4 personnes");
    expect(yieldLabel(1, "personnes")).toBe("1 personne");
    expect(yieldLabel(2, "cake")).toBe("2 cakes");
    expect(yieldLabel(1, "cake")).toBe("1 cake");
    expect(yieldLabel(12, "gâteau")).toBe("12 gâteaux");
    expect(yieldLabel(1, "gâteaux")).toBe("1 gâteau");
    expect(yieldLabel(6, "part de tarte")).toBe("6 parts de tarte");
    expect(yieldLabel(1.5, "litre")).toBe("1,5 litre");
  });

  it("en anglais : pluriel sauf pour 1, et les pluriels irréguliers", () => {
    setAppLanguage("en");
    try {
      expect(yieldLabel(1, "people")).toBe("1 person");
      expect(yieldLabel(4, "People")).toBe("4 People");
      expect(yieldLabel(2, "loaf")).toBe("2 loaves");
      expect(yieldLabel(1, "loaves")).toBe("1 loaf");
      expect(yieldLabel(2, "chef")).toBe("2 chefs");
      expect(yieldLabel(1, "servings")).toBe("1 serving");
      expect(yieldLabel(3, "pastry")).toBe("3 pastries");
    } finally {
      setAppLanguage("fr");
    }
  });
});

describe("nom d'une recette reçue (docs/03 E3)", () => {
  it("garde le nom s'il est libre, sinon prend le premier numéro libre", () => {
    expect(uniqueRecipeName("Cake", ["Tarte"])).toBe("Cake");
    expect(uniqueRecipeName("Cake", ["Cake"])).toBe("Cake (2)");
    expect(uniqueRecipeName("Cake", ["cake", "Cake (2)"])).toBe("Cake (3)");
    expect(uniqueRecipeName("Cake", ["Cake", "Cake (3)"])).toBe("Cake (2)");
  });

  it("reprend le numéro d'un nom déjà numéroté", () => {
    const taken = ["Cake", "Cake (2)"];
    expect(uniqueRecipeName("Cake (2)", taken)).toBe("Cake (3)");
    expect(uniqueRecipeName("Cake (2)", [...taken, "Cake (3)"])).toBe(
      "Cake (4)",
    );
    expect(uniqueRecipeName("Cake (3)", ["Cake (3)"])).toBe("Cake (2)");
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
    const plan = planRecipeAdd(tart, 6, target, units, []);
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
    const [line] = planRecipeAdd(apples, 4, target, units, []);
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
    const [line] = planRecipeAdd(tart, 4, target, units, []);
    expect(line?.result).toMatchObject({
      existingId: "l1",
      quantity: 1,
      unitId: unit("kg").id,
      note: "+ × 2",
      kind: "note",
    });
  });

  it("unité de cuisine : la quantité de l'article sur la liste, celle de la recette en note", () => {
    const bottle = unit("bouteille").id;
    const sauce = recipe(4, "personnes", [
      ingredient("vin", 1, "verre"),
      ingredient("huile", 2, "c-a-s"),
      ingredient("sel", 1, "pincee"),
    ]);
    const articles = [
      { id: "vin", defaultUnitId: bottle },
      { id: "huile", defaultUnitId: bottle },
      // Unité par défaut elle-même de cuisine : la quantité de la recette reste.
      { id: "sel", defaultUnitId: unit("pincee").id },
    ];
    const target = [
      {
        id: "h",
        articleId: "huile",
        quantity: 2,
        unitId: bottle,
        acceptedTypes: [],
        // La même recette, déjà ajoutée une fois.
        note: "4 c. à s.",
      },
    ];
    const plan = planRecipeAdd(sauce, 8, target, units, articles);
    expect(plan[0]).toMatchObject({
      quantity: 1,
      unitId: bottle,
      note: "2 verres",
      result: { kind: "new", quantity: 1, unitId: bottle, note: "2 verres" },
    });
    // Déjà dans la liste : la quantité ne bouge pas, la recette passe en note, même
    // répétée.
    expect(plan[1]?.result).toMatchObject({
      existingId: "h",
      quantity: 2,
      unitId: bottle,
      note: "4 c. à s. · 4 c. à s.",
      kind: "note",
    });
    expect(plan[2]).toMatchObject({ quantity: 2, unitId: unit("pincee").id });
    expect(recipeMerge(plan, target, units)).toEqual([
      expect.objectContaining({ existingId: "h", quantity: 2 }),
      expect.objectContaining({ articleId: "vin", quantity: 1, kind: "new" }),
      expect.objectContaining({ articleId: "sel", quantity: 2 }),
    ]);
  });

  it("n'ajoute que les ingrédients cochés, en additionnant un article présent deux fois", () => {
    const doubled = recipe(4, "personnes", [
      ingredient("beurre", 100, "g"),
      ingredient("farine", 500, "g"),
      ingredient("beurre", 150, "g"),
    ]);
    const plan = planRecipeAdd(doubled, 4, [], units, []).map((line) =>
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

describe("recettes dans la base (docs/02 § 7)", () => {
  let database: ShoppingDatabase | undefined;
  afterEach(async () => {
    await database?.delete();
    database = undefined;
  });

  async function setup() {
    database = new ShoppingDatabase(`test-${crypto.randomUUID()}`);
    const db = database;
    await seedDatabase(db, 0);
    const list = await db.lists.toCollection().first();
    const byKey = async (key: string) => {
      const found = await db.articles.where("catalogKey").equals(key).first();
      if (!found) throw new Error(key);
      return found;
    };
    const unitId = async (slug: string) => {
      const found = await db.units.where("slug").equals(slug).first();
      if (!found) throw new Error(slug);
      return found.id;
    };
    if (!list) throw new Error("liste");
    const farine = await byKey("farine");
    const oeufs = await byKey("oeufs");
    const g = await unitId("g");
    const kg = await unitId("kg");
    const piece = await unitId("piece");
    const recipeId = await createRecipe(db, {
      name: " Cake ",
      yield: { quantity: 1, unit: "cake" },
      ingredients: [
        { ...ingredient(farine.id, 250, "g"), unitId: g },
        { ...ingredient(oeufs.id, 3, "piece"), unitId: piece },
      ],
    });
    return { db, list, farine, oeufs, g, kg, piece, recipeId };
  }

  it("− / + d'un ingrédient : appuis rapprochés tous comptés, en changeant d'unité", async () => {
    const { db, kg, recipeId } = await setup();
    await Promise.all(
      Array.from({ length: 17 }, () => stepIngredient(db, recipeId, 0, 1)),
    );
    const farine = (await db.recipes.get(recipeId))?.ingredients[0];
    // 250 g + 17 pas : 950 g (14 pas) → 1 kg → 1,5 kg → 2 kg.
    expect([farine?.quantity, farine?.unitId]).toEqual([2, kg]);
  });

  it("ajouter pour 2 cakes : lignes créées ou complétées, avec la recette pour origine", async () => {
    const { db, list, farine, oeufs, kg, recipeId } = await setup();
    await db.items.add({
      id: "f",
      createdAt: 0,
      updatedAt: 0,
      listId: list.id,
      articleId: farine.id,
      quantity: 1,
      unitId: kg,
      acceptedTypes: [],
      status: "todo",
      fromRecipes: [],
    });
    const recipe = await db.recipes.get(recipeId);
    if (!recipe) throw new Error("recette");
    const preview = planRecipeAdd(
      recipe,
      2,
      await activeItems(db, list.id),
      await db.units.toArray(),
      await db.articles.toArray(),
    );
    expect(await addRecipeToList(db, recipeId, list.id, 2, preview)).toBe(2);

    const items = await db.items.where("listId").equals(list.id).toArray();
    const flour = items.find((item) => item.articleId === farine.id);
    const eggs = items.find((item) => item.articleId === oeufs.id);
    expect(flour).toMatchObject({ quantity: 1.5, unitId: kg });
    expect(eggs).toMatchObject({ quantity: 6 });
    for (const item of [flour, eggs])
      expect(item?.fromRecipes).toEqual([{ recipeId, amount: 2 }]);
    // La recette ne bouge pas.
    expect((await db.recipes.get(recipeId))?.name).toBe("Cake");
  });

  it("dupliquer copie tout ; supprimer un article le retire des recettes, fusionner le remplace", async () => {
    const { db, farine, oeufs, recipeId } = await setup();
    const copyId = await duplicateRecipe(db, recipeId, "Cake (copie)");
    if (!copyId) throw new Error("copie");
    expect((await db.recipes.get(copyId))?.ingredients).toHaveLength(2);
    expect((await articleUsage(db, oeufs.id)).recipes).toBe(2);

    await deleteArticle(db, oeufs.id);
    expect(
      (await db.recipes.get(recipeId))?.ingredients.map((i) => i.articleId),
    ).toEqual([farine.id]);

    const other = await db.articles.where("catalogKey").equals("sucre").first();
    if (!other) throw new Error("sucre");
    await mergeArticles(db, other.id, farine.id);
    expect(
      (await db.recipes.get(copyId))?.ingredients.map((i) => i.articleId),
    ).toEqual([other.id]);
  });

  it("supprimer une unité convertit les ingrédients qui l'utilisent", async () => {
    const { db, g, kg, recipeId } = await setup();
    await deleteUnit(db, g, kg);
    expect((await db.recipes.get(recipeId))?.ingredients[0]).toMatchObject({
      quantity: 0.25,
      unitId: kg,
    });
  });
});
