import {
  getPreferences,
  subscribePreferences,
  type ThemePreference,
} from "./preferences";

/**
 * Thème de l'app (docs/03 H11, docs/05 § 2) : posé sur `<html data-theme>`, avec la
 * couleur de la barre d'état (`theme-color`). « Automatique » suit le téléphone et
 * change avec lui. index.html pose déjà le bon thème avant l'affichage (pas de flash).
 */
export type Theme = "dark" | "light";

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): Theme {
  if (preference === "auto") return systemPrefersDark ? "dark" : "light";
  return preference;
}

function apply(): void {
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = resolveTheme(getPreferences().theme, dark);
  document.documentElement.dataset.theme = theme;
  // Barre d'état de la couleur du fond de l'app : le token --bg du thème posé.
  const bar = getComputedStyle(document.documentElement)
    .getPropertyValue("--bg")
    .trim();
  if (bar)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", bar);
}

/** Applique le thème et le tient à jour (réglage de l'app, réglage du téléphone). */
export function trackTheme(): void {
  apply();
  subscribePreferences(apply);
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", apply);
}
