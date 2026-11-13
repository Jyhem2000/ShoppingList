import "fake-indexeddb/auto";
import { Dexie } from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { keywordRules } from "@/data";
import { catalogData } from "@/data/catalog";
import { SCHEMA_V1, ShoppingDatabase } from "@/db/database";
import { addListItem } from "@/db/items";
import { buildInitialData, seedDatabase } from "@/db/seed";
import { accentKey } from "@/domain/slug";
import pack from "@/icons/packData";
import { groupIcons } from "@/icons/lucide";

let database: ShoppingDatabase | undefined;

function open(): ShoppingDatabase {
  database = new ShoppingDatabase(`test-${crypto.randomUUID()}`);
  return database;
}

afterEach(async () => {
  await database?.delete();
  database = undefined;
});

describe("données initiales (docs/06)", () => {
  const data = buildInitialData(0);

  it("contient au moins ~150 articles, chacun avec une clé catalogue unique", () => {
    expect(data.articles.length).toBeGreaterThanOrEqual(150);
    const keys = catalogData.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("n'a ni slug en double, ni alias qui désigne deux articles (accents compris)", () => {
    for (const items of [data.articles, data.categories, data.units]) {
      const slugs = items.map((i) => i.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
    const owner = new Map<string, string>();
    for (const article of data.articles) {
      for (const name of [article.name, ...article.aliases]) {
        // « Pâté » et « Pâtes » ne diffèrent que par les accents : permis, la saisie
        // les départage (docs/07 § 7.2).
        const key = accentKey(name);
        const previous = owner.get(key);
        expect(
          previous === undefined || previous === article.name,
          `« ${name} » désigne ${previous ?? ""} et ${article.name}`,
        ).toBe(true);
        owner.set(key, article.name);
      }
    }
  });

  it("n'utilise que des icônes connues : pack pour les articles, Lucide pour catégories et rayons", () => {
    const articleIcons = [
      ...data.articles.map((a) => a.icon),
      ...keywordRules.map((r) => r.icon),
    ].filter((icon) => icon !== undefined);
    expect(articleIcons.filter((icon) => !(icon in pack))).toEqual([]);
    const groupIconNames = [
      ...data.categories.map((c) => c.icon),
      ...data.aisles.map((a) => a.icon),
    ];
    expect(
      groupIconNames.filter(
        (icon) => icon === undefined || !(icon in groupIcons),
      ),
    ).toEqual([]);
  });

  it("donne à chaque article du catalogue l'icône de sa clé", () => {
    expect(
      catalogData.filter((a) => a.icon !== a.key).map((a) => a.key),
    ).toEqual([]);
  });

  it("a exactement un dessin par article du catalogue", () => {
    const keys = catalogData.map((a) => a.key).sort();
    expect(Object.keys(pack).sort()).toEqual(keys);
  });

  it("donne un rayon principal à chaque catégorie du magasin par défaut, sauf « Autres »", () => {
    const primaries = new Set(
      data.aisles.flatMap((a) =>
        a.isUnsorted
          ? []
          : a.categories.filter((c) => c.primary).map((c) => c.categoryId),
      ),
    );
    const orphans = data.categories
      .filter((c) => !c.isSystem && !primaries.has(c.id))
      .map((c) => c.name);
    expect(orphans).toEqual([]);
  });

  it("ne référence que des catégories et unités existantes", () => {
    const categoryKeys = new Set(data.categories.map((c) => c.catalogKey));
    const unitKeys = new Set(data.units.map((u) => u.slug));
    for (const rule of keywordRules) {
      expect(categoryKeys.has(rule.category), rule.category).toBe(true);
      expect(unitKeys.has(rule.unit), rule.unit).toBe(true);
    }
  });
});

describe("premier lancement", () => {
  it("copie les données initiales une seule fois", async () => {
    const db = open();
    expect(await seedDatabase(db)).toBe(true);
    expect(await seedDatabase(db)).toBe(false);

    expect(await db.articles.count()).toBe(catalogData.length);
    const stores = await db.stores.toArray();
    expect(stores.map((s) => s.name)).toEqual(["Mon supermarché"]);
    const aisles = await db.aisles
      .where("storeId")
      .equals(stores[0]?.id ?? "")
      .toArray();
    expect(aisles.filter((a) => a.isUnsorted)).toHaveLength(1);
    const lists = await db.lists.toArray();
    expect(lists.map((l) => l.name)).toEqual(["Courses"]);
    const settings = (await db.meta.get("settings"))?.value;
    expect(settings?.currentListId).toBe(lists[0]?.id);
    expect(settings?.simplifyQuantities).toBe(true);
  });

  it("ne touche à rien si l'utilisateur a déjà des données", async () => {
    const db = open();
    await seedDatabase(db);
    const eggs = await db.articles.where("slug").equals("oeufs").first();
    await db.articles.update(eggs?.id ?? "", { name: "Œufs frais" });
    await seedDatabase(db);
    const renamed = await db.articles.get(eggs?.id ?? "");
    expect(renamed?.name).toBe("Œufs frais");
  });
});

describe("une seule ligne par article dans une liste (docs/02 § 6)", () => {
  it("n'ajoute pas un article déjà présent et renvoie la ligne existante", async () => {
    const db = open();
    await seedDatabase(db);
    const list = await db.lists.toCollection().first();
    const apples = await db.articles.where("slug").equals("pommes").first();
    const input = {
      listId: list?.id ?? "",
      articleId: apples?.id ?? "",
      quantity: 2,
      unitId: apples?.defaultUnitId ?? "",
    };
    const first = await addListItem(db, input);
    expect(first.kind).toBe("added");
    const second = await addListItem(db, { ...input, quantity: 1 });
    expect(second.kind).toBe("exists");
    expect(second.item.quantity).toBe(2);
    expect(await db.items.count()).toBe(1);
  });

  it("ignore les lignes archivées (clôturées)", async () => {
    const db = open();
    await seedDatabase(db);
    const list = await db.lists.toCollection().first();
    const apples = await db.articles.where("slug").equals("pommes").first();
    const input = {
      listId: list?.id ?? "",
      articleId: apples?.id ?? "",
      quantity: 1,
      unitId: apples?.defaultUnitId ?? "",
    };
    const first = await addListItem(db, input);
    await db.items.update(first.item.id, { closedInSessionId: "session" });
    expect((await addListItem(db, input)).kind).toBe("added");
  });

  it("autorise le même article dans deux listes différentes", async () => {
    const db = open();
    await seedDatabase(db);
    const apples = await db.articles.where("slug").equals("pommes").first();
    const input = {
      articleId: apples?.id ?? "",
      quantity: 1,
      unitId: apples?.defaultUnitId ?? "",
    };
    expect((await addListItem(db, { ...input, listId: "a" })).kind).toBe(
      "added",
    );
    expect((await addListItem(db, { ...input, listId: "b" })).kind).toBe(
      "added",
    );
  });
});

describe("catégories système", () => {
  it("rangent « Autres » et « Achats ponctuels » dans le rayon « Non classé »", () => {
    const data = buildInitialData(0);
    const unsorted = data.aisles.find((a) => a.isUnsorted);
    const system = data.categories.filter((c) => c.isSystem).map((c) => c.id);
    expect(system).toHaveLength(2);
    expect(unsorted?.categories.map((c) => c.categoryId)).toEqual(system);
  });
});

describe("migration du schéma 1 au schéma 2 : rayons numérotés", () => {
  it("retire les noms venus tels quels d'un modèle, garde ceux de l'utilisateur", async () => {
    const name = `test-${crypto.randomUUID()}`;
    const old = new Dexie(name);
    old.version(1).stores(SCHEMA_V1);
    const aisle = (id: string, aisleName: string, isUnsorted = false) => ({
      id,
      createdAt: 0,
      updatedAt: 0,
      storeId: "s",
      name: aisleName,
      color: "gris",
      position: 0,
      categories: [],
      isUnsorted,
    });
    await old
      .table("aisles")
      .bulkAdd([
        aisle("a", "Boulangerie"),
        aisle("b", "Primeur"),
        aisle("c", "Sucré, petit-déj, café"),
        aisle("d", "Non classé", true),
      ]);
    old.close();

    database = new ShoppingDatabase(name);
    const names = Object.fromEntries(
      (await database.aisles.toArray()).map((a) => [a.id, a.name]),
    );
    expect(names).toEqual({
      a: "",
      b: "",
      c: "Sucré, petit-déj, café",
      d: "Non classé",
    });
  });

  it("crée les rayons d'un nouveau magasin sans nom", () => {
    const data = buildInitialData(0);
    expect(
      data.aisles.filter((a) => !a.isUnsorted).every((a) => a.name === ""),
    ).toBe(true);
  });
});
