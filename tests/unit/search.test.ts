import { describe, expect, it } from "vitest";
import { searchArticles, withinOneEdit } from "@/domain/search";
import { article, articles } from "./fixtures";

function names(query: string, counts?: Map<string, number>): string[] {
  return searchArticles(query, articles, counts).map((r) => r.article.name);
}

function idOf(name: string): string {
  return article(name).id;
}

describe("searchArticles (docs/03 § A1, docs/07 § 7.2)", () => {
  it("trouve dès les premières lettres, le libellé exact en tête", () => {
    expect(names("tom")[0]).toBe("Tomates");
    expect(names("tom")).toContain("Tomates concassées");
  });

  it("est insensible aux accents, à la casse et au pluriel", () => {
    expect(names("oeu")[0]).toBe("Œufs");
    expect(names("OEUF")[0]).toBe("Œufs");
    expect(names("creme fraiche")[0]).toBe("Crème fraîche");
    expect(names("tomate")[0]).toBe("Tomates");
  });

  it("affine par les accents quand on les tape, sinon propose tout", () => {
    expect(names("pate")).toEqual(expect.arrayContaining(["Pâté", "Pâtes"]));
    expect(names("pâté")[0]).toBe("Pâté");
    expect(names("pâtes")[0]).toBe("Pâtes");
  });

  it("cherche aussi dans les alias", () => {
    expect(names("chocolatine")[0]).toBe("Pains au chocolat");
    expect(names("coca")[0]).toBe("Coca-Cola");
    expect(names("pdt")[0]).toBe("Pommes de terre");
    expect(names("sopalin")[0]).toBe("Essuie-tout");
  });

  it("trouve un article par son nom suivi d'un type", () => {
    expect(names("citron vert")[0]).toBe("Citrons");
    expect(names("jus d'orange")[0]).toBe("Jus de fruits");
    expect(names("creme liq")[0]).toBe("Crème fraîche");
  });

  it("trouve un mot qui n'est pas le premier du libellé", () => {
    expect(names("chocolat")).toContain("Pains au chocolat");
    expect(names("pain choc")[0]).toBe("Pains au chocolat");
  });

  it("classe le début de libellé avant un mot, un alias, puis un texte contenu", () => {
    const results = searchArticles("lait", articles);
    expect(results[0]?.article.name).toBe("Lait");
    const kinds = results.map((r) => r.match);
    expect(kinds).toEqual([...kinds].sort((a, b) => order(a) - order(b)));
  });

  it("tolère une faute de frappe d'une lettre sur les mots de 5 lettres et plus", () => {
    expect(names("tomtes")[0]).toBe("Tomates");
    expect(names("carote")[0]).toBe("Carottes");
    expect(names("zzzzzz")).toEqual([]);
  });

  it("départage par fréquence d'achat, puis par ordre alphabétique", () => {
    expect(names("pain")[0]).toBe("Pain");
    const counts = new Map([[idOf("Pain de mie"), 5]]);
    expect(names("pain", counts)[0]).toBe("Pain de mie");
  });

  it("ne renvoie rien pour une requête vide", () => {
    expect(names("  ")).toEqual([]);
  });
});

function order(kind: string): number {
  return ["prefix", "wordPrefix", "alias", "contains", "typo"].indexOf(kind);
}

describe("withinOneEdit", () => {
  it.each([
    ["tomate", "tomate", true],
    ["tomate", "tomte", true],
    ["tomate", "tomatte", true],
    ["tomate", "tomqte", true],
    ["tomate", "otmate", true],
    ["tomate", "tmaote", false],
    ["tomate", "tom", false],
  ])("%s / %s → %s", (a, b, expected) => {
    expect(withinOneEdit(a, b)).toBe(expected);
  });
});
