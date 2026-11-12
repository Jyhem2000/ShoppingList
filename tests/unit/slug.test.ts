import { describe, expect, it } from "vitest";
import { searchKey, slugify } from "@/domain/slug";

describe("slugify (docs/02 § 1)", () => {
  it.each([
    ["Œufs bio", "oeufs-bio"],
    ["Crème fraîche épaisse", "creme-fraiche-epaisse"],
    ["Sauce nuoc-mâm", "sauce-nuoc-mam"],
    [" Lait   1/2 écrémé", "lait-1-2-ecreme"],
    ["Peanut butter", "peanut-butter"],
    ["Huile d'olive", "huile-d-olive"],
    ["Bœuf", "boeuf"],
    ["Ex æquo", "ex-aequo"],
  ])("%s → %s", (label, slug) => {
    expect(slugify(label)).toBe(slug);
  });

  it("ne donne jamais un slug vide pour un autre alphabet", () => {
    expect(slugify("Борщ")).toBe("борщ");
    expect(slugify("花生酱")).toBe("花生酱");
    expect(slugify("Ελιές")).not.toBe("");
  });
});

describe("searchKey", () => {
  it("tolère le pluriel des mots de plus de 3 lettres", () => {
    expect(searchKey("Œufs")).toBe(searchKey("oeuf"));
    expect(searchKey("Tomates")).toBe(searchKey("tomate"));
    expect(searchKey("Rouleaux")).toBe("rouleau");
    expect(searchKey("Pommes de terre")).toBe("pomme-de-terre");
  });

  it("ne touche pas aux mots courts ni aux autres alphabets", () => {
    expect(searchKey("Riz")).toBe("riz");
    expect(searchKey("Gaz")).toBe("gaz");
    expect(searchKey("Борщс")).toBe("борщс");
  });
});
