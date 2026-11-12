import { describe, expect, it } from "vitest";
import { monogram } from "@/domain/monogram";

describe("monogram", () => {
  it("prend les initiales des deux premiers mots significatifs", () => {
    expect(monogram("Sauce nuoc-mâm")).toBe("SN");
    expect(monogram("Lessive")).toBe("L");
    expect(monogram("Pain de mie")).toBe("PM");
    expect(monogram("L'huile d'olive vierge")).toBe("HO");
    expect(monogram("œufs bio")).toBe("ŒB");
  });

  it("ne renvoie jamais de monogramme vide", () => {
    expect(monogram("")).toBe("?");
    expect(monogram("  ")).toBe("?");
    expect(monogram("de la")).toBe("DL");
    expect(monogram("7Up")).toBe("7");
    expect(monogram("молоко")).toBe("М");
  });
});
