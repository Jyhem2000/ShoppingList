/**
 * Écran allumé (Screen Wake Lock, docs/07 § 3). Le verrou est relâché par le
 * navigateur quand l'app passe en arrière-plan : on le redemande au retour.
 */
export type WakeLockState = "unsupported" | "released" | "active" | "error";

export function isWakeLockSupported(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

export interface WakeLockHandle {
  release: () => Promise<void>;
}

export async function keepScreenOn(
  onChange: (state: WakeLockState, error?: string) => void,
): Promise<WakeLockHandle> {
  if (!isWakeLockSupported()) {
    onChange("unsupported");
    return { release: async () => {} };
  }

  let sentinel: WakeLockSentinel | null = null;
  let wanted = true;

  const acquire = async () => {
    try {
      sentinel = await navigator.wakeLock.request("screen");
      onChange("active");
      sentinel.addEventListener("release", () => {
        if (wanted) onChange("released");
      });
    } catch (error) {
      onChange("error", error instanceof Error ? error.message : String(error));
    }
  };

  const onVisibility = () => {
    if (wanted && document.visibilityState === "visible") void acquire();
  };

  document.addEventListener("visibilitychange", onVisibility);
  await acquire();

  return {
    release: async () => {
      wanted = false;
      document.removeEventListener("visibilitychange", onVisibility);
      await sentinel?.release();
      sentinel = null;
      onChange("released");
    },
  };
}
