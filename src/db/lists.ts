import { sameTypes } from "@/domain/lines";
import { planListMerge, type MergeLine } from "@/domain/listMerge";
import type {
  ID,
  ListItem,
  Purchase,
  ShoppingList,
  Unit,
} from "@/domain/model";
import type { ShoppingDatabase } from "./database";
import { openSession } from "./sessions";
import { getSettings, updateSettings } from "./settings";

/**
 * Listes et lignes (docs/02 § 6, docs/03 B2 à B6). Une seule ligne par article et
 * par choix de types dans une liste : voir `addListItem` (items.ts).
 */
const newId = () => crypto.randomUUID();

/** Lignes actives (non archivées) d'une liste. */
export async function activeItems(
  database: ShoppingDatabase,
  listId: ID,
): Promise<ListItem[]> {
  return database.items
    .where("listId")
    .equals(listId)
    .filter((item) => !item.closedInSessionId)
    .toArray();
}

export async function createList(
  database: ShoppingDatabase,
  name: string,
  storeId?: ID,
  now = Date.now(),
): Promise<ShoppingList> {
  return database.transaction("rw", database.lists, database.meta, async () => {
    const last = await database.lists.orderBy("position").last();
    const list: ShoppingList = {
      id: newId(),
      createdAt: now,
      updatedAt: now,
      name,
      position: (last?.position ?? -1) + 1,
      lastStoreId: storeId,
    };
    await database.lists.add(list);
    await updateSettings(database, { currentListId: list.id });
    return list;
  });
}

export async function updateList(
  database: ShoppingDatabase,
  id: ID,
  changes: Partial<Pick<ShoppingList, "name" | "lastStoreId">>,
): Promise<void> {
  await database.lists.update(id, { ...changes, updatedAt: Date.now() });
}

/** Copie d'une liste avec ses lignes à acheter (statut remis à « à acheter »). */
export async function duplicateList(
  database: ShoppingDatabase,
  id: ID,
  name: string,
): Promise<ShoppingList | undefined> {
  return database.transaction(
    "rw",
    database.lists,
    database.items,
    database.meta,
    async () => {
      const source = await database.lists.get(id);
      if (!source) return undefined;
      const copy = await createList(database, name, source.lastStoreId);
      const now = Date.now();
      const items = await activeItems(database, id);
      await database.items.bulkAdd(
        items.map((item) => ({
          ...item,
          id: newId(),
          listId: copy.id,
          status: "todo" as const,
          checkedAt: undefined,
          createdAt: now,
          updatedAt: now,
        })),
      );
      return copy;
    },
  );
}

/**
 * Supprime une liste et ses lignes ; la liste courante passe à la première restante.
 * Des courses restées ouvertes pour cette liste sont terminées (sans apprentissage) :
 * sinon leur magasin ne pourrait plus jamais être supprimé. Les achats restent dans
 * l'historique.
 */
export async function deleteList(
  database: ShoppingDatabase,
  id: ID,
  now = Date.now(),
): Promise<void> {
  await database.transaction(
    "rw",
    [database.lists, database.items, database.meta, database.sessions],
    async () => {
      await database.sessions
        .where("listId")
        .equals(id)
        .filter((session) => session.status === "open")
        .modify({ status: "closed", closedAt: now });
      await database.items.where("listId").equals(id).delete();
      await database.lists.delete(id);
      const settings = await getSettings(database);
      if (settings?.currentListId === id) {
        const first = await database.lists.orderBy("position").first();
        await updateSettings(database, { currentListId: first?.id });
      }
    },
  );
}

/** Nouvel ordre des listes (identifiants dans l'ordre voulu). */
export async function reorderLists(
  database: ShoppingDatabase,
  ids: ID[],
): Promise<void> {
  await database.transaction("rw", database.lists, async () => {
    await Promise.all(
      ids.map((id, position) => database.lists.update(id, { position })),
    );
  });
}

export async function updateItem(
  database: ShoppingDatabase,
  id: ID,
  changes: Partial<
    Pick<ListItem, "quantity" | "unitId" | "acceptedTypes" | "note" | "status">
  >,
): Promise<void> {
  await database.transaction(
    "rw",
    [database.items, database.purchases, database.sessions],
    async () => {
      await database.items.update(id, { ...changes, updatedAt: Date.now() });
      // Ligne déjà cochée : son achat suit la quantité (bilan, historique).
      const item = await database.items.get(id);
      if (
        item?.status === "checked" &&
        (changes.quantity !== undefined || changes.unitId !== undefined)
      )
        await (
          await linePurchases(database, item)
        )?.modify({ quantity: item.quantity, unitId: item.unitId });
    },
  );
}

/**
 * Fusionne `line` dans `twin`, l'autre ligne active du même article avec les mêmes
 * types (docs/02 § 6), comme l'ajout d'une liste dans une autre (`planListMerge`) :
 * quantités additionnées, ou ajoutées en note si les unités ne se convertissent pas ;
 * notes et recettes d'origine réunies. `line` disparaît, ses achats suivent `twin`.
 * À appeler dans une transaction sur `items` et `purchases`.
 */
export async function mergeLineInto(
  database: ShoppingDatabase,
  twin: ListItem,
  line: ListItem,
  units: readonly Unit[],
  now: number,
): Promise<void> {
  const [plan] = planListMerge(
    [twin],
    [{ ...line, articleId: twin.articleId, acceptedTypes: twin.acceptedTypes }],
    units,
  );
  const known = new Set(twin.fromRecipes.map((r) => r.recipeId));
  await database.items.update(twin.id, {
    ...(plan
      ? { quantity: plan.quantity, unitId: plan.unitId, note: plan.note }
      : {}),
    fromRecipes: [
      ...twin.fromRecipes,
      ...line.fromRecipes.filter((r) => !known.has(r.recipeId)),
    ],
    updatedAt: now,
  });
  await database.items.delete(line.id);
  // Achat de l'une ou l'autre : la ligne réunie garde l'état de `twin`.
  const own = await linePurchases(database, line);
  if (twin.status === "checked") {
    await own?.modify({ itemId: twin.id });
    await (
      await linePurchases(database, twin)
    )?.modify({ quantity: plan?.quantity, unitId: plan?.unitId });
  } else await own?.delete();
}

/** Achats d'une ligne dans les courses en cours de sa liste (aucune : `undefined`). */
async function linePurchases(
  database: ShoppingDatabase,
  item: Pick<ListItem, "id" | "listId">,
) {
  const open = await openSession(database, item.listId);
  return open
    ? database.purchases
        .where("sessionId")
        .equals(open.id)
        .filter((purchase) => purchase.itemId === item.id)
    : undefined;
}

/** Autre ligne active de la liste avec le même article et les mêmes types. */
async function findTwin(
  database: ShoppingDatabase,
  line: Pick<ListItem, "id" | "listId" | "articleId" | "acceptedTypes">,
): Promise<ListItem | undefined> {
  return database.items
    .where("articleId")
    .equals(line.articleId)
    .filter(
      (other) =>
        other.id !== line.id &&
        other.listId === line.listId &&
        !other.closedInSessionId &&
        sameTypes(other.acceptedTypes, line.acceptedTypes),
    )
    .first();
}

/**
 * Une ligne dont on vient de changer les types rejoint, s'il y en a une, l'autre ligne
 * active du même article avec les mêmes types (`mergeLineInto`). Renvoie
 * l'identifiant de la ligne gardée, ou `undefined` si rien n'a changé.
 */
export async function mergeIntoTwin(
  database: ShoppingDatabase,
  id: ID,
  now = Date.now(),
): Promise<ID | undefined> {
  return database.transaction(
    "rw",
    [database.items, database.units, database.purchases, database.sessions],
    async () => {
      const item = await database.items.get(id);
      if (!item || item.closedInSessionId) return undefined;
      const twin = await findTwin(database, item);
      if (!twin) return undefined;
      await mergeLineInto(
        database,
        twin,
        item,
        await database.units.toArray(),
        now,
      );
      return twin.id;
    },
  );
}

/** Lignes supprimées et leurs achats des courses en cours, pour « Annuler ». */
export interface RemovedItems {
  items: ListItem[];
  purchases: Purchase[];
}

/**
 * Supprime des lignes et les renvoie, pour pouvoir les rétablir (« Annuler »). Une
 * ligne cochée pendant des courses en cours perd aussi son achat : le bilan et
 * l'historique ne la comptent plus.
 */
export async function deleteItems(
  database: ShoppingDatabase,
  ids: ID[],
): Promise<RemovedItems> {
  return database.transaction(
    "rw",
    [database.items, database.purchases, database.sessions],
    async () => {
      const items = (await database.items.bulkGet(ids)).filter(
        (item) => item !== undefined,
      );
      await database.items.bulkDelete(ids);
      const purchases: Purchase[] = [];
      const listIds = new Set(items.map((item) => item.listId));
      const removed = new Set(ids);
      for (const listId of listIds) {
        const open = await openSession(database, listId);
        if (!open) continue;
        const own = database.purchases
          .where("sessionId")
          .equals(open.id)
          .filter(
            (purchase) =>
              purchase.itemId !== undefined && removed.has(purchase.itemId),
          );
        purchases.push(...(await own.toArray()));
        await own.delete();
      }
      return { items, purchases };
    },
  );
}

/**
 * « Annuler » une suppression : les lignes reviennent avec leurs achats. Une ligne
 * remise entre-temps (même article, mêmes types) n'est pas doublée : la ligne
 * rétablie la rejoint (`mergeLineInto`).
 */
export async function restoreItems(
  database: ShoppingDatabase,
  removed: RemovedItems,
  now = Date.now(),
): Promise<void> {
  await database.transaction(
    "rw",
    [database.items, database.units, database.purchases, database.sessions],
    async () => {
      await database.purchases.bulkPut(removed.purchases);
      const units = await database.units.toArray();
      for (const item of removed.items) {
        const twin = item.closedInSessionId
          ? undefined
          : await findTwin(database, item);
        if (twin) await mergeLineInto(database, twin, item, units, now);
        else await database.items.put(item);
      }
    },
  );
}

/** Lignes que l'ajout d'autres listes créerait ou modifierait (aperçu). */
export async function previewListMerge(
  database: ShoppingDatabase,
  targetId: ID,
  sourceIds: ID[],
): Promise<MergeLine[]> {
  const target = await activeItems(database, targetId);
  const sources = (
    await Promise.all(sourceIds.map((id) => activeItems(database, id)))
  )
    .flat()
    .filter((item) => item.status !== "checked");
  const units = await database.units.toArray();
  return planListMerge(target, sources, units);
}

/**
 * Applique les lignes choisies dans l'aperçu. `recipe` : ajout d'une recette, noté
 * comme origine de chaque ligne touchée (« via Raclette »).
 */
export async function applyListMerge(
  database: ShoppingDatabase,
  targetId: ID,
  lines: readonly MergeLine[],
  now = Date.now(),
  recipe?: ListItem["fromRecipes"][number],
): Promise<void> {
  const withRecipe = (from: ListItem["fromRecipes"]) =>
    recipe
      ? [...from.filter((r) => r.recipeId !== recipe.recipeId), recipe]
      : from;
  await database.transaction("rw", database.items, async () => {
    for (const line of lines) {
      const changes = {
        quantity: line.quantity,
        unitId: line.unitId,
        acceptedTypes: line.acceptedTypes,
        note: line.note,
        updatedAt: now,
      };
      if (line.existingId) {
        const existing = await database.items.get(line.existingId);
        await database.items.update(line.existingId, {
          ...changes,
          fromRecipes: withRecipe(existing?.fromRecipes ?? []),
        });
      } else {
        await database.items.add({
          ...changes,
          id: newId(),
          createdAt: now,
          listId: targetId,
          articleId: line.articleId,
          status: "todo",
          fromRecipes: withRecipe([]),
        });
      }
    }
  });
}
