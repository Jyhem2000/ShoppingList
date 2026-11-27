import { aisleResolver } from "@/domain/aisles";
import type { Aisle, Article, Category, ID, Store } from "@/domain/model";
import {
  type CategoryRole,
  DEFAULT_AISLE_STYLE,
  mergeAisles,
  newAisle,
  primaryAisleOf,
  removeAisle,
  setCategoryRole,
  sortAisles,
  spreadPositions,
} from "@/domain/stores";
import { texts } from "@/i18n";
import type { ShoppingDatabase } from "./database";

// ——— Édition des magasins et des rayons (docs/03 G3) ———

/** Rayons d'un magasin, dans l'ordre de la base. */
export function storeAisles(
  database: ShoppingDatabase,
  storeId: ID,
): Promise<Aisle[]> {
  return database.aisles.where("storeId").equals(storeId).toArray();
}

/**
 * Exception par article dans un magasin (docs/02 § 4) : l'ancienne est supprimée ; avec
 * `target`, une nouvelle vise ce rayon, sauf s'il est déjà le rayon principal de sa
 * catégorie (`target.aisles` : rayons du magasin).
 */
export async function setArticleOverride(
  database: ShoppingDatabase,
  storeId: ID,
  article: Pick<Article, "id" | "categoryId">,
  target?: { aisleId: ID; aisles: readonly Aisle[] },
): Promise<void> {
  await database.overrides
    .where("[storeId+articleId]")
    .equals([storeId, article.id])
    .delete();
  if (
    target &&
    primaryAisleOf(target.aisles, article.categoryId)?.id !== target.aisleId
  )
    await database.overrides.add({
      id: crypto.randomUUID(),
      storeId,
      articleId: article.id,
      aisleId: target.aisleId,
    });
}

/**
 * Magasin vide (docs/02 § 4) : un seul rayon « À placer », qui reçoit les catégories système ; les autres rayons se créent pendant
 * les courses.
 */
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
        name: texts.defaults.unsortedAisle,
        ...DEFAULT_AISLE_STYLE,
        position: 1,
        categories: categories
          .filter((c) => c.isSystem)
          .map((c) => ({ categoryId: c.id, primary: true })),
        isUnsorted: true,
      },
    ],
  };
}

/**
 * Recrée le rayon « À placer » d'un magasin s'il manque (sauvegarde abîmée) : sans
 * lui, les articles sans rayon ne s'afficheraient pas en courses. Il reçoit les
 * catégories système qui n'ont pas déjà un rayon principal.
 */
export async function ensureUnsortedAisle(
  database: ShoppingDatabase,
  storeId: ID,
  now = Date.now(),
): Promise<void> {
  const aisles = await storeAisles(database, storeId);
  if (aisles.some((aisle) => aisle.isUnsorted)) return;
  const taken = new Set(
    aisles.flatMap((aisle) =>
      aisle.categories.filter((c) => c.primary).map((c) => c.categoryId),
    ),
  );
  const categories = (await database.categories.toArray()).filter(
    (category) => !taken.has(category.id),
  );
  const [unsorted] = buildEmptyStore("", categories, now).aisles;
  if (unsorted) await database.aisles.add({ ...unsorted, storeId });
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
      const aisles = await storeAisles(database, sourceId);
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
        .where("storeId")
        .equals(sourceId)
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

export type DeleteStoreResult = "deleted" | "shopping";

/**
 * Supprimer un magasin, ses rayons et ses exceptions, même le dernier : le prochain
 * « C'est parti » en fera créer un. Refusé pendant des courses ouvertes dans ce
 * magasin. L'historique des achats reste.
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
      const open = await database.sessions
        .where("storeId")
        .equals(id)
        .filter((s) => s.status === "open")
        .count();
      if (open) return "shopping";
      await database.aisles.where("storeId").equals(id).delete();
      await database.overrides.where("storeId").equals(id).delete();
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

/** Nouveau rayon, juste avant « À placer ». */
export async function addAisle(
  database: ShoppingDatabase,
  storeId: ID,
  now = Date.now(),
): Promise<Aisle> {
  return database.transaction("rw", database.aisles, async () => {
    const sorted = sortAisles(await storeAisles(database, storeId)).filter(
      (a) => !a.isUnsorted,
    );
    const aisle = newAisle(crypto.randomUUID(), storeId, now);
    const positions = spreadPositions([...sorted.map((a) => a.id), aisle.id]);
    for (const a of sorted)
      if (positions[a.id] !== a.position)
        await database.aisles.update(a.id, { position: positions[a.id] });
    aisle.position = positions[aisle.id] ?? 1;
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
    const aisles = await storeAisles(database, storeId);
    for (const aisle of setCategoryRole(aisles, aisleId, categoryId, role))
      await database.aisles.update(aisle.id, {
        categories: aisle.categories,
        updatedAt: now,
      });
  });
}

/**
 * Courses en cours dans le magasin de ce rayon, qui va disparaître : il cesse d'être
 * leur rayon en cours. Renvoie les identifiants de ces sessions.
 */
async function forgetOpenedAisle(
  database: ShoppingDatabase,
  aisle: Pick<Aisle, "id" | "storeId">,
): Promise<ID[]> {
  const open = await database.sessions
    .where("storeId")
    .equals(aisle.storeId)
    .filter((session) => session.status === "open")
    .toArray();
  for (const session of open)
    if (session.openedAisle?.aisleId === aisle.id)
      await database.sessions.update(session.id, { openedAisle: undefined });
  return open.map((session) => session.id);
}

/**
 * Supprimer un rayon (pas « À placer ») ; ses exceptions par article disparaissent.
 * Les achats des courses en cours qui y étaient passent au nouveau rayon de leur
 * article.
 */
export async function deleteAisle(
  database: ShoppingDatabase,
  aisleId: ID,
  promoteSecondary: boolean,
  now = Date.now(),
): Promise<void> {
  await database.transaction(
    "rw",
    [
      database.aisles,
      database.overrides,
      database.sessions,
      database.purchases,
      database.articles,
    ],
    async () => {
      const aisle = await database.aisles.get(aisleId);
      if (!aisle || aisle.isUnsorted) return;
      const sessionIds = await forgetOpenedAisle(database, aisle);
      const aisles = await storeAisles(database, aisle.storeId);
      await database.aisles.bulkUpdate(
        removeAisle(aisles, aisleId, promoteSecondary).map((changed) => ({
          key: changed.id,
          changes: { categories: changed.categories, updatedAt: now },
        })),
      );
      await database.overrides
        .where("storeId")
        .equals(aisle.storeId)
        .filter((o) => o.aisleId === aisleId)
        .delete();
      await database.aisles.delete(aisleId);
      const rest = await storeAisles(database, aisle.storeId);
      const overrides = await database.overrides
        .where("storeId")
        .equals(aisle.storeId)
        .toArray();
      const aisleOf = aisleResolver(aisle.storeId, rest, overrides);
      const purchases = await database.purchases
        .where("sessionId")
        .anyOf(sessionIds)
        .filter((p) => p.aisleId === aisleId)
        .toArray();
      const articles = await database.articles.bulkGet(
        purchases.map((p) => p.articleId),
      );
      const unsorted = rest.find((a) => a.isUnsorted);
      await database.purchases.bulkUpdate(
        purchases.flatMap((purchase, index) => {
          const article = articles[index];
          const target = (article && aisleOf(article)) ?? unsorted;
          return target
            ? [{ key: purchase.id, changes: { aisleId: target.id } }]
            : [];
        }),
      );
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
    [
      database.aisles,
      database.overrides,
      database.sessions,
      database.purchases,
    ],
    async () => {
      const [source, target] = await database.aisles.bulkGet([
        sourceId,
        targetId,
      ]);
      if (
        !source ||
        !target ||
        source.isUnsorted ||
        target.isUnsorted ||
        source.storeId !== target.storeId
      )
        return;
      const overrides = await database.overrides
        .where("storeId")
        .equals(source.storeId)
        .toArray();
      const merged = mergeAisles(target, source, overrides);
      await database.aisles.update(target.id, {
        categories: merged.aisle.categories,
        updatedAt: now,
      });
      await database.overrides.bulkPut(merged.overrides);
      // Courses en cours dans ce magasin : leurs achats suivent le rayon gardé.
      for (const id of await forgetOpenedAisle(database, source))
        await database.purchases
          .where("sessionId")
          .equals(id)
          .filter((purchase) => purchase.aisleId === source.id)
          .modify({ aisleId: target.id });
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
