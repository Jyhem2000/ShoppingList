/**
 * Vibrations (docs/05 § 7). L'API Vibration existe sur Android (Chrome) mais pas
 * dans WebKit (iPhone) : on vérifie sa présence et on ne fait rien sinon.
 */
export const patterns = {
  check: 10,
  aisleDone: [15, 40, 15],
  done: [20, 60, 20, 60, 40],
  error: [30, 50, 30],
} satisfies Record<string, VibratePattern>;

export function isVibrationSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

export function vibrate(pattern: VibratePattern): void {
  if (!isVibrationSupported()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Certains navigateurs refusent hors geste utilisateur : sans conséquence.
  }
}

/**
 * Astuce non officielle pour iPhone récent : basculer un interrupteur natif
 * (`<input type="checkbox" switch>`) déclenche le retour haptique du système.
 * Expérimental (docs/05 § 7) : à n'utiliser qu'après validation sur appareil réel.
 * Doit être appelé pendant un geste de l'utilisateur.
 */
export function iosHapticTick(): void {
  try {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    label.appendChild(input);
    label.style.display = "none";
    document.body.appendChild(label);
    label.click();
    label.remove();
  } catch {
    // Sans effet si non géré.
  }
}
