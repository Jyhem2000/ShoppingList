import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { ShoppingDatabase } from "@/db/database";
import { seedDatabase } from "@/db/seed";
import { addTestStore } from "./fixtures";
import {
  copyStore,
  deleteAisle,
  deleteStore,
  mergeAisleInto,
  setAisleCategoryRole,
} from "@/db/stores";
import type { Aisle } from "@/domain/model";
import {
  categoryRole,
  setCategoryRole,
  unattachedCategories,
} from "@/domain/stores";

function aisle(id: string, categories: Aisle["categories"]): Aisle {
  return {
    id,
    createdAt: 0,
    updatedAt: 0,
    storeId: "s",
    name: id,
    color: "gris",
    position: 0,
    categories,
    isUnsorted: false,
  };
}

describe("rôle d'une catégorie dans un rayon (docs/02 § 4)", () => {
  const aisles = [
    aisle("boucherie", [{ categoryId: "viande", primary: true }]),
    aisle("frais", [{ categoryId: "viande", primary: false }]),
    aisle("epicerie", []),
  ];

  it("devenir principale ailleurs rend l'ancien rayon secondaire : une seule principale", () => {
    const changed = setCategoryRole(aisles, "frais", "viande", "primary");
    const after = aisles.map((a) => changed.find((c) => c.id === a.id) ?? a);
    expect(
      after
        .filter((a) => categoryRole(a, "viande") === "primary")
        .map((a) => a.id),
    ).toEqual(["frais"]);
    const boucherie = after.find((a) => a.id === "boucherie");
    expect(boucherie && categoryRole(boucherie, "viande")).toBe("secondary");
  });

  it("ne renvoie que les rayons qui changent", () => {
    expect(setCategoryRole(aisles, "boucherie", "viande", "primary")).toEqual(
      [],
    );
    expect(
      setCategoryRole(aisles, "epicerie", "viande", "secondary").map(
        (a) => a.id,
      ),
    ).toEqual(["epicerie"]);
  });

  it("repère les catégories rattachées à aucun rayon (hors catégories système)", () => {
    const categories = [
      { id: "viande", isSystem: false },
      { id: "glaces", isSystem: false },
      { id: "autres", isSystem: true },
    ];
    expect(unattachedCategories(aisles, categories).map((c) => c.id)).toEqual([
      "glaces",
    ]);
  });
});

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
  const store = await db.stores.toCollection().first();
  if (!store) throw new Error("magasin");
  const aisles = await db.aisles.where("storeId").equals(store.id).toArray();
  const byName = (name: string) => {
    const found = aisles.find((a) => a.name === name);
    if (!found) throw new Error(name);
    return found;
  };
  const category = async (key: string) => {
    const found = await db.categories.where("slug").equals(key).first();
    if (!found) throw new Error(key);
    return found;
  };
  return { db, store, byName, category };
}

describe("édition d'un magasin (docs/03 G3)", () => {
  it("supprimer un rayon : ses catégories principales vont dans un rayon secondaire si demandé", async () => {
    const { db, store, byName, category } = await setup();
    const viande = await category("viande");
    const boucherie = byName("Boucherie");
    const charcuterie = byName("Charcuterie & Traiteur");
    expect(categoryRole(charcuterie, viande.id)).toBe("secondary");

    await deleteAisle(db, boucherie.id, true);
    const after = await db.aisles.where("storeId").equals(store.id).toArray();
    expect(after.some((a) => a.id === boucherie.id)).toBe(false);
    const primaries = after.filter(
      (a) => categoryRole(a, viande.id) === "primary",
    );
    expect(primaries.map((a) => a.id)).toEqual([charcuterie.id]);
  });

  it("fusionner deux rayons : aucune catégorie perdue, les exceptions suivent", async () => {
    const { db, store, byName } = await setup();
    const fromages = byName("Fromages");
    const cremerie = byName("Crèmerie");
    const article = await db.articles.toCollection().first();
    if (!article) throw new Error("article");
    await db.overrides.add({
      id: "o1",
      storeId: store.id,
      articleId: article.id,
      aisleId: fromages.id,
    });
    await mergeAisleInto(db, fromages.id, cremerie.id);
    const merged = await db.aisles.get(cremerie.id);
    for (const c of [...fromages.categories, ...cremerie.categories])
      expect(merged && categoryRole(merged, c.categoryId), c.categoryId).toBe(
        "primary",
      );
    expect(await db.aisles.get(fromages.id)).toBeUndefined();
    expect((await db.overrides.get("o1"))?.aisleId).toBe(cremerie.id);

    // Jamais dans « À placer » : ses catégories n'en sortiraient plus.
    const unsorted = (
      await db.aisles.where("storeId").equals(store.id).toArray()
    ).find((a) => a.isUnsorted);
    if (!unsorted) throw new Error("À placer");
    await mergeAisleInto(db, cremerie.id, unsorted.id);
    expect(await db.aisles.get(cremerie.id)).toBeDefined();
    expect((await db.aisles.get(unsorted.id))?.categories).toEqual(
      unsorted.categories,
    );
  });

  it("copier un magasin ne touche pas l'original ; même le dernier magasin se supprime", async () => {
    const { db, store, byName, category } = await setup();
    const copy = await copyStore(db, store.id, "Copie");
    if (!copy) throw new Error("copie");
    const copied = await db.aisles.where("storeId").equals(copy.id).toArray();
    const original = await db.aisles
      .where("storeId")
      .equals(store.id)
      .toArray();
    expect(copied).toHaveLength(original.length);

    const glaces = await category("glaces");
    const fresh = copied.find((a) => a.name === "Boulangerie");
    if (!fresh) throw new Error("rayon");
    await setAisleCategoryRole(db, copy.id, fresh.id, glaces.id, "primary");
    expect(categoryRole(byName("Boulangerie"), glaces.id)).toBe("none");
    expect(await deleteStore(db, copy.id)).toBe("deleted");
    expect(await db.aisles.where("storeId").equals(copy.id).count()).toBe(0);
    // Plus de magasin : le prochain « C'est parti » en fera créer un.
    expect(await deleteStore(db, store.id)).toBe("deleted");
    expect(await db.stores.count()).toBe(0);
  });
});
