import { currentInstallEnvironment, isAppleMobile } from "@/platform/install";

/**
 * Vibrations (docs/05 § 7).
 * - Android (Chrome) : API Vibration, avec des motifs.
 * - iPhone : pas d'API Vibration dans WebKit ; astuce non officielle (expérimentale)
 *   qui déclenche le léger retour haptique du système, un seul « tic » par action.
 * - Ailleurs : rien, sans erreur.
 */
export const patterns = {
  check: 10,
  aisleDone: [15, 40, 15],
  done: [20, 60, 20, 60, 40],
  error: [30, 50, 30],
} satisfies Record<string, VibratePattern>;

export type HapticsKind = "vibrate" | "ios-tick" | "none";

export function hapticsKind(): HapticsKind {
  if (typeof navigator === "undefined") return "none";
  if (typeof navigator.vibrate === "function") return "vibrate";
  if (isAppleMobile(currentInstallEnvironment())) return "ios-tick";
  return "none";
}

/** Joue le retour haptique disponible. Doit être appelé pendant un geste de l'utilisateur. */
export function vibrate(pattern: VibratePattern): void {
  const kind = hapticsKind();
  if (kind === "vibrate") {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Certains navigateurs refusent hors geste utilisateur : sans conséquence.
    }
  } else if (kind === "ios-tick") {
    // Pas de durée sur iPhone : un « tic » au début de chaque vibration du motif.
    const segments = typeof pattern === "number" ? [pattern] : [...pattern];
    let at = 0;
    segments.forEach((duration, index) => {
      if (index % 2 === 0) {
        if (at === 0) iosHapticTick();
        else setTimeout(iosHapticTick, at);
      }
      at += duration;
    });
  }
}

/**
 * Astuce pour iPhone récent : basculer un interrupteur natif
 * (`<input type="checkbox" switch>`) déclenche le retour haptique du système.
 */
function iosHapticTick(): void {
  try {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    label.ariaHidden = "true";
    label.appendChild(input);
    label.style.display = "none";
    document.head.appendChild(label);
    label.click();
    label.remove();
  } catch {
    // Sans effet si non géré.
  }
}
