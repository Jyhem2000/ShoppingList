import type { ID, ListItem, Unit } from "./model";
import { formatQuantity, mergeQuantity } from "./quantity";

/**
 * Ajout du contenu d'autres listes à une liste (docs/02 § 6, « Ajouter une liste
 * dans une autre ») : une ligne par article, quantités fusionnées.
 */
export type MergeSource = Pick<
  ListItem,
  "articleId" | "quantity" | "unitId" | "acceptedTypes" | "note"
>;

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

/** Types acceptés : « peu importe » (vide) l'emporte, sinon la réunion des deux. */
function mergeTypes(a: string[], b: string[]): string[] {
  if (a.length === 0 || b.length === 0) return [];
  return [...new Set([...a, ...b])];
}

function mergeNotes(a?: string, b?: string): string | undefined {
  const notes = [a, b].filter((note): note is string => Boolean(note?.trim()));
  return notes.length ? [...new Set(notes)].join(" · ") : undefined;
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
  const unitById = new Map(units.map((unit) => [unit.id, unit]));
  const current = new Map<ID, MergeLine>();
  const touched = new Set<ID>();
  for (const item of target)
    current.set(item.articleId, {
      articleId: item.articleId,
      existingId: item.id,
      quantity: item.quantity,
      unitId: item.unitId,
      acceptedTypes: item.acceptedTypes,
      note: item.note,
      kind: "merged",
    });

  for (const source of sources) {
    touched.add(source.articleId);
    const line = current.get(source.articleId);
    if (!line) {
      current.set(source.articleId, { ...source, kind: "new" });
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
    const acceptedTypes = mergeTypes(line.acceptedTypes, source.acceptedTypes);
    if (merged.kind === "merged") {
      current.set(source.articleId, {
        ...line,
        quantity: merged.quantity,
        unitId: merged.unit.id,
        acceptedTypes,
        note: mergeNotes(line.note, source.note),
      });
    } else {
      const extra = addedUnit
        ? `+ ${formatQuantity(source.quantity, addedUnit)}`
        : undefined;
      current.set(source.articleId, {
        ...line,
        acceptedTypes,
        note: mergeNotes(mergeNotes(line.note, extra), source.note),
        kind: line.kind === "new" ? "new" : "note",
      });
    }
  }

  return [...current.values()].filter((line) => touched.has(line.articleId));
}
