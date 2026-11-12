import { describe, expect, it } from "vitest";
import { detectInstallContext } from "@/platform/install";

const UA = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0.7204.119 Mobile/15E148 Safari/604.1",
  iphoneFirefox:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/140.0 Mobile/15E148 Safari/605.1.15",
  ipadOs:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
  desktopChrome:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
};

describe("detectInstallContext", () => {
  it("considère l'app comme installée en mode plein écran, quel que soit l'appareil", () => {
    expect(
      detectInstallContext({
        userAgent: UA.iphoneChrome,
        maxTouchPoints: 5,
        standalone: true,
      }),
    ).toEqual({ kind: "installed" });
  });

  it("reconnaît Chrome sur iPhone (installation manuelle via le bouton Partager de Chrome)", () => {
    expect(
      detectInstallContext({
        userAgent: UA.iphoneChrome,
        maxTouchPoints: 5,
        standalone: false,
      }),
    ).toEqual({ kind: "ios", browser: "chrome" });
  });

  it("reconnaît Safari et les autres navigateurs iPhone", () => {
    expect(
      detectInstallContext({
        userAgent: UA.iphoneSafari,
        maxTouchPoints: 5,
        standalone: false,
      }),
    ).toEqual({ kind: "ios", browser: "safari" });
    expect(
      detectInstallContext({
        userAgent: UA.iphoneFirefox,
        maxTouchPoints: 5,
        standalone: false,
      }),
    ).toEqual({ kind: "ios", browser: "other" });
  });

  it("reconnaît un iPad qui se présente comme un Mac grâce à l'écran tactile", () => {
    expect(
      detectInstallContext({
        userAgent: UA.ipadOs,
        maxTouchPoints: 5,
        standalone: false,
      }),
    ).toEqual({ kind: "ios", browser: "safari" });
    expect(
      detectInstallContext({
        userAgent: UA.ipadOs,
        maxTouchPoints: 0,
        standalone: false,
      }),
    ).toEqual({ kind: "other" });
  });

  it("reconnaît Android et les ordinateurs", () => {
    expect(
      detectInstallContext({
        userAgent: UA.androidChrome,
        maxTouchPoints: 5,
        standalone: false,
      }),
    ).toEqual({ kind: "android" });
    expect(
      detectInstallContext({
        userAgent: UA.desktopChrome,
        maxTouchPoints: 0,
        standalone: false,
      }),
    ).toEqual({ kind: "other" });
  });
});
