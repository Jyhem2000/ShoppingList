import { planListMerge, type MergeLine } from "@/domain/listMerge";
import type { ID, ListItem, ShoppingList } from "@/domain/model";
import type { ShoppingDatabase } from "./database";
import { getSettings, updateSettings } from "./settings";

/**
 * Listes et lignes (docs/02 § 6, docs/03 B2 à B6). Une seule ligne par article
 * dans une liste : voir `addListItem` (items.ts).
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
  await database.items.update(id, { ...changes, updatedAt: Date.now() });
}

/** Supprime des lignes et les renvoie, pour pouvoir les rétablir (« Annuler »). */
export async function deleteItems(
  database: ShoppingDatabase,
  ids: ID[],
): Promise<ListItem[]> {
  return database.transaction("rw", database.items, async () => {
    const items = (await database.items.bulkGet(ids)).filter(
      (item) => item !== undefined,
    );
    await database.items.bulkDelete(ids);
    return items;
  });
}

export async function restoreItems(
  database: ShoppingDatabase,
  items: ListItem[],
): Promise<void> {
  await database.items.bulkPut(items);
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

/** Applique les lignes choisies dans l'aperçu. */
export async function applyListMerge(
  database: ShoppingDatabase,
  targetId: ID,
  lines: MergeLine[],
  now = Date.now(),
): Promise<void> {
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
        await database.items.update(line.existingId, changes);
      } else {
        await database.items.add({
          ...changes,
          id: newId(),
          createdAt: now,
          listId: targetId,
          articleId: line.articleId,
          status: "todo",
          fromRecipes: [],
        });
      }
    }
  });
}
