import { countBy } from "./collections";
import type { Unit, UnitGroup } from "./model";

/**
 * Quantités et unités (docs/02 § 5, docs/07 § 7.8). Deux unités sont convertibles
 * si elles ont la même dimension et que ce n'est pas « autre » (g ↔ kg, cl ↔ L).
 */
export type QuantityUnit = Pick<
  Unit,
  "id" | "dimension" | "factor" | "singular" | "plural" | "abbr"
>;

export interface Amount<U extends QuantityUnit = QuantityUnit> {
  quantity: number;
  unit: U;
}

/** Corrige les erreurs d'arrondi des nombres à virgule (0,1 + 0,2). */
export function clean(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}

export function convertible(from: QuantityUnit, to: QuantityUnit): boolean {
  return (
    from.dimension === to.dimension &&
    from.dimension !== "other" &&
    from.factor !== undefined &&
    to.factor !== undefined
  );
}

/** Quantité exprimée dans `to`, ou `undefined` si les unités ne sont pas convertibles. */
export function convert(
  quantity: number,
  from: QuantityUnit,
  to: QuantityUnit,
): number | undefined {
  if (from.id === to.id) return quantity;
  if (!convertible(from, to) || !from.factor || !to.factor) return undefined;
  return clean((quantity * from.factor) / to.factor);
}

/** Changement d'unité d'une ligne : convertit si possible, sinon garde la quantité. */
export function changeUnit(
  quantity: number,
  from: QuantityUnit,
  to: QuantityUnit,
): number {
  return convert(quantity, from, to) ?? quantity;
}

function hasAtMostThreeDecimals(value: number): boolean {
  return Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-6;
}

/**
 * La plus grande unité de même dimension qui donne une valeur ≥ 1 avec 3 décimales
 * au plus ; sinon la quantité reste telle quelle. 1200 g → 1,2 kg ; 33 cl reste 33 cl.
 */
export function simplify<U extends QuantityUnit>(
  amount: Amount<U>,
  units: readonly U[],
): Amount<U> {
  const candidates = units
    .filter((unit) => convertible(amount.unit, unit))
    .sort((a, b) => (b.factor ?? 0) - (a.factor ?? 0));
  for (const unit of candidates) {
    const value = convert(amount.quantity, amount.unit, unit);
    if (value !== undefined && value >= 1 && hasAtMostThreeDecimals(value))
      return { quantity: value, unit };
  }
  return amount;
}

/** Unité réglable par − / + : elle a un pas (docs/06 § 1). */
export type SteppedUnit = QuantityUnit & Pick<Unit, "step">;

export interface StepOptions<U> {
  /** Unité de l'article : on n'en descend pas, on y revient en descendant. */
  home?: U;
}

/**
 * − / + d'une quantité (docs/02 § 5) : avance d'un pas de l'unité, en se calant sur
 * ses multiples (1,25 kg → 1,5 kg ou 1 kg). En montant, passe à la plus grande unité
 * quand la valeur s'y simplifie (950 g → 1 kg, puis 1,5 kg) ; une quantité gardée
 * exprès dans la petite unité (1200 g, « Annuler ») y reste. En descendant sous 1,
 * repasse à l'unité plus petite — `home` de préférence — et y continue (1 kg → 950 g),
 * sauf dans l'unité de l'article elle-même (pommes de terre au kg : 1 kg → 0,5 kg).
 * `undefined` : impossible de descendre plus bas.
 */
export function stepAmount<U extends SteppedUnit>(
  amount: Amount<U>,
  direction: 1 | -1,
  units: readonly U[],
  { home }: StepOptions<U> = {},
): Amount<U> | undefined {
  const step = amount.unit.step > 0 ? amount.unit.step : 1;
  const ratio = amount.quantity / step;
  if (direction === 1) {
    const next = {
      quantity: clean((Math.floor(ratio + 1e-9) + 1) * step),
      unit: amount.unit,
    };
    const simple = simplify(next, units);
    // Déjà exprimable dans cette unité-là sans y être : gardée exprès en petit.
    const keptSmall = simplify(amount, units).unit.id === simple.unit.id;
    return !keptSmall && (simple.unit.factor ?? 0) > (amount.unit.factor ?? 0)
      ? simple
      : next;
  }
  const quantity = clean((Math.ceil(ratio - 1e-9) - 1) * step);
  const kept = quantity > 0 ? { quantity, unit: amount.unit } : undefined;
  if (quantity >= 1 || amount.unit.id === home?.id) return kept;
  const smaller = smallerUnit(amount.unit, units, home);
  const converted = smaller && convert(amount.quantity, amount.unit, smaller);
  if (smaller && converted !== undefined)
    return stepAmount({ quantity: converted, unit: smaller }, -1, units, {
      home,
    });
  return kept;
}

/** Unité de même dimension juste plus petite, ou `home` si elle est plus petite. */
function smallerUnit<U extends QuantityUnit>(
  unit: U,
  units: readonly U[],
  home?: U,
): U | undefined {
  const below = units.filter(
    (u) => convertible(unit, u) && (u.factor ?? 0) < (unit.factor ?? 0),
  );
  if (home && below.some((u) => u.id === home.id)) return home;
  return below.sort((a, b) => (b.factor ?? 0) - (a.factor ?? 0))[0];
}

/**
 * − / + d'un nombre de personnes ou de parts (rendement d'une recette, quantité voulue
 * à l'ajout) : nombres entiers, au moins 1 ; une valeur à virgule se cale sur l'entier
 * voisin (2,5 → 3 ou 2). `undefined` : impossible de descendre sous 1.
 */
export function stepCount(value: number, direction: 1): number;
export function stepCount(value: number, direction: 1 | -1): number | undefined;
export function stepCount(
  value: number,
  direction: 1 | -1,
): number | undefined {
  if (direction === 1) return Math.floor(value + 1e-9) + 1;
  return value > 1 ? Math.max(1, Math.ceil(value - 1e-9) - 1) : undefined;
}

export type MergeResult<U extends QuantityUnit> =
  ({ kind: "merged" } & Amount<U>) | { kind: "incompatible" };

/**
 * Ajout d'une quantité à une ligne existante (docs/02 § 6) : même unité → somme ;
 * convertible → somme dans l'unité existante puis simplification ; sinon l'interface
 * demande quoi faire.
 */
export function mergeQuantity<U extends QuantityUnit>(
  existing: Amount<U>,
  added: Amount<U>,
  units: readonly U[],
): MergeResult<U> {
  if (existing.unit.id === added.unit.id)
    return {
      kind: "merged",
      quantity: clean(existing.quantity + added.quantity),
      unit: existing.unit,
    };
  const converted = convert(added.quantity, added.unit, existing.unit);
  if (converted === undefined) return { kind: "incompatible" };
  return {
    kind: "merged",
    ...simplify(
      { quantity: clean(existing.quantity + converted), unit: existing.unit },
      units,
    ),
  };
}

const numberFormat = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 3,
});

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** Pluriel à partir de 2, comme en français (« 1,5 kilogramme », « 2 kilogrammes »). */
function unitWord(quantity: number, unit: QuantityUnit): string {
  return quantity >= 2 ? unit.plural : unit.singular;
}

/**
 * Affichage d'une quantité : `short` dans les listes (`1,2 kg`, `× 3`, `2 boîtes`),
 * `long` dans les phrases (« 6 litres », « 1 pièce »).
 */
export function formatQuantity(
  quantity: number,
  unit: QuantityUnit,
  style: "short" | "long" = "short",
): string {
  const value = formatNumber(quantity);
  if (style === "long") return `${value} ${unitWord(quantity, unit)}`;
  if (!unit.abbr) return `× ${value}`;
  // Une abréviation qui est un mot entier (« boîte ») prend le pluriel.
  const label =
    unit.abbr === unit.singular ? unitWord(quantity, unit) : unit.abbr;
  return `${value} ${label}`;
}

/** Groupes du sélecteur d'unité, dans l'ordre d'affichage (docs/06 § 1). */
/** Nombre saisi au clavier, virgule ou point (« 1,5 ») ; `NaN` s'il n'en est pas un. */
export function parseNumber(text: string): number {
  return Number(text.trim().replace(",", "."));
}

/** Unité « pièce » : le repli quand rien n'est deviné, et pour compter des objets. */
export const PIECE_UNIT = "piece";

/** L'unité de l'utilisateur pour une clé du catalogue (même renommée), sinon par slug. */
export function unitByKey<U extends Pick<Unit, "catalogKey" | "slug">>(
  units: readonly U[],
  key: string | undefined,
): U | undefined {
  if (!key) return undefined;
  return (
    units.find((u) => u.catalogKey === key) ?? units.find((u) => u.slug === key)
  );
}

/** L'unité « pièce » de l'utilisateur (celle du catalogue, même renommée). */
export function pieceUnit<U extends Pick<Unit, "catalogKey" | "slug">>(
  units: readonly U[],
): U | undefined {
  return unitByKey(units, PIECE_UNIT);
}

/**
 * Unités habituelles d'un article (fiche d'une ligne), au plus `max` : `fixed` dans
 * l'ordre (son unité par défaut, celle de sa catégorie, « pièce »), puis les unités de
 * `used` (celles de ses autres lignes), les plus fréquentes d'abord. Sans doublon ;
 * une unité disparue est ignorée.
 */
export function usualUnits<U extends { id: string }>(
  fixed: readonly (string | undefined)[],
  used: readonly string[],
  unitById: ReadonlyMap<string, U>,
  max = 4,
): U[] {
  const byUse = [...countBy(used, (id) => id).entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
  return [...new Set([...fixed, ...byUse])]
    .flatMap((id) => {
      const unit = id === undefined ? undefined : unitById.get(id);
      return unit ? [unit] : [];
    })
    .slice(0, max);
}

export const UNIT_GROUPS: readonly UnitGroup[] = [
  "mass",
  "volume",
  "container",
  "count",
  "kitchen",
];

/** Groupe d'une unité ; une unité sans groupe le déduit de sa dimension. */
export function unitGroup(unit: Pick<Unit, "group" | "dimension">): UnitGroup {
  if (unit.group) return unit.group;
  return unit.dimension === "other" ? "count" : unit.dimension;
}

/**
 * Libellé d'une unité dans le sélecteur : le nom, suivi du symbole pour les poids et
 * volumes (« gramme (g) », « litre (L) »), le nom seul ailleurs (« barquette »).
 */
export function unitOptionLabel(
  unit: Pick<Unit, "singular" | "abbr" | "group" | "dimension">,
): string {
  const group = unitGroup(unit);
  return (group === "mass" || group === "volume") && unit.abbr
    ? `${unit.singular} (${unit.abbr})`
    : unit.singular;
}
