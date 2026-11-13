/**
 * Types des données (docs/07 § 5). Partagés par la logique métier (`src/domain/`)
 * et la base de données (`src/db/`) ; aucune dépendance à React ni à Dexie.
 */
export type ID = string;

export interface Base {
  id: ID;
  createdAt: number;
  updatedAt: number;
}

export type Dimension = "mass" | "volume" | "other";

/** Groupe d'affichage du sélecteur d'unité ; `kitchen` (cuillère, pincée) : recettes seulement. */
export type UnitGroup = "mass" | "volume" | "container" | "count" | "kitchen";

export interface Unit extends Base {
  /** Unique. */
  slug: string;
  singular: string;
  plural: string;
  /** Absente : affichage « × n ». */
  abbr?: string;
  dimension: Dimension;
  /** Absent (unités créées avant les groupes) : déduit de la dimension. */
  group?: UnitGroup;
  /** Vers l'unité de base de la dimension (g, ml). */
  factor?: number;
  /** Pas des boutons +/− et de l'arrondi. */
  step: number;
  /** Pour l'analyse de saisie : ["kilo", "kilos"]. */
  aliases: string[];
  catalogKey?: string;
}

export interface Category extends Base {
  /** Unique. */
  slug: string;
  name: string;
  /**
   * Nom court choisi par l'utilisateur, pour le titre d'un rayon (docs/02 § 4) ; absent :
   * celui du catalogue (`catalogKey`), sinon le nom.
   */
  shortName?: string;
  /** Nom d'icône Lucide (docs/05 § 4). */
  icon?: string;
  /** Nom de la palette (docs/05 § 2). */
  color: string;
  useIconAsFallback: boolean;
  /** « Autres » : ne peut pas être supprimée. */
  isSystem: boolean;
  catalogKey?: string;
}

export interface Article extends Base {
  /** Unique, recalculé au renommage. */
  slug: string;
  name: string;
  categoryId: ID;
  defaultUnitId: ID;
  /** Ex. 6 pour les œufs ; sinon 1 (ou le pas de l'unité). */
  defaultQuantity?: number;
  /** Article générique (« Fruits au choix ») : en tête de sa catégorie et de son rayon. */
  generic?: boolean;
  types: string[];
  /** Slugifiés pour la comparaison. */
  aliases: string[];
  icon?: string;
  favorite: boolean;
  seasonMonths?: number[];
  barcodes: string[];
  /** Paires écartées de la détection de doublons. */
  notDuplicateOf: ID[];
  catalogKey?: string;
}

export interface Store extends Base {
  name: string;
  orderLocked: boolean;
  lastUsedAt?: number;
  /**
   * Ordre appris des articles dans ce magasin (docs/07 § 7.6) : score par article,
   * plus petit d'abord, comparé seulement entre articles d'un même rayon.
   */
  articleOrder?: Record<ID, number>;
}

export interface AisleCategory {
  categoryId: ID;
  primary: boolean;
}

/** Invariant : dans un magasin, une catégorie a au plus UN rayon où `primary` est vrai. */
export interface Aisle extends Base {
  storeId: ID;
  /**
   * Nom choisi par l'utilisateur ; vide = sans nom : le titre du rayon vient de ses
   * catégories (docs/02 § 4).
   */
  name: string;
  /** Repère libre : « au fond du magasin ». */
  description?: string;
  icon?: string;
  color: string;
  /** Score 0..1, appris ou manuel ; tri croissant. */
  position: number;
  categories: AisleCategory[];
  /**
   * Rayon « Non classé » d'un magasin, affiché « À placer » en mode courses : les articles
   * dont la catégorie n'a pas encore de rayon dans ce magasin (docs/03 C4).
   */
  isUnsorted: boolean;
}

export interface ArticleAisleOverride {
  id: ID;
  storeId: ID;
  articleId: ID;
  aisleId: ID;
}

export interface ShoppingList extends Base {
  name: string;
  position: number;
  lastStoreId?: ID;
}

export type ItemStatus = "todo" | "checked" | "unavailable";

export interface ListItem extends Base {
  listId: ID;
  /** Unique par liste (hors lignes archivées). */
  articleId: ID;
  quantity: number;
  unitId: ID;
  /** [] = peu importe. */
  acceptedTypes: string[];
  note?: string;
  status: ItemStatus;
  checkedAt?: number;
  /** Ligne achetée et clôturée : masquée, restaurée si réouverture. */
  closedInSessionId?: ID;
  fromRecipes: { recipeId: ID; amount: number }[];
}

export interface Recipe extends Base {
  name: string;
  icon?: string;
  /** { 4, "personnes" } ou { 1, "cake" }. */
  yield: { quantity: number; unit: string };
  ingredients: {
    articleId: ID;
    quantity: number;
    unitId: ID;
    acceptedTypes: string[];
    optional: boolean;
    /** Quantité fixe : non recalculée selon le rendement (docs/02 § 7). */
    fixed: boolean;
  }[];
  steps?: string;
}

export interface ShoppingSession {
  id: ID;
  listId: ID;
  storeId: ID;
  startedAt: number;
  status: "open" | "closed";
  closedAt?: number;
  /**
   * Rayon ouvert par « Rayon suivant » (docs/03 C4) et quand : il devient le rayon en
   * cours tant qu'aucune coche plus récente n'en désigne un autre.
   */
  openedAisle?: { aisleId: ID; at: number };
  /** État avant application de l'apprentissage, pour la réouverture. */
  learningSnapshot?: {
    aislePositions: Record<ID, number>;
    articleOrder: Record<ID, number>;
  };
}

/** Une ligne cochée lors d'une session. */
export interface Purchase {
  id: ID;
  sessionId: ID;
  storeId: ID;
  articleId: ID;
  aisleId: ID;
  quantity: number;
  unitId: ID;
  at: number;
}

export interface Settings {
  animations: "auto" | "always" | "never";
  compact: boolean;
  simplifyQuantities: boolean;
  checkedBehavior: "sink" | "hide";
  lastBackupAt?: number;
  /** Pour afficher « Quoi de neuf ». */
  lastSeenVersion?: string;
  catalogVersion: number;
  currentListId?: ID;
  dismissedSuggestions: { articleId: ID; until: number }[];
}
