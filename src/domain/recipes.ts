import { entryAmount } from "./entry";
import { lineKey } from "./lines";
import { planListMerge, type MergeLine, type MergeSource } from "./listMerge";
import { byId } from "./collections";
import type { Article, ID, Recipe, Unit } from "./model";
import { slugify } from "./slug";
import {
  clean,
  convert,
  convertible,
  formatNumber,
  formatQuantity,
  simplify,
  unitGroup,
} from "./quantity";

/**
 * Recettes (docs/02 § 7, docs/03 E2) : quantités recalculées pour le rendement demandé,
 * puis aperçu de l'ajout à une liste.
 */
export type Ingredient = Recipe["ingredients"][number];

export type ScalingUnit = Pick<
  Unit,
  "id" | "dimension" | "factor" | "singular" | "plural" | "abbr" | "step"
>;

/** Arrondi au pas supérieur de l'unité : 1,5 oignon → 2 ; 375 g (pas de 50 g) → 400 g. */
function roundUpToStep(quantity: number, step: number): number {
  if (step <= 0) return quantity;
  return clean(Math.ceil(clean(quantity / step)) * step);
}

/**
 * Quantité d'un ingrédient pour `requested` (dans l'unité de rendement de la recette,
 * pour un rendement de référence `reference`) : une quantité fixe ne bouge pas ; sinon
 * `quantité × demandé ÷ rendement`, arrondie au pas supérieur de **la plus petite unité
 * de même dimension** (1 kg de farine pour 3 au lieu de 4 : 750 g, pas 1 kg au pas de
 * 0,5 kg ; l'unité où l'ingrédient est écrit ne change donc rien), puis simplifiée
 * (750 g reste 750 g, 1500 g → 1,5 kg). Pour le rendement de la recette, les quantités
 * restent celles de la fiche.
 */
export function scaleIngredient(
  ingredient: Pick<Ingredient, "quantity" | "unitId" | "fixed">,
  requested: number,
  reference: number,
  units: readonly ScalingUnit[],
): { quantity: number; unitId: ID } {
  const { quantity, unitId } = ingredient;
  const unit = units.find((candidate) => candidate.id === unitId);
  if (ingredient.fixed || requested === reference || reference <= 0 || !unit)
    return { quantity, unitId };
  const finest = units
    .filter((candidate) => convertible(unit, candidate))
    .reduce(
      (best, candidate) =>
        (candidate.factor ?? 0) < (best.factor ?? 0) ? candidate : best,
      unit,
    );
  const inFinest = convert(quantity, unit, finest) ?? quantity;
  const scaled = roundUpToStep((inFinest * requested) / reference, finest.step);
  const simple = simplify({ quantity: scaled, unit: finest }, units);
  return { quantity: simple.quantity, unitId: simple.unit.id };
}

/** Toutes les quantités d'une recette pour le rendement demandé. */
export function scaleRecipe(
  recipe: Pick<Recipe, "yield" | "ingredients">,
  requested: number,
  units: readonly ScalingUnit[],
): (Ingredient & { quantity: number; unitId: ID })[] {
  return recipe.ingredients.map((ingredient) => ({
    ...ingredient,
    ...scaleIngredient(ingredient, requested, recipe.yield.quantity, units),
  }));
}

/** Ce que l'ajout d'une recette à une liste lit d'un article. */
export type ShoppingArticle = Pick<
  Article,
  "id" | "defaultUnitId" | "defaultQuantity" | "countable"
>;

/**
 * Ce qui part sur la liste pour un ingrédient (docs/02 § 7) : sa quantité, sauf en unité
 * de cuisine (cuillère, verre, décilitre, pincée), qui ne s'achète pas. La ligne prend
 * alors la quantité par défaut de l'article (1 bouteille de vin blanc) et la quantité de
 * la recette passe en note (« 1 verre ») ; une ligne déjà dans la liste garde la sienne
 * et reçoit seulement la note.
 */
function shoppingAmount(
  quantity: number,
  unitId: ID,
  article: ShoppingArticle | undefined,
  units: readonly Unit[],
  unitById: ReadonlyMap<ID, Unit>,
): Pick<MergeSource, "quantity" | "unitId" | "note" | "onlyIfNew"> {
  const unit = unitById.get(unitId);
  // Quantité habituelle de l'article : celle d'un article tapé sans quantité (A2).
  const usual = article && entryAmount({ text: "" }, article, units, false);
  if (
    !unit ||
    unitGroup(unit) !== "kitchen" ||
    !usual ||
    unitGroup(usual.unit) === "kitchen"
  )
    return { quantity, unitId };
  return {
    quantity: usual.quantity,
    unitId: usual.unit.id,
    note: formatQuantity(quantity, unit),
    onlyIfNew: true,
  };
}

/** Une ligne de l'aperçu « Ajouter à une liste » (docs/02 § 7, étape 3). */
export interface RecipeAddLine {
  /** Rang de l'ingrédient dans la recette. */
  index: number;
  articleId: ID;
  acceptedTypes: string[];
  /** Quantité recalculée, à ajouter (celle de l'article pour une unité de cuisine). */
  quantity: number;
  unitId: ID;
  /** Quantité de la recette en unité de cuisine, notée sur la ligne. */
  note?: string;
  onlyIfNew?: boolean;
  optional: boolean;
  /** Coché par défaut, sauf les ingrédients facultatifs. */
  checked: boolean;
  /** Ligne aux mêmes types déjà dans la liste. */
  existing?: { id: ID; quantity: number; unitId: ID; note?: string };
  /**
   * Résultat dans la liste si on ajoute cet ingrédient seul : nouvelle ligne, quantité
   * fusionnée, ou quantité passée en note (unités non convertibles).
   */
  result: MergeLine;
}

/**
 * Aperçu de l'ajout d'une recette à une liste. `target` : les lignes actives (non
 * archivées) de la liste. Seule une ligne aux mêmes types reçoit l'ingrédient (docs/02
 * § 6) ; « 2 Golden » ne fusionne pas avec « Pommes, peu importe ».
 */
export function planRecipeAdd(
  recipe: Pick<Recipe, "yield" | "ingredients">,
  requested: number,
  target: readonly (MergeSource & { id: ID })[],
  units: readonly Unit[],
  articles: readonly ShoppingArticle[],
): RecipeAddLine[] {
  const byKey = new Map(target.map((item) => [lineKey(item), item]));
  const unitById = byId(units);
  const articleById = byId(articles);
  return scaleRecipe(recipe, requested, units).map((ingredient, index) => {
    const source: MergeSource = {
      articleId: ingredient.articleId,
      acceptedTypes: ingredient.acceptedTypes,
      ...shoppingAmount(
        ingredient.quantity,
        ingredient.unitId,
        articleById.get(ingredient.articleId),
        units,
        unitById,
      ),
    };
    const existing = byKey.get(lineKey(source));
    const [result] = planListMerge(existing ? [existing] : [], [source], units);
    return {
      index,
      articleId: ingredient.articleId,
      acceptedTypes: ingredient.acceptedTypes,
      quantity: source.quantity,
      unitId: source.unitId,
      note: source.note,
      onlyIfNew: source.onlyIfNew,
      optional: ingredient.optional,
      checked: !ingredient.optional,
      existing: existing && {
        id: existing.id,
        quantity: existing.quantity,
        unitId: existing.unitId,
        note: existing.note,
      },
      result: result ?? { ...source, kind: "new" },
    };
  });
}

/**
 * Lignes à créer ou modifier pour les ingrédients cochés : la fusion se fait sur
 * l'ensemble, si bien que deux ingrédients du même article et des mêmes types
 * s'additionnent.
 */
export function recipeMerge(
  lines: readonly Pick<
    RecipeAddLine,
    | "articleId"
    | "acceptedTypes"
    | "quantity"
    | "unitId"
    | "note"
    | "onlyIfNew"
    | "checked"
  >[],
  target: readonly (MergeSource & { id: ID })[],
  units: readonly Unit[],
): MergeLine[] {
  return planListMerge(
    target,
    lines
      .filter((line) => line.checked)
      .map(
        ({ articleId, acceptedTypes, quantity, unitId, note, onlyIfNew }) => ({
          articleId,
          acceptedTypes,
          quantity,
          unitId,
          note,
          onlyIfNew,
        }),
      ),
    units,
  );
}

/** Accorde le premier mot de l'unité de rendement : « personnes » → « personne », « cake » → « cakes ». */
function agree(word: string, plural: boolean): string {
  const lower = word.toLowerCase();
  if (plural) {
    if (/[sxz]$/.test(lower)) return word;
    if (/(au|eu)$/.test(lower)) return `${word}x`;
    return `${word}s`;
  }
  if (/(eaux|eux)$/.test(lower)) return word.slice(0, -1);
  if (/[^s]s$/.test(lower)) return word.slice(0, -1);
  return word;
}

/**
 * Rendement en clair, accordé au nombre (docs/02 § 7) : « 4 personnes », « 1 personne »,
 * « 1 cake », « 2 cakes », « 12 gâteaux ». Seul le premier mot de l'unité s'accorde
 * (« 2 parts de tarte »). Une unité vide donne le nombre seul.
 */
export function yieldLabel(quantity: number, unit: string): string {
  const [first = "", ...rest] = unit.trim().split(/\s+/);
  if (!first) return formatNumber(quantity);
  const words = [agree(first, quantity >= 2), ...rest].join(" ");
  return `${formatNumber(quantity)} ${words}`;
}

/**
 * Nom d'une recette reçue (docs/03 E3) : le sien, ou « Raclette (2) » si une recette
 * porte déjà ce nom (rien n'est remplacé). Un numéro déjà là est repris : la copie de
 * « Raclette (2) » est « Raclette (3) » (premier numéro libre), pas « Raclette (2) (2) ».
 */
export function uniqueRecipeName(
  name: string,
  taken: readonly string[],
): string {
  const used = new Set(taken.map(slugify));
  if (!used.has(slugify(name))) return name;
  const base = name.replace(/\s*\(\d+\)$/, "") || name;
  for (let n = 2; ; n++) {
    const candidate = `${base} (${n})`;
    if (!used.has(slugify(candidate))) return candidate;
  }
}
