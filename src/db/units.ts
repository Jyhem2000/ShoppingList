import type { ID, Unit } from "@/domain/model";
import { changeUnit } from "@/domain/quantity";
import { slugify } from "@/domain/slug";
import type { ShoppingDatabase } from "./database";

/**
 * Unités (docs/02 § 5, docs/03 G4) : créer, modifier (libellés, dimension, facteur, pas),
 * supprimer en choisissant une unité de remplacement.
 */

export type UnitInput = Pick<
  Unit,
  "singular" | "plural" | "abbr" | "dimension" | "group" | "factor" | "step"
>;

export async function createUnit(
  database: ShoppingDatabase,
  input: UnitInput,
  now = Date.now(),
): Promise<Unit | "nameTaken"> {
  return database.transaction("rw", database.units, async () => {
    const slug = slugify(input.singular);
    if (await database.units.where("slug").equals(slug).first())
      return "nameTaken";
    const unit: Unit = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      slug,
      ...input,
      aliases: [],
    };
    await database.units.add(unit);
    return unit;
  });
}

export async function updateUnit(
  database: ShoppingDatabase,
  id: ID,
  changes: Partial<UnitInput>,
  now = Date.now(),
): Promise<"saved" | "nameTaken"> {
  return database.transaction("rw", database.units, async () => {
    const next: Partial<Unit> = { ...changes, updatedAt: now };
    if (changes.singular !== undefined) {
      const slug = slugify(changes.singular);
      const other = await database.units.where("slug").equals(slug).first();
      if (other && other.id !== id) return "nameTaken";
      next.slug = slug;
    }
    await database.units.update(id, next);
    return "saved";
  });
}

/** Combien de lignes et d'articles l'utilisent (avant de la supprimer). */
export async function unitUsage(
  database: ShoppingDatabase,
  id: ID,
): Promise<{ lines: number; articles: number }> {
  return {
    lines: await database.items
      .filter((item) => item.unitId === id && !item.closedInSessionId)
      .count(),
    articles: await database.articles
      .filter((a) => a.defaultUnitId === id)
      .count(),
  };
}

/**
 * Supprimer une unité : lignes, articles et historique passent à l'unité de
 * remplacement, la quantité convertie quand c'est possible (g → kg), gardée sinon.
 */
export async function deleteUnit(
  database: ShoppingDatabase,
  id: ID,
  replacementId: ID,
  now = Date.now(),
): Promise<void> {
  if (id === replacementId) return;
  await database.transaction(
    "rw",
    [database.units, database.items, database.articles, database.purchases],
    async () => {
      const [unit, replacement] = await database.units.bulkGet([
        id,
        replacementId,
      ]);
      if (!unit || !replacement) return;
      const convert = (quantity: number) =>
        changeUnit(quantity, unit, replacement);
      await database.items
        .filter((item) => item.unitId === id)
        .modify((item) => {
          item.quantity = convert(item.quantity);
          item.unitId = replacementId;
          item.updatedAt = now;
        });
      await database.purchases
        .filter((p) => p.unitId === id)
        .modify((p) => {
          p.quantity = convert(p.quantity);
          p.unitId = replacementId;
        });
      await database.articles
        .filter((a) => a.defaultUnitId === id)
        .modify((a) => {
          if (a.defaultQuantity !== undefined)
            a.defaultQuantity = convert(a.defaultQuantity);
          a.defaultUnitId = replacementId;
          a.updatedAt = now;
        });
      await database.units.delete(id);
    },
  );
}
