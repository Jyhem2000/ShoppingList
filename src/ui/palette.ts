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
  /** Fond très léger (~10 %), pour les en-têtes de rayon. */
  tint: string;
  /** Bordure de la couleur (bord gauche d'un bloc de rayon). */
  border: string;
}

export const palette: Record<PaletteColor, PaletteClasses> = {
  sauge: {
    solid: "bg-sauge",
    text: "text-sauge",
    soft: "bg-sauge/15",
    tint: "bg-sauge/10",
    border: "border-sauge",
  },
  ble: {
    solid: "bg-ble",
    text: "text-ble",
    soft: "bg-ble/15",
    tint: "bg-ble/10",
    border: "border-ble",
  },
  corail: {
    solid: "bg-corail",
    text: "text-corail",
    soft: "bg-corail/15",
    tint: "bg-corail/10",
    border: "border-corail",
  },
  canard: {
    solid: "bg-canard",
    text: "text-canard",
    soft: "bg-canard/15",
    tint: "bg-canard/10",
    border: "border-canard",
  },
  rose: {
    solid: "bg-rose",
    text: "text-rose",
    soft: "bg-rose/15",
    tint: "bg-rose/10",
    border: "border-rose",
  },
  creme: {
    solid: "bg-creme",
    text: "text-creme",
    soft: "bg-creme/15",
    tint: "bg-creme/10",
    border: "border-creme",
  },
  ambre: {
    solid: "bg-ambre",
    text: "text-ambre",
    soft: "bg-ambre/15",
    tint: "bg-ambre/10",
    border: "border-ambre",
  },
  terre: {
    solid: "bg-terre",
    text: "text-terre",
    soft: "bg-terre/15",
    tint: "bg-terre/10",
    border: "border-terre",
  },
  prune: {
    solid: "bg-prune",
    text: "text-prune",
    soft: "bg-prune/15",
    tint: "bg-prune/10",
    border: "border-prune",
  },
  ciel: {
    solid: "bg-ciel",
    text: "text-ciel",
    soft: "bg-ciel/15",
    tint: "bg-ciel/10",
    border: "border-ciel",
  },
  glacier: {
    solid: "bg-glacier",
    text: "text-glacier",
    soft: "bg-glacier/15",
    tint: "bg-glacier/10",
    border: "border-glacier",
  },
  lilas: {
    solid: "bg-lilas",
    text: "text-lilas",
    soft: "bg-lilas/15",
    tint: "bg-lilas/10",
    border: "border-lilas",
  },
  ardoise: {
    solid: "bg-ardoise",
    text: "text-ardoise",
    soft: "bg-ardoise/15",
    tint: "bg-ardoise/10",
    border: "border-ardoise",
  },
  gris: {
    solid: "bg-gris",
    text: "text-gris",
    soft: "bg-gris/15",
    tint: "bg-gris/10",
    border: "border-gris",
  },
};
