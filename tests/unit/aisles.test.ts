import { describe, expect, it } from "vitest";
import { effectiveAisle, groupListForStore } from "@/domain/aisles";
import type {
  ArticleAisleOverride,
  ItemStatus,
  ListItem,
} from "@/domain/model";
import { aisles, article, articles, categories, list, store } from "./fixtures";

function aisle(name: string) {
  const found = aisles.find((a) => a.name === name);
  if (!found) throw new Error(name);
  return found;
}

function item(
  name: string,
  status: ItemStatus = "todo",
  extra: Partial<ListItem> = {},
): ListItem {
  const a = article(name);
  return {
    id: `item-${name}`,
    createdAt: 0,
    updatedAt: 0,
    listId: list.id,
    articleId: a.id,
    quantity: 1,
    unitId: a.defaultUnitId,
    acceptedTypes: [],
    status,
    fromRecipes: [],
    ...extra,
  };
}

const articleMap = new Map(articles.map((a) => [a.id, a]));

describe("effectiveAisle (docs/02 § 4)", () => {
  it("va dans le rayon principal de la catégorie", () => {
    expect(effectiveAisle(article("Bœuf"), store.id, aisles, [])?.name).toBe(
      "Boucherie",
    );
    expect(effectiveAisle(article("Œufs"), store.id, aisles, [])?.name).toBe(
      "Crèmerie",
    );
  });

  it("l'exception de l'article pour ce magasin l'emporte", () => {
    const override: ArticleAisleOverride = {
      id: "o1",
      storeId: store.id,
      articleId: article("Steaks hachés").id,
      aisleId: aisle("Charcuterie & Traiteur").id,
    };
    expect(
      effectiveAisle(article("Steaks hachés"), store.id, aisles, [override])
        ?.name,
    ).toBe("Charcuterie & Traiteur");
    // Une exception d'un autre magasin est ignorée.
    expect(
      effectiveAisle(article("Steaks hachés"), store.id, aisles, [
        { ...override, storeId: "autre" },
      ])?.name,
    ).toBe("Boucherie");
  });

  it("sans rayon principal : « Non classé »", () => {
    const others = categories.find((c) => c.isSystem);
    expect(
      effectiveAisle(
        { id: "x", categoryId: others?.id ?? "" },
        store.id,
        aisles,
        [],
      )?.isUnsorted,
    ).toBe(true);
    expect(
      effectiveAisle({ id: "x", categoryId: "inconnue" }, store.id, aisles, [])
        ?.isUnsorted,
    ).toBe(true);
  });

  it("un rayon secondaire n'attire pas la catégorie", () => {
    // Viande : principale en Boucherie, secondaire en Charcuterie & Traiteur.
    const viande = article("Porc");
    expect(effectiveAisle(viande, store.id, aisles, [])?.name).toBe(
      "Boucherie",
    );
  });

  it("chaque catégorie a au plus un rayon principal par magasin", () => {
    const primaries = aisles.flatMap((a) =>
      a.categories.filter((c) => c.primary).map((c) => c.categoryId),
    );
    expect(new Set(primaries).size).toBe(primaries.length);
  });
});

describe("groupListForStore (docs/07 § 7.5)", () => {
  const items = [
    item("Lessive"),
    item("Pommes"),
    item("Carottes", "checked"),
    item("Bananes"),
    item("Tomates", "unavailable"),
    item("Œufs"),
    item("Baguette", "todo", { closedInSessionId: "s1" }),
  ];

  it("groupe par rayon, dans l'ordre du parcours, rayons vides omis", () => {
    const groups = groupListForStore(items, articleMap, store.id, aisles, []);
    expect(groups.map((g) => g.aisle.name)).toEqual([
      "Fruits & Légumes",
      "Crèmerie",
      "Entretien & Maison",
    ]);
  });

  it("à acheter, puis cochées, puis introuvables ; alphabétique à défaut d'ordre appris", () => {
    const [fruits] = groupListForStore(items, articleMap, store.id, aisles, []);
    expect(fruits?.items.map((i) => articleMap.get(i.articleId)?.name)).toEqual(
      ["Bananes", "Pommes", "Carottes", "Tomates"],
    );
  });

  it("place les articles génériques en tête de leur rayon", () => {
    const [fruits] = groupListForStore(
      [...items, item("Fruits au choix")],
      articleMap,
      store.id,
      aisles,
      [],
    );
    expect(articleMap.get(fruits?.items[0]?.articleId ?? "")?.name).toBe(
      "Fruits au choix",
    );
  });

  it("suit l'ordre appris des articles quand il existe", () => {
    const order = {
      [article("Pommes").id]: 0.1,
      [article("Bananes").id]: 0.9,
    };
    const [fruits] = groupListForStore(
      items,
      articleMap,
      store.id,
      aisles,
      [],
      order,
    );
    expect(
      fruits?.items
        .filter((i) => i.status === "todo")
        .map((i) => articleMap.get(i.articleId)?.name),
    ).toEqual(["Pommes", "Bananes"]);
  });

  it("exclut les lignes archivées (clôturées)", () => {
    const groups = groupListForStore(items, articleMap, store.id, aisles, []);
    expect(groups.some((g) => g.aisle.name === "Boulangerie")).toBe(false);
  });

  it("place « Non classé » en dernier, quelle que soit sa position", () => {
    const unsorted = aisles.map((a) =>
      a.isUnsorted ? { ...a, position: -1 } : a,
    );
    const otherCategory = categories.find((c) => c.isSystem)?.id ?? "";
    const custom = new Map(articleMap);
    custom.set("custom", {
      ...article("Lessive"),
      id: "custom",
      name: "Truc",
      categoryId: otherCategory,
    });
    const groups = groupListForStore(
      [...items, { ...item("Lessive"), id: "c", articleId: "custom" }],
      custom,
      store.id,
      unsorted,
      [],
    );
    expect(groups.at(-1)?.aisle.isUnsorted).toBe(true);
  });
});
