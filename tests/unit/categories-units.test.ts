import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import {
  createCategory,
  deleteCategory,
  mergeCategoryInto,
} from "@/db/categories";
import { ShoppingDatabase } from "@/db/database";
import { addListItem } from "@/db/items";
import { seedDatabase } from "@/db/seed";
import { addTestStore } from "./fixtures";
import { deleteUnit } from "@/db/units";
import { categoryRole } from "@/domain/stores";

let database: ShoppingDatabase | undefined;
afterEach(async () => {
  await database?.delete();
  database = undefined;
});

async function setup() {
  database = new ShoppingDatabase(`test-${crypto.randomUUID()}`);
  const db = database;
  await seedDatabase(db, 0);
  await addTestStore(db);
  const category = async (slug: string) => {
    const found = await db.categories.where("slug").equals(slug).first();
    if (!found) throw new Error(slug);
    return found;
  };
  return { db, category };
}

describe("catégories (docs/03 G2)", () => {
  it("fusionner : la catégorie gardée reprend les articles et le rayon principal qui lui manquait", async () => {
    const { db, category } = await setup();
    const created = await createCategory(db, {
      name: "Bio",
      icon: "tag",
      color: "sauge",
    });
    if (created.kind !== "saved") throw new Error("création");
    const fruits = await category("fruits");
    const pommes = await db.articles
      .where("catalogKey")
      .equals("pommes")
      .first();
    if (!pommes) throw new Error("pommes");

    // « Fruits » fusionné dans « Bio », qui n'a encore aucun rayon.
    await mergeCategoryInto(db, fruits.id, created.category.id);
    expect((await db.articles.get(pommes.id))?.categoryId).toBe(
      created.category.id,
    );
    expect(await db.categories.get(fruits.id)).toBeUndefined();
    const aisles = await db.aisles.toArray();
    expect(aisles.some((a) => categoryRole(a, fruits.id) !== "none")).toBe(
      false,
    );
    const store = await db.stores.toCollection().first();
    const primaries = aisles.filter(
      (a) =>
        a.storeId === store?.id &&
        categoryRole(a, created.category.id) === "primary",
    );
    expect(primaries.map((a) => a.name)).toEqual(["Fruits & Légumes"]);
  });

  it("supprimer : les articles vont dans la catégorie choisie ; un nom déjà pris est refusé", async () => {
    const { db, category } = await setup();
    const glaces = await category("glaces");
    const autres = await category("autres");
    expect(
      (await createCategory(db, { name: "Glaces", icon: "tag", color: "gris" }))
        .kind,
    ).toBe("nameTaken");
    const count = await db.articles
      .where("categoryId")
      .equals(glaces.id)
      .count();
    await deleteCategory(db, glaces.id, autres.id);
    expect(
      await db.articles.where("categoryId").equals(autres.id).count(),
    ).toBeGreaterThanOrEqual(count);
    expect(
      await db.articles.where("categoryId").equals(glaces.id).count(),
    ).toBe(0);
  });

  it("une catégorie système ne se supprime pas", async () => {
    const { db, category } = await setup();
    const autres = await category("autres");
    const fruits = await category("fruits");
    await deleteCategory(db, autres.id, fruits.id);
    expect(await db.categories.get(autres.id)).toBeDefined();
  });
});

describe("unités (docs/03 G4)", () => {
  it("supprimer une unité convertit les lignes et les articles vers l'unité de remplacement", async () => {
    const { db } = await setup();
    const g = await db.units.where("slug").equals("g").first();
    const kg = await db.units.where("slug").equals("kg").first();
    const list = await db.lists.toCollection().first();
    const cerises = await db.articles
      .where("catalogKey")
      .equals("cerises")
      .first();
    if (!g || !kg || !list || !cerises) throw new Error("données");
    await addListItem(db, {
      listId: list.id,
      articleId: cerises.id,
      quantity: 750,
      unitId: g.id,
    });
    await deleteUnit(db, g.id, kg.id);
    const line = await db.items.where("articleId").equals(cerises.id).first();
    expect(line?.unitId).toBe(kg.id);
    expect(line?.quantity).toBe(0.75);
    expect((await db.articles.get(cerises.id))?.defaultUnitId).toBe(kg.id);
    expect(await db.units.get(g.id)).toBeUndefined();
  });
});
