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
export const CATALOG_VERSION = 7;

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

/**
 * Catégories du catalogue fondues dans une autre (docs/06 § 7) : à la mise à jour, la
 * catégorie `from` disparaît dans `into`, si l'utilisateur ne l'a jamais modifiée. Ses
 * articles gardent, dans chaque magasin, le rayon où ils étaient rangés.
 */
export interface CategoryMerge {
  since: number;
  from: string;
  into: string;
}

export const categoryMerges: CategoryMerge[] = [
  // Une catégorie pour un seul article : les œufs rejoignent la crèmerie.
  { since: 7, from: "oeufs", into: "lait-creme-beurre" },
];

/**
 * Catégories renommées dans le catalogue (docs/06 § 7) : le nouveau nom (celui des
 * données initiales) remplace `previous` seulement si l'utilisateur ne l'a pas changé.
 */
export interface CategoryRename {
  since: number;
  key: string;
  previous: string;
}

export const categoryRenames: CategoryRename[] = [
  { since: 7, key: "lait-creme-beurre", previous: "Lait, Crème & Beurre" },
];

export const catalogData = catalogJson as CatalogArticleData[];
