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
  /** Vendu au poids, se compte à la pièce (docs/06 § 1). */
  countable?: boolean;
  /** Article générique (« Fruits au choix »). */
  generic?: boolean;
  icon?: string;
  /** Version du catalogue qui l'a ajouté (absente : 1), pour la mise à jour sans réinstaller. */
  since?: number;
  /**
   * Mois de saison (1 à 12) par zone (docs/06 § 4) : fruits, légumes et herbes
   * aromatiques. Absent : pas de saison connue (produit importé, article générique).
   */
  season?: Partial<Record<SeasonZone, number[]>>;
}

/**
 * Zone des saisons : l'endroit où l'on fait ses courses, sans lien avec la langue de
 * l'interface (docs/06 § 4). Seule zone connue : la France métropolitaine, sans réglage.
 * Une autre zone (pays, hémisphère sud) = une clé de plus dans `season`.
 */
export type SeasonZone = "FR";
export const SEASON_ZONE: SeasonZone = "FR";
/**
 * Version du catalogue qui a apporté les mois de saison : copiés à la mise à jour dans
 * les articles du catalogue qui n'en ont pas encore (docs/06 § 7).
 */
export const SEASONS_SINCE = 10;

export { CATALOG_VERSION } from "./catalogVersion";

/**
 * Corrections d'articles déjà livrés (docs/06 § 7) : appliquées à la mise à jour du
 * catalogue, seulement sur un article que l'utilisateur n'a jamais modifié.
 */
export interface CatalogFix {
  /** Version du catalogue qui apporte la correction. */
  since: number;
  key: string;
  /** Nouvelle unité par défaut (clé d'unité). */
  unit?: string;
  /** Nouvelle quantité par défaut ; `null` : la retirer. */
  quantity?: number | null;
  /** Se compte à la pièce. */
  countable?: boolean;
}

/** Un nombre seul compte des objets (docs/03 A2, décision du 16 novembre 2026). */
const COUNTABLE = [
  "pommes",
  "poires",
  "oranges",
  "clementines",
  "peches",
  "nectarines",
  "abricots",
  "prunes",
  "tomates",
  "pommes-de-terre",
  "carottes",
  "navets",
  "betteraves",
  "panais",
  "topinambours",
  "blancs-de-poulet",
  "saint-jacques",
];
const BY_THE_PIECE = [
  "oignons",
  "echalotes",
  "poireaux",
  "courgettes",
  "endives",
  "patates-douces",
];

export const catalogFixes: CatalogFix[] = [
  { since: 4, key: "litiere", unit: "paquet" },
  ...COUNTABLE.map((key) => ({ since: 8, key, countable: true })),
  ...BY_THE_PIECE.map((key) => ({
    since: 8,
    key,
    unit: "piece",
    quantity: null,
  })),
];

export const catalogData = catalogJson as CatalogArticleData[];
