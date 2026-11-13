import type { ByLanguage } from "./index";
import catalogJson from "./catalog.json";

/**
 * Catalogue de départ (docs/06 § 4), à part des autres données initiales : il n'est
 * chargé qu'au premier lancement, pour ne pas alourdir le démarrage.
 */
export interface CatalogArticleData {
  key: string;
  name: ByLanguage<string>;
  aliases?: ByLanguage<string[]>;
  types?: ByLanguage<string[]>;
  category: string;
  unit: string;
  /** Quantité par défaut ; absente : 1 (ou le pas de l'unité). */
  quantity?: number;
  /** Article générique (« Fruits au choix »). */
  generic?: boolean;
  icon?: string;
  /** Version du catalogue qui l'a ajouté (absente : 1), pour la mise à jour sans réinstaller. */
  since?: number;
}

/** Version du catalogue embarqué : augmente quand il s'enrichit ou se corrige. */
export const CATALOG_VERSION = 4;

/**
 * Corrections d'articles déjà livrés (docs/06 § 7) : appliquées à la mise à jour du
 * catalogue, seulement sur un article que l'utilisateur n'a jamais modifié.
 */
export interface CatalogFix {
  /** Version du catalogue qui apporte la correction. */
  since: number;
  key: string;
  /** Nouvelle unité par défaut (clé d'unité). */
  unit: string;
}

export const catalogFixes: CatalogFix[] = [
  { since: 4, key: "litiere", unit: "paquet" },
];

export const catalogData = catalogJson as CatalogArticleData[];
