import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { ShoppingDatabase } from "@/db/database";
import { addListItem } from "@/db/items";
import { changeLanguage } from "@/db/language";
import { createRecipe } from "@/db/recipes";
import { seedDatabase } from "@/db/seed";
import { createEmptyStore } from "@/db/stores";

let database: ShoppingDatabase | undefined;

async function seeded(): Promise<ShoppingDatabase> {
  database = new ShoppingDatabase(`language-${crypto.randomUUID()}`);
  await seedDatabase(database, 0);
  return database;
}

afterEach(async () => {
  await database?.delete();
  database = undefined;
});

async function byKey(db: ShoppingDatabase, key: string) {
  const article = await db.articles.where("catalogKey").equals(key).first();
  if (!article) throw new Error(key);
  return article;
}

describe("changer de langue (docs/03 I3)", () => {
  it("renomme ce qui vient du catalogue et n'a pas été renommé, puis revient", async () => {
    const db = await seeded();
    const butter = await byKey(db, "beurre");
    await db.articles.update(butter.id, {
      name: "Beurre doux",
      slug: "beurre-doux",
    });
    const fruit = await db.categories.where("slug").equals("fruits").first();
    const vegetables = await db.categories
      .where("slug")
      .equals("legumes")
      .first();
    if (!fruit || !vegetables) throw new Error("catégories");
    await db.categories.update(vegetables.id, {
      name: "Mes légumes",
      slug: "mes-legumes",
    });
    const tomatoes = await byKey(db, "tomates");
    const before = await db.articles.toArray();

    await changeLanguage(db, "en");

    expect((await db.meta.get("settings"))?.value.language).toBe("en");
    expect(await byKey(db, "tomates")).toMatchObject({
      name: "Tomatoes",
      slug: "tomatoes",
      // Renommé par l'app, pas par l'utilisateur : la mise à jour du catalogue le corrige encore.
      updatedAt: tomatoes.createdAt,
    });
    expect((await byKey(db, "beurre")).name).toBe("Beurre doux");
    expect((await db.categories.get(fruit.id))?.name).toBe("Fruit");
    expect((await db.categories.get(vegetables.id))?.name).toBe("Mes légumes");
    const tin = await db.units.where("slug").equals("boite").first();
    expect(tin).toMatchObject({ singular: "tin", plural: "tins" });
    expect(tin?.aliases).toEqual(["can", "cans"]);
    expect((await db.lists.toArray()).map((list) => list.name)).toEqual([
      "List 1",
    ]);

    // Retour au français : tout ce qui a été renommé par l'app revient tel quel.
    await changeLanguage(db, "fr");
    const after = await db.articles.toArray();
    expect(after).toEqual(before);
    expect((await db.articles.get(tomatoes.id))?.name).toBe("Tomates");
  });

  it("traduit le rayon « À placer », le rendement et les types acceptés", async () => {
    const db = await seeded();
    const store = await createEmptyStore(db, "Marché", 0);
    const pears = await byKey(db, "poires");
    const list = await db.lists.toCollection().first();
    if (!list) throw new Error("liste");
    await addListItem(db, {
      listId: list.id,
      articleId: pears.id,
      quantity: 1,
      unitId: pears.defaultUnitId,
      acceptedTypes: ["conférence"],
    });
    const recipe = await createRecipe(db, {
      name: "Tarte aux poires",
      yield: { quantity: 4, unit: "Personne" },
      ingredients: [
        {
          articleId: pears.id,
          quantity: 1,
          unitId: pears.defaultUnitId,
          acceptedTypes: ["Conférence", "Williams"],
          optional: false,
          fixed: false,
        },
      ],
    });

    await changeLanguage(db, "en");

    const aisles = await db.aisles.where("storeId").equals(store.id).toArray();
    expect(aisles.find((aisle) => aisle.isUnsorted)?.name).toBe("Unsorted");
    expect((await byKey(db, "poires")).types).toEqual([
      "Conference",
      "Williams",
      "Comice",
    ]);
    expect((await db.items.toArray())[0]?.acceptedTypes).toEqual([
      "Conference",
    ]);
    const translated = await db.recipes.get(recipe);
    expect(translated?.yield.unit).toBe("people");
    expect(translated?.ingredients[0]?.acceptedTypes).toEqual([
      "Conference",
      "Williams",
    ]);
  });

  it("garde le nom d'un article quand le nouveau est déjà pris", async () => {
    const db = await seeded();
    const tomatoes = await byKey(db, "tomates");
    // Créé à la main, avant de changer de langue.
    await db.articles.add({
      ...tomatoes,
      id: crypto.randomUUID(),
      name: "Tomatoes",
      slug: "tomatoes",
      catalogKey: undefined,
    });

    await changeLanguage(db, "en");

    expect((await db.articles.get(tomatoes.id))?.name).toBe("Tomates");
    expect((await byKey(db, "beurre")).name).toBe("Butter");
  });
});
