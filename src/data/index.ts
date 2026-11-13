import type { Dimension, UnitGroup } from "@/domain/model";
import categoriesJson from "./categories.json";
import keywordsJson from "./keywords.json";
import storeTemplatesJson from "./store-templates.json";
import unitsJson from "./units.json";

/**
 * Données initiales (docs/06), copiées dans la base au premier lancement. Les textes
 * sont rangés par langue ; la v1 ne remplit que `fr`. Les `key` sont les clés
 * catalogue : identifiants techniques figés pour toujours, jamais affichés.
 */
export interface ByLanguage<T> {
  fr: T;
}

export interface UnitData {
  key: string;
  name: ByLanguage<{ singular: string; plural: string; abbr?: string }>;
  dimension: Dimension;
  group: UnitGroup;
  factor?: number;
  step: number;
  aliases?: ByLanguage<string[]>;
}

export interface CategoryData {
  key: string;
  name: ByLanguage<string>;
  /** Unité suggérée pour un nouvel article de la catégorie. */
  unit: string;
  color: string;
  icon?: string;
  /** « Autres » : toujours présente, non supprimable. */
  system?: boolean;
  /** Version du catalogue qui l'a ajoutée (absente : 1). */
  since?: number;
}

export interface StoreTemplateData {
  key: string;
  name: ByLanguage<string>;
  aisles: {
    name: ByLanguage<string>;
    color: string;
    icon?: string;
    categories: { category: string; primary: boolean }[];
  }[];
}

/** Règle du dictionnaire de mots-clés (docs/06 § 5). */
export interface KeywordRule {
  match: string[];
  category: string;
  unit: string;
  icon?: string;
}

/** Modèle du magasin créé au premier lancement (« Mon supermarché »). */
export const DEFAULT_STORE_TEMPLATE = "supermarche";

export const unitsData = unitsJson as UnitData[];
export const categoriesData = categoriesJson as CategoryData[];

/**
 * Catégorie système des achats ponctuels (docs/03 A4) : un article qu'on n'achète
 * qu'une fois (une friteuse) y est rangé sans encombrer le catalogue ; il passe en
 * article normal en recevant une vraie catégorie.
 */
export const ONE_OFF_CATEGORY = "achats-ponctuels";
export const storeTemplatesData = storeTemplatesJson as StoreTemplateData[];
export const keywordRules = keywordsJson as KeywordRule[];
