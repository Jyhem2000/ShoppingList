import { useEffect } from "react";
import { usePreferences } from "@/app/preferences";
import { texts } from "@/i18n";
import { keepScreenOn } from "@/platform/wakeLock";
import { showToast } from "@/ui/toast";

/**
 * Écran allumé pendant les courses et sur une recette (docs/03 C1, H9), si le réglage
 * est actif. Si le téléphone refuse, un message discret le dit, une fois.
 */
export function useWakeLock(): void {
  const { keepScreenOn: wanted } = usePreferences();
  useEffect(() => {
    if (!wanted) return;
    let warned = false;
    let release: (() => Promise<void>) | undefined;
    let cancelled = false;
    void keepScreenOn((state) => {
      if ((state === "unsupported" || state === "error") && !warned) {
        warned = true;
        showToast(texts.shopping.screenOnFailed, { tone: "info" });
      }
    }).then((handle) => {
      if (cancelled) void handle.release();
      else release = handle.release;
    });
    return () => {
      cancelled = true;
      void release?.();
    };
  }, [wanted]);
}
