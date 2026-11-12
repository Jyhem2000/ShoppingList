import { describe, expect, it } from "vitest";

// `src/version.ts` lit des constantes injectées au build : on les définit pour le test.
Object.assign(globalThis, {
  __APP_VERSION__: "0.1.0",
  __APP_COMMIT__: "a1b2c3d",
  __APP_CHANNEL__: "dev",
  __APP_BUILD_DATE__: "2026-11-08T12:00:00.000Z",
});
const { compareVersions, formatVersion } = await import("@/version");

describe("formatVersion", () => {
  it("affiche le numéro seul en production", () => {
    expect(
      formatVersion({
        version: "1.2.0",
        commit: "a1b2c3d",
        channel: "production",
      }),
    ).toBe("1.2.0");
  });

  it("affiche commit et canal hors production", () => {
    expect(
      formatVersion({
        version: "1.2.0",
        commit: "a1b2c3d",
        channel: "preprod",
      }),
    ).toBe("1.2.0 · préproduction · a1b2c3d");
    expect(
      formatVersion({ version: "0.1.0", commit: "ffee001", channel: "dev" }),
    ).toBe("0.1.0 · développement · ffee001");
  });
});

describe("compareVersions (nouveautés d'une version pas encore publiée cachées)", () => {
  it("compare chaque partie comme un nombre", () => {
    expect(compareVersions("0.10.0", "0.9.0")).toBeGreaterThan(0);
    expect(compareVersions("0.5.0", "0.5.0")).toBe(0);
    expect(compareVersions("0.4.0", "0.5.0")).toBeLessThan(0);
  });
});
