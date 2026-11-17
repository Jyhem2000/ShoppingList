import { useSyncExternalStore } from "react";

/**
 * Pack d'icônes d'articles (docs/05 § 4) : les icônes dessinées pour l'app, une par
 * article du catalogue, réunies au build par `packData.ts`.
 * Chargé à part (fichier séparé, mis en cache pour le hors-ligne par le service
 * worker) pour ne pas alourdir le premier affichage.
 */
export interface PackIcon {
  /** Contenu SVG (grille 32 × 32). */
  b: string;
  /** Libellé français. */
  l: string;
  /** Mots-clés français. */
  k: string[];
  /** Catégorie du catalogue. */
  c: string;
}

export type IconPack = Record<string, PackIcon>;

/**
 * Icônes de plats (`src/icons/dishes`), pour les recettes : préfixées pour ne jamais
 * prendre la clé d'un article, rangées dans une catégorie à elles.
 */
export const DISH_PREFIX = "plat-";
export const DISH_CATEGORY = "plats";

/** Catégories proposées en tête du choix d'icône d'une recette : plats et desserts. */
export const RECIPE_ICON_CATEGORIES = new Set([
  DISH_CATEGORY,
  "traiteur",
  "yaourts-desserts",
  "biscuits-gateaux",
]);

let pack: IconPack | null = null;
let loading: Promise<IconPack> | null = null;
const listeners = new Set<() => void>();

export function loadIconPack(): Promise<IconPack> {
  loading ??= import("./packData").then((module) => {
    pack = module.default;
    for (const listener of listeners) listener();
    return pack;
  });
  return loading;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * L'icône `name` du pack. Le nom peut venir d'un lien reçu : seules les icônes du
 * pack comptent, pas les propriétés héritées (`constructor`, `toString`…).
 */
export function packIcon(pack: IconPack, name: string): PackIcon | undefined {
  return Object.hasOwn(pack, name) ? pack[name] : undefined;
}

/** Le pack, ou `null` tant qu'il n'est pas chargé (le chargement démarre au premier appel). */
export function useIconPack(): IconPack | null {
  const current = useSyncExternalStore(subscribe, () => pack);
  if (!current) void loadIconPack();
  return current;
}

/** Toutes les icônes du pack sont dessinées sur la même grille. */
export const ICON_VIEWBOX = "0 0 32 32";
