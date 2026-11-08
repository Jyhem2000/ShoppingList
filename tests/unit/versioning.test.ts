import { describe, expect, it } from "vitest";
import { detectBump, nextVersion } from "../../scripts/versioning.ts";

describe("numéro de la prochaine version", () => {
  it("déduit le type de version des commits", () => {
    expect(detectBump(["fix: corriger le tri", "docs: relire"])).toBe("patch");
    expect(detectBump(["fix: corriger", "feat(liste): ajout éclair"])).toBe(
      "minor",
    );
    expect(detectBump(["feat!: nouveau format de sauvegarde"])).toBe("major");
    expect(detectBump(["refactor: x\n\nBREAKING CHANGE: schéma"])).toBe(
      "major",
    );
  });

  it("calcule la version, sans majeure tant qu'on est en 0.x", () => {
    expect(nextVersion("0.1.0", ["fix: a"])).toBe("0.1.1");
    expect(nextVersion("0.1.3", ["feat: a"])).toBe("0.2.0");
    expect(nextVersion("0.7.0", ["feat!: a"])).toBe("0.8.0");
    expect(nextVersion("1.2.3", ["feat!: a"])).toBe("2.0.0");
  });

  it("accepte une version imposée mais jamais en arrière", () => {
    expect(nextVersion("0.7.0", [], "0.9.0")).toBe("0.9.0");
    expect(nextVersion("0.9.2", [], "1.0.0")).toBe("1.0.0");
    expect(nextVersion("0.2.0", [], "patch")).toBe("0.2.1");
    expect(() => nextVersion("0.9.0", [], "0.8.0")).toThrow();
    expect(() => nextVersion("0.9.0", [], "bidule")).toThrow();
  });
});
