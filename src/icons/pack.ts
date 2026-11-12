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

/** Le pack, ou `null` tant qu'il n'est pas chargé (le chargement démarre au premier appel). */
export function useIconPack(): IconPack | null {
  const current = useSyncExternalStore(subscribe, () => pack);
  if (!current) void loadIconPack();
  return current;
}

/** Toutes les icônes du pack sont dessinées sur la même grille. */
export const ICON_VIEWBOX = "0 0 32 32";
