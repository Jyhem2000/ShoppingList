import { describe, expect, it } from "vitest";
import {
  type DocNode,
  docToMarkdown,
  markdownToDoc,
  markdownToText,
  parseInline,
  parseMarkdown,
} from "@/domain/markdown";

describe("étapes mises en forme (docs/03 E1)", () => {
  it("lit le gras, et laisse un ** sans pendant tel quel", () => {
    expect(parseInline("Cuire **20 min** à 180 °C")).toEqual([
      { text: "Cuire ", bold: false },
      { text: "20 min", bold: true },
      { text: " à 180 °C", bold: false },
    ]);
    expect(parseInline("2 ** 3")).toEqual([{ text: "2 ** 3", bold: false }]);
  });

  it("découpe titres, puces, numéros et paragraphes ; un ancien texte simple reste un paragraphe", () => {
    const blocks = parseMarkdown(
      "## Pâte\n- 200 g de farine\n- 3 œufs\n\n1. Mélanger\n2. Cuire\nServir tiède.\nBon appétit",
    );
    expect(blocks.map((b) => b.kind)).toEqual([
      "heading",
      "bullets",
      "numbers",
      "paragraph",
    ]);
    expect(blocks[1]).toMatchObject({ kind: "bullets" });
    expect(blocks[2]).toMatchObject({ kind: "numbers", start: 1 });
    expect(parseMarkdown("Préchauffer le four.\nBeurrer le moule.")).toEqual([
      {
        kind: "paragraph",
        lines: [
          [{ text: "Préchauffer le four.", bold: false }],
          [{ text: "Beurrer le moule.", bold: false }],
        ],
      },
    ]);
  });

  it("relit dans l'éditeur ce qui est enregistré, et l'enregistre à l'identique", () => {
    const steps = [
      "## Pâte",
      "1. Mélanger la **farine** et le beurre\n2. Laisser reposer",
      "## Garniture",
      "- 3 oignons\n- **200 g** de lardons",
      "Cuire 30 min.\nServir chaud.",
    ].join("\n\n");
    expect(docToMarkdown(markdownToDoc(steps))).toBe(steps);
    // Une ligne de texte qui commence comme une liste ou un titre reste du texte.
    const plain = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "1. pas une liste" }],
        },
      ],
    };
    const saved = docToMarkdown(plain);
    expect(saved).toBe("\\1. pas une liste");
    expect(markdownToDoc(saved)).toEqual(plain);
    expect(markdownToDoc("")).toEqual({
      type: "doc",
      content: [{ type: "paragraph" }],
    });
  });

  it("convertit le document de l'éditeur : retours à la ligne, numéros, listes imbriquées", () => {
    const text = (value: string, bold = false): DocNode => ({
      type: "text",
      text: value,
      ...(bold && { marks: [{ type: "bold" }] }),
    });
    const item = (...content: DocNode[]): DocNode => ({
      type: "listItem",
      content,
    });
    const paragraph = (...content: DocNode[]): DocNode => ({
      type: "paragraph",
      content,
    });
    const doc: DocNode = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 3 }, content: [text("Sauce")] },
        paragraph(
          text("Fondre "),
          text("le beurre", true),
          { type: "hardBreak" },
          text("puis saler"),
        ),
        { type: "paragraph" },
        {
          type: "orderedList",
          attrs: { start: 3 },
          content: [
            item(paragraph(text("Fouetter"))),
            item(paragraph(text("Ajouter")), {
              type: "bulletList",
              content: [item(paragraph(text("le lait")))],
            }),
          ],
        },
      ],
    };
    expect(docToMarkdown(doc)).toBe(
      "## Sauce\n\nFondre **le beurre**\npuis saler\n\n3. Fouetter\n4. Ajouter\n5. le lait",
    );
  });
});

describe("étapes dans un message de partage (docs/03 E3)", () => {
  it("donne un texte simple : sans gras ni dièse, listes gardées", () => {
    expect(
      markdownToText(
        "## Préparer\n- **Couper** les tomates\n\n1. Cuire\n2. Servir",
      ),
    ).toBe("Préparer\n\n- Couper les tomates\n\n1. Cuire\n2. Servir");
  });
});
