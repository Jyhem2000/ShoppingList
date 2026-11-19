import { lineKey } from "./lines";
import type { ID, ListItem, Unit } from "./model";
import { formatQuantity, mergeQuantity } from "./quantity";
import { byId } from "./collections";

/**
 * Ajout du contenu d'autres listes à une liste (docs/02 § 6, « Ajouter une liste
 * dans une autre ») : une ligne par article et par choix de types, quantités
 * fusionnées.
 */
export type MergeSource = Pick<
  ListItem,
  "articleId" | "quantity" | "unitId" | "acceptedTypes" | "note"
> & {
  /**
   * Quantité à créer seulement s'il n'y a pas encore de ligne (ingrédient en unité de
   * cuisine, docs/02 § 7) : une ligne déjà là garde sa quantité et reçoit `note`.
   */
  onlyIfNew?: boolean;
};

export interface MergeLine {
  articleId: ID;
  /** Ligne déjà présente dans la liste cible, à mettre à jour. */
  existingId?: ID;
  quantity: number;
  unitId: ID;
  acceptedTypes: string[];
  note?: string;
  /** `note` : unités non convertibles, l'autre quantité est passée en note. */
  kind: "new" | "merged" | "note";
}

/** Deux notes réunies sans doublon : « bio » et « bio » restent « bio ». */
export function mergeNotes(a?: string, b?: string): string | undefined {
  const notes = [a, b].filter((note): note is string => Boolean(note?.trim()));
  return notes.length ? [...new Set(notes)].join(" · ") : undefined;
}

/**
 * Une quantité ajoutée en note (« + 2 kg », « 1 verre ») : gardée même si elle est déjà
 * dans la note, car elle s'ajoute (la même recette deux fois : « 1 verre · 1 verre »).
 */
export function addQuantityNote(
  note: string | undefined,
  quantity: string | undefined,
): string | undefined {
  if (!quantity) return note;
  return note?.trim() ? `${note} · ${quantity}` : quantity;
}

/**
 * Recettes d'où vient une ligne, après l'ajout de `added` (docs/03 E2) : une recette
 * déjà présente garde sa place avec la nouvelle valeur, les autres suivent.
 */
export function mergeRecipeOrigins(
  origins: ListItem["fromRecipes"],
  added: ListItem["fromRecipes"],
): ListItem["fromRecipes"] {
  const byRecipe = new Map(added.map((r) => [r.recipeId, r]));
  const present = new Set(origins.map((r) => r.recipeId));
  return [
    ...origins.map((r) => byRecipe.get(r.recipeId) ?? r),
    ...added.filter((r) => !present.has(r.recipeId)),
  ];
}

/**
 * Lignes à créer ou à modifier dans la liste cible. Seules les lignes actives
 * (non archivées) de la cible doivent être passées dans `target`.
 */
export function planListMerge(
  target: readonly (MergeSource & { id: ID })[],
  sources: readonly MergeSource[],
  units: readonly Unit[],
): MergeLine[] {
  const unitById = byId(units);
  const current = new Map<string, MergeLine>();
  const touched = new Set<string>();
  for (const item of target)
    current.set(lineKey(item), {
      articleId: item.articleId,
      existingId: item.id,
      quantity: item.quantity,
      unitId: item.unitId,
      acceptedTypes: item.acceptedTypes,
      note: item.note,
      kind: "merged",
    });

  for (const source of sources) {
    const key = lineKey(source);
    touched.add(key);
    const line = current.get(key);
    if (!line) {
      const { articleId, quantity, unitId, acceptedTypes, note } = source;
      current.set(key, {
        articleId,
        quantity,
        unitId,
        acceptedTypes,
        ...(note !== undefined && { note }),
        kind: "new",
      });
      continue;
    }
    if (source.onlyIfNew) {
      current.set(key, {
        ...line,
        note: addQuantityNote(line.note, source.note),
        kind: line.kind === "new" ? "new" : "note",
      });
      continue;
    }
    const existingUnit = unitById.get(line.unitId);
    const addedUnit = unitById.get(source.unitId);
    const merged =
      existingUnit && addedUnit
        ? mergeQuantity(
            { quantity: line.quantity, unit: existingUnit },
            { quantity: source.quantity, unit: addedUnit },
            units,
          )
        : { kind: "incompatible" as const };
    if (merged.kind === "merged") {
      current.set(key, {
        ...line,
        quantity: merged.quantity,
        unitId: merged.unit.id,
        note: mergeNotes(line.note, source.note),
      });
    } else {
      const extra = addedUnit
        ? `+ ${formatQuantity(source.quantity, addedUnit)}`
        : undefined;
      current.set(key, {
        ...line,
        note: mergeNotes(addQuantityNote(line.note, extra), source.note),
        kind: line.kind === "new" ? "new" : "note",
      });
    }
  }

  return [...current.values()].filter((line) => touched.has(lineKey(line)));
}
