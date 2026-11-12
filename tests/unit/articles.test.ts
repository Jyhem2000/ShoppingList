import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { deleteArticle, mergeArticles, updateArticle } from "@/db/articles";
import { createArticle } from "@/db/catalog";
import { ShoppingDatabase } from "@/db/database";
import { addListItem } from "@/db/items";
import { buildInitialData, seedDatabase } from "@/db/seed";
import { editDistance, findLikelyDuplicates } from "@/domain/duplicates";
import type { Article } from "@/domain/model";

function article(
  id: string,
  name: string,
  extra: Partial<Article> = {},
): Article {
  return {
    id,
    createdAt: 0,
    updatedAt: 0,
    slug: id,
    name,
    categoryId: "fruits",
    defaultUnitId: "piece",
    types: [],
    aliases: [],
    icon: "pommes",
    favorite: false,
    barcodes: [],
    notDuplicateOf: [],
    ...extra,
  };
}

describe("doublons probables (docs/07 § 7.12)", () => {
  it("compte les lettres d'écart", () => {
    expect(editDistance("pomme", "pomm")).toBe(1);
    expect(editDistance("pomme", "pome")).toBe(1);
    expect(editDistance("tomate", "pomme")).toBeGreaterThan(2);
  });

  it("trouve les noms proches ou un nom alternatif commun, même catégorie et même icône", () => {
    const pairs = findLikelyDuplicates([
      article("a", "Pommes"),
      article("b", "Pomme gala"),
      article("c", "Pommes", { categoryId: "legumes" }),
      article("d", "Golden", { aliases: ["pommes"] }),
    ]);
    expect(pairs.map(([x, y]) => `${x.id}${y.id}`).sort()).toEqual([
      "ab",
      "ad",
    ]);
  });

  it("aucun doublon dans le catalogue de départ, et une paire écartée ne revient pas", () => {
    const { articles } = buildInitialData(0);
    expect(findLikelyDuplicates(articles)).toEqual([]);
    expect(
      findLikelyDuplicates([
        article("a", "Pommes", { notDuplicateOf: ["b"] }),
        article("b", "Pomme"),
      ]),
    ).toEqual([]);
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
  const list = await db.lists.toCollection().first();
  const pommes = await db.articles.where("catalogKey").equals("pommes").first();
  const kg = await db.units.where("slug").equals("kg").first();
  const g = await db.units.where("slug").equals("g").first();
  if (!list || !pommes || !kg || !g) throw new Error("données");
  return { db, list, pommes, kg, g };
}

describe("fiche article (docs/03 G1)", () => {
  it("fusionner : les lignes s'additionnent, le nom fusionné devient un autre nom", async () => {
    const { db, list, pommes, kg, g } = await setup();
    const created = await createArticle(db, {
      name: "Pomme rouge",
      categoryId: pommes.categoryId,
      defaultUnitId: g.id,
    });
    await addListItem(db, {
      listId: list.id,
      articleId: pommes.id,
      quantity: 1,
      unitId: kg.id,
    });
    await addListItem(db, {
      listId: list.id,
      articleId: created.article.id,
      quantity: 500,
      unitId: g.id,
    });
    await mergeArticles(db, pommes.id, created.article.id);

    const lines = await db.items.where("listId").equals(list.id).toArray();
    expect(lines).toHaveLength(1);
    expect(lines[0]?.articleId).toBe(pommes.id);
    expect(lines[0]?.quantity).toBe(1.5);
    expect(await db.articles.get(created.article.id)).toBeUndefined();
    expect((await db.articles.get(pommes.id))?.aliases).toContain(
      "pomme-rouge",
    );
  });

  it("renommer garde un nom unique ; supprimer retire l'article de la liste", async () => {
    const { db, list, pommes, kg } = await setup();
    const poires = await db.articles
      .where("catalogKey")
      .equals("poires")
      .first();
    if (!poires) throw new Error("poires");
    expect(await updateArticle(db, poires.id, { name: "Pommes" })).toBe(
      "nameTaken",
    );
    expect(
      await updateArticle(db, poires.id, { name: "Poires Williams" }),
    ).toBe("saved");
    expect((await db.articles.get(poires.id))?.slug).toBe("poires-williams");

    await addListItem(db, {
      listId: list.id,
      articleId: pommes.id,
      quantity: 1,
      unitId: kg.id,
    });
    await deleteArticle(db, pommes.id);
    expect(await db.items.where("articleId").equals(pommes.id).count()).toBe(0);
    expect(await db.articles.get(pommes.id)).toBeUndefined();
  });
});
