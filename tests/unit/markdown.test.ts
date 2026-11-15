import { describe, expect, it } from "vitest";
import {
  continueList,
  parseInline,
  parseMarkdown,
  toggleBold,
  toggleLineStyle,
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

  it("met en gras la sélection, ou l'enlève", () => {
    const bold = toggleBold({ text: "Cuire 20 min", start: 6, end: 12 });
    expect(bold).toEqual({ text: "Cuire **20 min**", start: 8, end: 14 });
    expect(toggleBold(bold)).toEqual({
      text: "Cuire 20 min",
      start: 6,
      end: 12,
    });
  });

  it("numérote les lignes sélectionnées, remplace une puce, ou enlève le style", () => {
    const text = "Mélanger\n- Cuire";
    const numbered = toggleLineStyle(
      { text, start: 0, end: text.length },
      "number",
    );
    expect(numbered.text).toBe("1. Mélanger\n2. Cuire");
    expect(
      toggleLineStyle(
        { text: numbered.text, start: 0, end: numbered.text.length },
        "number",
      ).text,
    ).toBe("Mélanger\nCuire");
  });

  it("continue une liste au retour à la ligne, et l'arrête sur un élément vide", () => {
    expect(continueList({ text: "1. Mélanger", start: 11, end: 11 })).toEqual({
      text: "1. Mélanger\n2. ",
      start: 15,
      end: 15,
    });
    expect(continueList({ text: "- a\n- ", start: 6, end: 6 })).toEqual({
      text: "- a\n",
      start: 4,
      end: 4,
    });
    expect(continueList({ text: "Mélanger", start: 8, end: 8 })).toBeNull();
  });
});
