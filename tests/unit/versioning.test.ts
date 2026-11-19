import { describe, expect, it } from "vitest";
import { isBump, nextVersion } from "../../scripts/versioning.ts";

describe("numéro de la prochaine version", () => {
  it("applique le type de version demandé", () => {
    expect(nextVersion("1.0.1", "patch")).toBe("1.0.2");
    expect(nextVersion("1.0.1", "minor")).toBe("1.1.0");
    expect(nextVersion("1.2.3", "major")).toBe("2.0.0");
  });

  it("n'accepte que major, minor ou patch", () => {
    expect(isBump("minor")).toBe(true);
    expect(isBump("1.1.0")).toBe(false);
    expect(isBump(undefined)).toBe(false);
    expect(() => nextVersion("bidule", "patch")).toThrow();
  });
});
