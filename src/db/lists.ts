import { isPurchaseOf } from "@/domain/lines";
import { planListMerge, type MergeLine } from "@/domain/listMerge";
import type {
  ID,
  ListItem,
  Purchase,
  ShoppingList,
  Unit,
} from "@/domain/model";
import type { ShoppingDatabase } from "./database";
import { findActiveItem } from "./items";
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
        item &&
        (changes.quantity !== undefined || changes.unitId !== undefined)
      )
        for (const purchase of await linePurchases(database, item))
          await database.purchases.update(purchase.id, {
            quantity: item.quantity,
            unitId: item.unitId,
          });
    },
  );
}

/**
 * Fusionne `line` dans `twin`, l'autre ligne active du même article avec les mêmes
 * types (docs/02 § 6), comme l'ajout d'une liste dans une autre (`planListMerge`) :
 * quantités additionnées, ou ajoutées en note si les unités ne se convertissent pas ;
 * notes et recettes d'origine réunies. `line` disparaît ; la ligne réunie garde l'état
 * de `twin` et, cochée, un seul achat avec la quantité réunie.
 * À appeler dans une transaction sur `items`, `purchases` et `sessions`.
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
  const merged = plan
    ? { quantity: plan.quantity, unitId: plan.unitId, note: plan.note }
    : { quantity: twin.quantity, unitId: twin.unitId, note: twin.note };
  // Lus avant les changements : un achat d'avant la 1.0.1 se reconnaît à l'article.
  const purchases = new Map(
    [
      ...(await linePurchases(database, twin)),
      ...(await linePurchases(database, line)),
    ].map((purchase) => [purchase.id, purchase]),
  );
  const known = new Set(twin.fromRecipes.map((r) => r.recipeId));
  await database.items.update(twin.id, {
    ...merged,
    fromRecipes: [
      ...twin.fromRecipes,
      ...line.fromRecipes.filter((r) => !known.has(r.recipeId)),
    ],
    updatedAt: now,
  });
  await database.items.delete(line.id);
  const [kept, ...others] = [...purchases.values()];
  if (kept && twin.status === "checked") {
    await database.purchases.update(kept.id, {
      itemId: twin.id,
      articleId: twin.articleId,
      quantity: merged.quantity,
      unitId: merged.unitId,
    });
    await database.purchases.bulkDelete(others.map((p) => p.id));
  } else await database.purchases.bulkDelete([...purchases.keys()]);
}

/** Achats d'une ligne cochée dans les courses en cours de sa liste (`isPurchaseOf`). */
async function linePurchases(
  database: ShoppingDatabase,
  item: Pick<ListItem, "id" | "listId" | "articleId" | "status">,
): Promise<Purchase[]> {
  if (item.status !== "checked") return [];
  const open = await openSession(database, item.listId);
  return open
    ? database.purchases
        .where("sessionId")
        .equals(open.id)
        .filter(isPurchaseOf(item))
        .toArray()
    : [];
}

/** Autre ligne active de la liste avec le même article et les mêmes types. */
const findTwin = (
  database: ShoppingDatabase,
  line: Pick<ListItem, "id" | "listId" | "articleId" | "acceptedTypes">,
) =>
  findActiveItem(
    database,
    line.listId,
    line.articleId,
    line.acceptedTypes,
    line.id,
  );

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
      const purchases = new Map<ID, Purchase>();
      for (const item of items)
        for (const purchase of await linePurchases(database, item))
          purchases.set(purchase.id, purchase);
      await database.items.bulkDelete(ids);
      await database.purchases.bulkDelete([...purchases.keys()]);
      return { items, purchases: [...purchases.values()] };
    },
  );
}

/**
 * « Annuler » une suppression : les lignes reviennent avec leurs achats. Une ligne
 * remise entre-temps (même article, mêmes types) n'est pas doublée : la ligne
 * rétablie la rejoint (`mergeLineInto`). Courses terminées entre-temps : leurs achats
 * ne reviennent pas, et une ligne cochée revient « à acheter ».
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
      const sessions = await database.sessions.bulkGet([
        ...new Set(removed.purchases.map((purchase) => purchase.sessionId)),
      ]);
      const open = new Set(
        sessions.filter((s) => s?.status === "open").map((s) => s?.id),
      );
      await database.purchases.bulkPut(
        removed.purchases.filter((purchase) => open.has(purchase.sessionId)),
      );
      const units = await database.units.toArray();
      for (const removedItem of removed.items) {
        const item: ListItem =
          removedItem.status === "checked" &&
          !removedItem.closedInSessionId &&
          !(await openSession(database, removedItem.listId))
            ? { ...removedItem, status: "todo", checkedAt: undefined }
            : removedItem;
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
