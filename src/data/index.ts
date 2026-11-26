import { appLanguage, type ByLanguage } from "@/domain/language";
import type { Dimension, UnitGroup } from "@/domain/model";
import categoriesJson from "./categories.json";
import familiesJson from "./families.json";
import keywordsJson from "./keywords.json";
import unitsJson from "./units.json";

/**
 * Données initiales (docs/06), copiées dans la base au premier lancement. Les textes
 * sont rangés par langue (français, anglais). Les `key` sont les clés catalogue :
 * identifiants techniques figés pour toujours, jamais affichés.
 */

export interface UnitData {
  key: string;
  name: ByLanguage<{ singular: string; plural: string; abbr?: string }>;
  dimension: Dimension;
  group: UnitGroup;
  factor?: number;
  step: number;
  aliases?: ByLanguage<string[]>;
  /** Version du catalogue qui l'a introduite (docs/06 § 7) ; absente : 1. */
  since?: number;
}

export interface CategoryData {
  key: string;
  name: ByLanguage<string>;
  /** Nom court, pour le titre d'un rayon (docs/02 § 4) : « Pain », « Café & thé ». */
  short?: ByLanguage<string>;
  /** Famille (clé de `families.json`) : titre d'un rayon fait d'une seule famille. */
  family?: string;
  /** Unité suggérée pour un nouvel article de la catégorie. */
  unit: string;
  color: string;
  icon?: string;
  /** « Autres » : toujours présente, non supprimable. */
  system?: boolean;
  /** Version du catalogue qui l'a ajoutée (absente : 1). */
  since?: number;
}

/** Famille de catégories (docs/06 § 2) : « Épicerie sucrée », « Frais »… */
export interface FamilyData {
  key: string;
  name: ByLanguage<string>;
}

/** Règle du dictionnaire de mots-clés (docs/06 § 5), mots par langue. */
export interface KeywordRuleData {
  match: ByLanguage<string[]>;
  category: string;
  unit: string;
  icon?: string;
}

/** Règle du dictionnaire, avec les mots de la langue de l'app. */
export interface KeywordRule extends Omit<KeywordRuleData, "match"> {
  match: string[];
}

export const unitsData = unitsJson as UnitData[];
export const categoriesData = categoriesJson as CategoryData[];
export const familiesData = familiesJson as FamilyData[];

export const keywordsData = keywordsJson as KeywordRuleData[];

/** Dictionnaire de mots-clés dans la langue de l'app, posée avant le chargement. */
export const keywordRules: KeywordRule[] = keywordsData.map((rule) => ({
  ...rule,
  match: rule.match[appLanguage()],
}));
