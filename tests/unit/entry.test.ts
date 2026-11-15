import { describe, expect, it } from "vitest";
import {
  entryAmount,
  parseEntry,
  resolveEntry,
  typeSuggestions,
} from "@/domain/entry";
import { formatQuantity } from "@/domain/quantity";
import { articles, units } from "./fixtures";

/** Saisie complète, comme dans la barre d'ajout : lignes « Article : quantité (types) ». */
function enter(text: string, simplify = true): string[] {
  return parseEntry(text, units).map((entry) => {
    const { article, acceptedTypes } = resolveEntry(entry.text, articles);
    if (!article) return `? ${entry.text}`;
    const amount = entryAmount(entry, article, units, simplify);
    const quantity = amount
      ? formatQuantity(amount.quantity, amount.unit)
      : "?";
    const types = acceptedTypes.length ? ` (${acceptedTypes.join(", ")})` : "";
    return `${article.name} : ${quantity}${types}`;
  });
}

describe("un nombre seul compte des objets (docs/03 A2)", () => {
  it("pièce, contenant ou volume : N de l'unité par défaut", () => {
    expect(enter("2 oignons")).toEqual(["Oignons : × 2"]);
    expect(enter("6 œufs")).toEqual(["Œufs : × 6"]);
    expect(enter("3 pâtes")).toEqual(["Pâtes : 3 paquets"]);
    expect(enter("2 laits")).toEqual(["Lait : 2 L"]);
  });

  it("poids, article qui se compte à la pièce : des pièces", () => {
    expect(enter("3 pommes")).toEqual(["Pommes : × 3"]);
    expect(enter("1 pomme de terre")).toEqual(["Pommes de terre : × 1"]);
  });

  it("poids, autre article : N portions de la quantité par défaut", () => {
    expect(enter("2 beurres")).toEqual(["Beurre : 500 g"]);
    expect(enter("2 cerises")).toEqual(["Cerises : 1 kg"]);
    expect(enter("3 boeuf")).toEqual(["Bœuf : 1,5 kg"]);
    expect(enter("3 boeuf", false)).toEqual(["Bœuf : 1 500 g"]);
  });

  it("sans nombre ou avec une unité, rien ne change", () => {
    expect(enter("pommes")).toEqual(["Pommes : 1 kg"]);
    expect(enter("oignons")).toEqual(["Oignons : × 1"]);
    expect(enter("2 kg pommes")).toEqual(["Pommes : 2 kg"]);
    expect(enter("200 g beurre")).toEqual(["Beurre : 200 g"]);
  });
});

describe("saisie naturelle : tableau de docs/03 § A2", () => {
  it("3 tomates → Tomates × 3 (un nombre seul compte des objets)", () => {
    expect(enter("3 tomates")).toEqual(["Tomates : × 3"]);
  });

  it("tomates x3 / tomates *3", () => {
    expect(enter("tomates x3")).toEqual(["Tomates : × 3"]);
    expect(enter("tomates *3")).toEqual(["Tomates : × 3"]);
    expect(enter("tomates x 3")).toEqual(["Tomates : × 3"]);
  });

  it("500g farine / farine 500 g", () => {
    expect(enter("500g farine")).toEqual(["Farine : 500 g"]);
    expect(enter("farine 500 g")).toEqual(["Farine : 500 g"]);
    expect(enter("500 g de farine")).toEqual(["Farine : 500 g"]);
  });

  it("1,5 kg pommes (virgule décimale)", () => {
    expect(enter("1,5 kg pommes")).toEqual(["Pommes : 1,5 kg"]);
    expect(enter("1.5kg pommes")).toEqual(["Pommes : 1,5 kg"]);
  });

  it("1200 g boeuf → 1,2 kg (simplification)", () => {
    expect(enter("1200 g boeuf")).toEqual(["Bœuf : 1,2 kg"]);
    expect(enter("1200 g boeuf", false)).toEqual(["Bœuf : 1 200 g"]);
  });

  it("deux baguettes / une douzaine d'œufs", () => {
    expect(enter("deux baguettes")).toEqual(["Baguette : × 2"]);
    expect(enter("une douzaine d'œufs")).toEqual(["Œufs : × 12"]);
    expect(enter("une demi-douzaine d'oeufs")).toEqual(["Œufs : × 6"]);
    expect(enter("dix-huit oeufs")).toEqual(["Œufs : × 18"]);
  });

  it("pommes gala → type accepté Gala", () => {
    expect(enter("pommes gala")).toEqual(["Pommes : 1 kg (Gala)"]);
    expect(enter("2 kg pommes granny smith")).toEqual([
      "Pommes : 2 kg (Granny Smith)",
    ]);
  });

  it("reconnaît les types malgré les mots de liaison", () => {
    expect(enter("jus d'orange")).toEqual([
      "Jus de fruits : 1 bouteille (orange)",
    ]);
    expect(enter("2 citrons verts")).toEqual(["Citrons : × 2 (verts)"]);
    expect(enter("crème liquide")).toEqual(["Crème fraîche : × 1 (liquide)"]);
    expect(enter("champignons de Paris")).toEqual([
      "Champignons : 1 barquette (de Paris)",
    ]);
    expect(enter("compote de pomme")).toEqual(["Compotes : × 4 (pomme)"]);
    expect(enter("pommes gala ou golden")).toEqual([
      "Pommes : 1 kg (Gala, Golden)",
    ]);
  });

  it("un début de type sans ambiguïté vaut le type entier", () => {
    expect(enter("3 pommes gol")).toEqual(["Pommes : × 3 (Golden)"]);
    expect(enter("pommes granny")).toEqual(["Pommes : 1 kg (Granny Smith)"]);
    // « g » : Gala, Golden ou Granny Smith, on ne choisit pas à la place de l'utilisateur.
    expect(enter("pommes g")).toEqual(["Pommes : 1 kg"]);
  });

  it("suggestions par type, seulement après le nom de l'article", () => {
    const suggested = (text: string) =>
      typeSuggestions(text, articles).map(
        ({ article, type }) => `${article.name} · ${type}`,
      );
    expect(suggested("pom")).toEqual([]);
    expect(suggested("pommes")).toEqual([]);
    expect(suggested("pommes g")).toEqual([
      "Pommes · Gala",
      "Pommes · Golden",
      "Pommes · Granny Smith",
    ]);
    expect(suggested("pommes gol")).toEqual(["Pommes · Golden"]);
  });

  it("dictée : « puis » et les points de fin de phrase séparent aussi les articles", () => {
    expect(enter("des pommes puis du lait")).toEqual([
      "Pommes : 1 kg",
      "Lait : 6 L",
    ]);
    expect(enter("Des pommes. Du lait.")).toEqual([
      "Pommes : 1 kg",
      "Lait : 6 L",
    ]);
    // Ni un nombre, ni une abréviation.
    expect(enter("1.5 kg de pommes")).toEqual(["Pommes : 1,5 kg"]);
    expect(enter("2 barq. de champignons")).toEqual([
      "Champignons : 2 barquettes",
    ]);
  });

  it("2 baguettes, du beurre et 6 œufs → 3 lignes", () => {
    expect(enter("2 baguettes, du beurre et 6 œufs")).toEqual([
      "Baguette : × 2",
      "Beurre : 250 g",
      "Œufs : × 6",
    ]);
  });

  it("sépare aussi sur ; et les retours à la ligne", () => {
    expect(enter("lait; café\nsel")).toEqual([
      "Lait : 6 L",
      "Café : 1 paquet",
      "Sel : 1 paquet",
    ]);
  });

  it("ignore les partitifs", () => {
    expect(enter("de la moutarde")).toEqual(["Moutarde : 1 pot"]);
    expect(enter("des chips")).toEqual(["Chips : 1 sachet"]);
    expect(enter("de l'huile d'olive")).toEqual([
      "Huile d'olive : 1 bouteille",
    ]);
  });

  it("l'unité saisie l'emporte sur l'unité par défaut", () => {
    expect(enter("3 pots de miel")).toEqual(["Miel : 3 pots"]);
    expect(enter("2 L de lait")).toEqual(["Lait : 2 L"]);
    expect(enter("6 bananes")).toEqual(["Bananes : × 6"]);
    expect(enter("1 kg bananes")).toEqual(["Bananes : 1 kg"]);
  });

  it("ne simplifie jamais la quantité par défaut de l'article", () => {
    expect(enter("cerises")).toEqual(["Cerises : 0,5 kg"]);
    expect(enter("500 g cerises")).toEqual(["Cerises : 500 g"]);
    expect(enter("0,5 kg cerises")).toEqual(["Cerises : 500 g"]);
  });

  it("sans quantité : la quantité par défaut de l'article", () => {
    expect(enter("oeufs")).toEqual(["Œufs : × 6"]);
    expect(enter("papier toilette")).toEqual(["Papier toilette : × 6"]);
    // « rouleau » se lit comme « pièce » : l'unité n'existe plus, le mot reste compris.
    expect(enter("12 rouleaux de papier toilette")).toEqual([
      "Papier toilette : × 12",
    ]);
  });

  it("trouve l'article par un alias ou un début de libellé", () => {
    expect(enter("chocolatine")).toEqual(["Pains au chocolat : × 1"]);
    expect(enter("tom")).toEqual(["Tomates : 1 kg"]);
  });

  it("départage les libellés qui ne diffèrent que par les accents ou le pluriel", () => {
    expect(enter("pâté")).toEqual(["Pâté : 1 pot"]);
    expect(enter("pates")).toEqual(["Pâtes : 1 paquet"]);
    expect(enter("pâtes")).toEqual(["Pâtes : 1 paquet"]);
  });

  it("un article inconnu reste à créer", () => {
    expect(enter("sauce nuoc-mâm")).toEqual(["? sauce nuoc-mâm"]);
    expect(parseEntry("2 sauce nuoc-mâm", units)).toEqual([
      { text: "sauce nuoc-mâm", quantity: 2 },
    ]);
  });
});
