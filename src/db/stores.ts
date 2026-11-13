import { storeTemplatesData } from "@/data";
import type { Aisle, Category, ID, Store } from "@/domain/model";
import {
  type CategoryRole,
  mergeAisles,
  removeAisle,
  setCategoryRole,
  sortAisles,
  spreadPositions,
} from "@/domain/stores";
import { fr } from "@/i18n/fr";
import type { ShoppingDatabase } from "./database";

/** Positions réparties uniformément sur [0, 1] (docs/07 § 7.6). */
function spread(index: number, count: number): number {
  return count > 1 ? index / (count - 1) : 0;
}

/**
 * Magasin créé à partir d'un modèle (docs/06 § 3) : ses rayons dans l'ordre du
 * modèle, sans nom (numérotés, désignés par leurs catégories), plus « Non classé » en
 * dernier.
 */
export function buildStore(
  templateKey: string,
  name: string,
  categories: readonly Category[],
  now: number,
  newId: () => ID = () => crypto.randomUUID(),
): { store: Store; aisles: Aisle[] } {
  const base = () => ({ id: newId(), createdAt: now, updatedAt: now });
  const template = storeTemplatesData.find((t) => t.key === templateKey);
  if (!template) throw new Error(`Modèle de magasin inconnu : ${templateKey}`);
  const categoryByKey = new Map(categories.map((c) => [c.catalogKey, c]));
  const store: Store = { ...base(), name, orderLocked: false };
  const aisles: Aisle[] = template.aisles.map((aisle, index) => ({
    ...base(),
    storeId: store.id,
    name: "",
    icon: aisle.icon,
    color: aisle.color,
    position: spread(index, template.aisles.length),
    // Une catégorie supprimée par l'utilisateur est simplement ignorée.
    categories: aisle.categories.flatMap((c) => {
      const category = categoryByKey.get(c.category);
      return category ? [{ categoryId: category.id, primary: c.primary }] : [];
    }),
    isUnsorted: false,
  }));
  // Catégories système (« Autres », « Achats ponctuels ») : rayon « Non classé ».
  const system = categories.filter((category) => category.isSystem);
  aisles.push({
    ...base(),
    storeId: store.id,
    name: fr.defaults.unsortedAisle,
    icon: "shopping-basket",
    color: "gris",
    position: 1,
    categories: system.map((c) => ({ categoryId: c.id, primary: true })),
    isUnsorted: true,
  });
  return { store, aisles };
}

// ——— Édition des magasins et des rayons (docs/03 G3) ———

/** Magasin vide : un seul rayon « Non classé », qui reçoit les catégories système. */
export function buildEmptyStore(
  name: string,
  categories: readonly Category[],
  now: number,
  newId: () => ID = () => crypto.randomUUID(),
): { store: Store; aisles: Aisle[] } {
  const store: Store = {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    name,
    orderLocked: false,
  };
  return {
    store,
    aisles: [
      {
        id: newId(),
        createdAt: now,
        updatedAt: now,
        storeId: store.id,
        name: fr.defaults.unsortedAisle,
        icon: "shopping-basket",
        color: "gris",
        position: 1,
        categories: categories
          .filter((c) => c.isSystem)
          .map((c) => ({ categoryId: c.id, primary: true })),
        isUnsorted: true,
      },
    ],
  };
}

export async function createEmptyStore(
  database: ShoppingDatabase,
  name: string,
  now = Date.now(),
): Promise<Store> {
  return database.transaction(
    "rw",
    [database.stores, database.aisles, database.categories],
    async () => {
      const { store, aisles } = buildEmptyStore(
        name,
        await database.categories.toArray(),
        now,
      );
      await database.stores.add(store);
      await database.aisles.bulkAdd(aisles);
      return store;
    },
  );
}

/** Copie d'un magasin : ses rayons, leurs catégories, ses exceptions et son ordre appris. */
export async function copyStore(
  database: ShoppingDatabase,
  sourceId: ID,
  name: string,
  now = Date.now(),
): Promise<Store | undefined> {
  return database.transaction(
    "rw",
    [database.stores, database.aisles, database.overrides],
    async () => {
      const source = await database.stores.get(sourceId);
      if (!source) return undefined;
      const store: Store = {
        ...source,
        id: crypto.randomUUID(),
        name,
        createdAt: now,
        updatedAt: now,
        lastUsedAt: undefined,
      };
      const aisles = await database.aisles
        .where("storeId")
        .equals(sourceId)
        .toArray();
      const newIds = new Map(aisles.map((a) => [a.id, crypto.randomUUID()]));
      await database.stores.add(store);
      await database.aisles.bulkAdd(
        aisles.map((a) => ({
          ...a,
          id: newIds.get(a.id) ?? crypto.randomUUID(),
          storeId: store.id,
          createdAt: now,
          updatedAt: now,
        })),
      );
      const overrides = await database.overrides
        .filter((o) => o.storeId === sourceId)
        .toArray();
      await database.overrides.bulkAdd(
        overrides.flatMap((o) => {
          const aisleId = newIds.get(o.aisleId);
          return aisleId
            ? [{ ...o, id: crypto.randomUUID(), storeId: store.id, aisleId }]
            : [];
        }),
      );
      return store;
    },
  );
}

export async function updateStore(
  database: ShoppingDatabase,
  id: ID,
  changes: Partial<Pick<Store, "name" | "orderLocked">>,
): Promise<void> {
  await database.stores.update(id, { ...changes, updatedAt: Date.now() });
}

export type DeleteStoreResult = "deleted" | "last" | "shopping";

/**
 * Supprimer un magasin, ses rayons et ses exceptions. Refusé pour le dernier magasin,
 * ou pendant des courses ouvertes dans ce magasin. L'historique des achats reste.
 */
export async function deleteStore(
  database: ShoppingDatabase,
  id: ID,
): Promise<DeleteStoreResult> {
  return database.transaction(
    "rw",
    [
      database.stores,
      database.aisles,
      database.overrides,
      database.lists,
      database.sessions,
    ],
    async () => {
      if ((await database.stores.count()) <= 1) return "last";
      const open = await database.sessions
        .where("storeId")
        .equals(id)
        .filter((s) => s.status === "open")
        .count();
      if (open) return "shopping";
      await database.aisles.where("storeId").equals(id).delete();
      await database.overrides.filter((o) => o.storeId === id).delete();
      await database.lists
        .filter((l) => l.lastStoreId === id)
        .modify((l) => {
          delete l.lastStoreId;
        });
      await database.stores.delete(id);
      return "deleted";
    },
  );
}

/** Nouveau rayon, juste avant « Non classé ». */
export async function addAisle(
  database: ShoppingDatabase,
  storeId: ID,
  input: Pick<Aisle, "icon" | "color">,
  now = Date.now(),
): Promise<Aisle> {
  return database.transaction("rw", database.aisles, async () => {
    const sorted = sortAisles(
      await database.aisles.where("storeId").equals(storeId).toArray(),
    ).filter((a) => !a.isUnsorted);
    const id = crypto.randomUUID();
    const positions = spreadPositions([...sorted.map((a) => a.id), id]);
    for (const a of sorted)
      if (positions[a.id] !== a.position)
        await database.aisles.update(a.id, { position: positions[a.id] });
    const aisle: Aisle = {
      id,
      createdAt: now,
      updatedAt: now,
      storeId,
      name: "",
      ...input,
      position: positions[id] ?? 1,
      categories: [],
      isUnsorted: false,
    };
    await database.aisles.add(aisle);
    return aisle;
  });
}

export async function updateAisle(
  database: ShoppingDatabase,
  id: ID,
  changes: Partial<Pick<Aisle, "name" | "description" | "icon" | "color">>,
): Promise<void> {
  await database.aisles.update(id, { ...changes, updatedAt: Date.now() });
}

/** Ordre manuel des rayons (glisser-déposer) : positions réparties sur [0, 1]. */
export async function reorderAisles(
  database: ShoppingDatabase,
  orderedIds: ID[],
): Promise<void> {
  const positions = spreadPositions(orderedIds);
  await database.transaction("rw", database.aisles, async () => {
    for (const [id, position] of Object.entries(positions))
      await database.aisles.update(id, { position });
  });
}

/** Rôle d'une catégorie dans un rayon (principale, secondaire, absente). */
export async function setAisleCategoryRole(
  database: ShoppingDatabase,
  storeId: ID,
  aisleId: ID,
  categoryId: ID,
  role: CategoryRole,
  now = Date.now(),
): Promise<void> {
  await database.transaction("rw", database.aisles, async () => {
    const aisles = await database.aisles
      .where("storeId")
      .equals(storeId)
      .toArray();
    for (const aisle of setCategoryRole(aisles, aisleId, categoryId, role))
      await database.aisles.update(aisle.id, {
        categories: aisle.categories,
        updatedAt: now,
      });
  });
}

/** Supprimer un rayon (pas « Non classé ») ; ses exceptions par article disparaissent. */
export async function deleteAisle(
  database: ShoppingDatabase,
  aisleId: ID,
  promoteSecondary: boolean,
  now = Date.now(),
): Promise<void> {
  await database.transaction(
    "rw",
    [database.aisles, database.overrides],
    async () => {
      const aisle = await database.aisles.get(aisleId);
      if (!aisle || aisle.isUnsorted) return;
      const aisles = await database.aisles
        .where("storeId")
        .equals(aisle.storeId)
        .toArray();
      for (const changed of removeAisle(aisles, aisleId, promoteSecondary))
        await database.aisles.update(changed.id, {
          categories: changed.categories,
          updatedAt: now,
        });
      await database.overrides.filter((o) => o.aisleId === aisleId).delete();
      await database.aisles.delete(aisleId);
    },
  );
}

/** Fusionner `sourceId` dans `targetId` (même magasin). */
export async function mergeAisleInto(
  database: ShoppingDatabase,
  sourceId: ID,
  targetId: ID,
  now = Date.now(),
): Promise<void> {
  await database.transaction(
    "rw",
    [database.aisles, database.overrides],
    async () => {
      const [source, target] = await database.aisles.bulkGet([
        sourceId,
        targetId,
      ]);
      if (
        !source ||
        !target ||
        source.isUnsorted ||
        source.storeId !== target.storeId
      )
        return;
      const overrides = await database.overrides
        .filter((o) => o.storeId === source.storeId)
        .toArray();
      const merged = mergeAisles(target, source, overrides);
      await database.aisles.update(target.id, {
        categories: merged.aisle.categories,
        updatedAt: now,
      });
      await database.overrides.bulkPut(merged.overrides);
      await database.aisles.delete(source.id);
    },
  );
}

export async function deleteOverride(
  database: ShoppingDatabase,
  id: ID,
): Promise<void> {
  await database.overrides.delete(id);
}
