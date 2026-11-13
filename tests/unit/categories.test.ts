import { describe, expect, it } from "vitest";
import { groupListByCategory, sortCategories } from "@/domain/categories";
import type { Category, ListItem } from "@/domain/model";

function category(id: string, extra: Partial<Category> = {}): Category {
  return {
    id,
    createdAt: 0,
    updatedAt: 0,
    slug: id,
    name: id,
    color: "gris",
    useIconAsFallback: false,
    isSystem: false,
    catalogKey: id,
    ...extra,
  };
}

function item(id: string, articleId: string): ListItem {
  return {
    id,
    createdAt: 0,
    updatedAt: 0,
    listId: "l",
    articleId,
    quantity: 1,
    unitId: "u",
    acceptedTypes: [],
    status: "todo",
    fromRecipes: [],
  };
}

describe("liste par catégorie (docs/03 B1)", () => {
  const order = ["fruits", "legumes", "lait"];
  const categories = [
    category("autres", { isSystem: true }),
    category("lait"),
    category("Bio", { catalogKey: undefined }),
    category("fruits"),
  ];

  it("ordre du catalogue, puis catégories créées, puis catégories système", () => {
    expect(sortCategories(categories, order).map((c) => c.id)).toEqual([
      "fruits",
      "lait",
      "Bio",
      "autres",
    ]);
  });

  it("groupe par catégorie, sans magasin ; générique en tête, puis alphabétique", () => {
    const articles = new Map([
      ["pommes", { name: "Pommes", categoryId: "fruits" }],
      ["abricots", { name: "Abricots", categoryId: "fruits" }],
      [
        "fruits-choix",
        { name: "Fruits au choix", categoryId: "fruits", generic: true },
      ],
      ["lait", { name: "Lait", categoryId: "lait" }],
    ]);
    const groups = groupListByCategory(
      [
        item("1", "pommes"),
        item("2", "lait"),
        item("3", "abricots"),
        item("4", "fruits-choix"),
      ],
      articles,
      categories,
      order,
    );
    expect(groups.map((g) => g.category.id)).toEqual(["fruits", "lait"]);
    expect(groups[0]?.items.map((i) => i.articleId)).toEqual([
      "fruits-choix",
      "abricots",
      "pommes",
    ]);
  });
});
