import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { categoriesData, familiesData, keywordRules } from "@/data";
import { catalogData } from "@/data/catalog";
import { ShoppingDatabase } from "@/db/database";
import { addListItem } from "@/db/items";
import { buildInitialData, seedDatabase } from "@/db/seed";
import { buildEmptyStore } from "@/db/stores";
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

  it("n'utilise que des icônes connues : pack pour les articles, Lucide pour les catégories", () => {
    const articleIcons = [
      ...data.articles.map((a) => a.icon),
      ...keywordRules.map((r) => r.icon),
    ].filter((icon) => icon !== undefined);
    expect(articleIcons.filter((icon) => !(icon in pack))).toEqual([]);
    const groupIconNames = data.categories.map((c) => c.icon);
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

  it("donne un nom court et une famille connue à chaque catégorie, sauf les catégories système", () => {
    const families = new Set(familiesData.map((f) => f.key));
    const missing = categoriesData
      .filter(
        (c) =>
          !c.system &&
          (!c.short?.fr || c.family === undefined || !families.has(c.family)),
      )
      .map((c) => c.key);
    expect(missing).toEqual([]);
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
    // Aucun magasin : le premier se crée au premier « C'est parti » (docs/03 B5).
    expect(await db.stores.count()).toBe(0);
    expect(await db.aisles.count()).toBe(0);
    const lists = await db.lists.toArray();
    expect(lists.map((l) => l.name)).toEqual(["Courses"]);
    const settings = (await db.meta.get("settings"))?.value;
    expect(settings?.currentListId).toBe(lists[0]?.id);
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
  it("rangent « Autres » et « Achats ponctuels » dans « À placer » d'un nouveau magasin", () => {
    const data = buildInitialData(0);
    const { aisles } = buildEmptyStore("Marché", data.categories, 0);
    const system = data.categories.filter((c) => c.isSystem).map((c) => c.id);
    expect(system).toHaveLength(2);
    expect(aisles).toHaveLength(1);
    expect(aisles[0]?.isUnsorted).toBe(true);
    expect(aisles[0]?.categories.map((c) => c.categoryId)).toEqual(system);
  });
});
