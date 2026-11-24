/**
 * Palette des rayons et catégories (docs/05 § 2). Les classes sont écrites en entier
 * pour que Tailwind les génère.
 */
export const paletteColors = [
  "sauge",
  "ble",
  "corail",
  "canard",
  "rose",
  "creme",
  "ambre",
  "terre",
  "prune",
  "ciel",
  "glacier",
  "lilas",
  "ardoise",
  "gris",
] as const;

export type PaletteColor = (typeof paletteColors)[number];

interface PaletteClasses {
  /** Couleur pleine (pastille). */
  solid: string;
  /** Texte de la couleur. */
  text: string;
  /** Fond atténué (~15 %), pour les monogrammes. */
  soft: string;
  /** Fond très léger (~10 %) en thème clair seulement : en-tête de rayon. */
  tintLight: string;
  /** Pastille du nombre d'articles d'un rayon : teintée en sombre, pleine en clair. */
  badge: string;
  /** Bordure de la couleur (bord gauche d'un bloc de rayon). */
  border: string;
}

export const palette: Record<PaletteColor, PaletteClasses> = {
  sauge: {
    solid: "bg-sauge",
    text: "text-sauge",
    soft: "bg-sauge/15",
    tintLight: "light:bg-sauge/10",
    badge: "bg-sauge/15 text-sauge light:bg-sauge light:text-bg",
    border: "border-sauge",
  },
  ble: {
    solid: "bg-ble",
    text: "text-ble",
    soft: "bg-ble/15",
    tintLight: "light:bg-ble/10",
    badge: "bg-ble/15 text-ble light:bg-ble light:text-bg",
    border: "border-ble",
  },
  corail: {
    solid: "bg-corail",
    text: "text-corail",
    soft: "bg-corail/15",
    tintLight: "light:bg-corail/10",
    badge: "bg-corail/15 text-corail light:bg-corail light:text-bg",
    border: "border-corail",
  },
  canard: {
    solid: "bg-canard",
    text: "text-canard",
    soft: "bg-canard/15",
    tintLight: "light:bg-canard/10",
    badge: "bg-canard/15 text-canard light:bg-canard light:text-bg",
    border: "border-canard",
  },
  rose: {
    solid: "bg-rose",
    text: "text-rose",
    soft: "bg-rose/15",
    tintLight: "light:bg-rose/10",
    badge: "bg-rose/15 text-rose light:bg-rose light:text-bg",
    border: "border-rose",
  },
  creme: {
    solid: "bg-creme",
    text: "text-creme",
    soft: "bg-creme/15",
    tintLight: "light:bg-creme/10",
    badge: "bg-creme/15 text-creme light:bg-creme light:text-bg",
    border: "border-creme",
  },
  ambre: {
    solid: "bg-ambre",
    text: "text-ambre",
    soft: "bg-ambre/15",
    tintLight: "light:bg-ambre/10",
    badge: "bg-ambre/15 text-ambre light:bg-ambre light:text-bg",
    border: "border-ambre",
  },
  terre: {
    solid: "bg-terre",
    text: "text-terre",
    soft: "bg-terre/15",
    tintLight: "light:bg-terre/10",
    badge: "bg-terre/15 text-terre light:bg-terre light:text-bg",
    border: "border-terre",
  },
  prune: {
    solid: "bg-prune",
    text: "text-prune",
    soft: "bg-prune/15",
    tintLight: "light:bg-prune/10",
    badge: "bg-prune/15 text-prune light:bg-prune light:text-bg",
    border: "border-prune",
  },
  ciel: {
    solid: "bg-ciel",
    text: "text-ciel",
    soft: "bg-ciel/15",
    tintLight: "light:bg-ciel/10",
    badge: "bg-ciel/15 text-ciel light:bg-ciel light:text-bg",
    border: "border-ciel",
  },
  glacier: {
    solid: "bg-glacier",
    text: "text-glacier",
    soft: "bg-glacier/15",
    tintLight: "light:bg-glacier/10",
    badge: "bg-glacier/15 text-glacier light:bg-glacier light:text-bg",
    border: "border-glacier",
  },
  lilas: {
    solid: "bg-lilas",
    text: "text-lilas",
    soft: "bg-lilas/15",
    tintLight: "light:bg-lilas/10",
    badge: "bg-lilas/15 text-lilas light:bg-lilas light:text-bg",
    border: "border-lilas",
  },
  ardoise: {
    solid: "bg-ardoise",
    text: "text-ardoise",
    soft: "bg-ardoise/15",
    tintLight: "light:bg-ardoise/10",
    badge: "bg-ardoise/15 text-ardoise light:bg-ardoise light:text-bg",
    border: "border-ardoise",
  },
  gris: {
    solid: "bg-gris",
    text: "text-gris",
    soft: "bg-gris/15",
    tintLight: "light:bg-gris/10",
    badge: "bg-gris/15 text-gris light:bg-gris light:text-bg",
    border: "border-gris",
  },
};

/** Couleur de la palette d'un rayon ou d'une catégorie (valeur inconnue → gris). */
export function paletteColor(color: string | undefined): PaletteColor {
  return paletteColors.find((c) => c === color) ?? "gris";
}
