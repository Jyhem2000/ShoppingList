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
function clean(value: number): number {
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
