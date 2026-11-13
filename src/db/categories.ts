import type { Category, ID } from "@/domain/model";
import { slugify } from "@/domain/slug";
import { moveCategoryInAisles } from "@/domain/stores";
import type { ShoppingDatabase } from "./database";

/**
 * Catégories (docs/02 § 3, docs/03 G2) : créer, renommer, icône et couleur, fusionner,
 * supprimer. « Autres » et « Achats ponctuels » (système) ne se suppriment pas.
 */

export type SaveCategoryResult =
  { kind: "saved"; category: Category } | { kind: "nameTaken" };

export async function createCategory(
  database: ShoppingDatabase,
  input: Pick<Category, "name" | "icon" | "color">,
  now = Date.now(),
): Promise<SaveCategoryResult> {
  return database.transaction("rw", database.categories, async () => {
    const name = input.name.trim();
    const slug = slugify(name);
    if (await database.categories.where("slug").equals(slug).first())
      return { kind: "nameTaken" };
    const category: Category = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      slug,
      name,
      icon: input.icon,
      color: input.color,
      useIconAsFallback: true,
      isSystem: false,
    };
    await database.categories.add(category);
    return { kind: "saved", category };
  });
}

export async function updateCategory(
  database: ShoppingDatabase,
  id: ID,
  changes: Partial<Pick<Category, "name" | "shortName" | "icon" | "color">>,
  now = Date.now(),
): Promise<"saved" | "nameTaken"> {
  return database.transaction("rw", database.categories, async () => {
    const next: Partial<Category> = { ...changes, updatedAt: now };
    if (changes.name !== undefined) {
      const name = changes.name.trim();
      const slug = slugify(name);
      const other = await database.categories
        .where("slug")
        .equals(slug)
        .first();
      if (other && other.id !== id) return "nameTaken";
      next.name = name;
      next.slug = slug;
    }
    await database.categories.update(id, next);
    return "saved";
  });
}

/**
 * La catégorie `sourceId` disparaît : ses articles passent dans `targetId`, et dans
 * chaque magasin ses rayons deviennent ceux de la catégorie gardée (fusion), ou sont
 * simplement retirés (suppression vers « Autres », rangée dans « Non classé »).
 */
async function absorbCategory(
  database: ShoppingDatabase,
  sourceId: ID,
  targetId: ID,
  keepAisles: boolean,
  now: number,
): Promise<void> {
  await database.transaction(
    "rw",
    [database.categories, database.articles, database.aisles, database.stores],
    async () => {
      const source = await database.categories.get(sourceId);
      if (!source || source.isSystem || sourceId === targetId) return;
      await database.articles
        .where("categoryId")
        .equals(sourceId)
        .modify({ categoryId: targetId, updatedAt: now });
      for (const store of await database.stores.toArray()) {
        const aisles = await database.aisles
          .where("storeId")
          .equals(store.id)
          .toArray();
        for (const aisle of moveCategoryInAisles(
          aisles,
          sourceId,
          keepAisles ? targetId : undefined,
        ))
          await database.aisles.update(aisle.id, {
            categories: aisle.categories,
            updatedAt: now,
          });
      }
      await database.categories.delete(sourceId);
    },
  );
}

/** Fusionner : la catégorie gardée reprend ses articles et ses rayons. */
export async function mergeCategoryInto(
  database: ShoppingDatabase,
  sourceId: ID,
  targetId: ID,
  now = Date.now(),
): Promise<void> {
  await absorbCategory(database, sourceId, targetId, true, now);
}

/** Supprimer : ses articles passent dans la catégorie choisie (« Autres » par défaut). */
export async function deleteCategory(
  database: ShoppingDatabase,
  id: ID,
  moveArticlesTo: ID,
  now = Date.now(),
): Promise<void> {
  await absorbCategory(database, id, moveArticlesTo, false, now);
}
