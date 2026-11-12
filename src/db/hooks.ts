import { useLiveQuery } from "dexie-react-hooks";
import type { ID } from "@/domain/model";
import { db } from "./database";
import { latestSession } from "./sessions";

/**
 * Lectures de la base pour les écrans : chaque hook se met à jour tout seul quand
 * les données changent. `undefined` tant que la lecture n'est pas terminée.
 */
export function useSettings() {
  return useLiveQuery(async () => (await db.meta.get("settings"))?.value);
}

export function useLists() {
  return useLiveQuery(() => db.lists.orderBy("position").toArray());
}

export function useListItems(listId: ID | undefined) {
  return useLiveQuery(
    () =>
      listId
        ? db.items
            .where("listId")
            .equals(listId)
            .filter((item) => !item.closedInSessionId)
            .toArray()
        : [],
    [listId],
  );
}

export function useArticles() {
  return useLiveQuery(() => db.articles.toArray());
}

export function useUnits() {
  return useLiveQuery(() => db.units.toArray());
}

export function useCategories() {
  return useLiveQuery(() => db.categories.toArray());
}

export function useStores() {
  return useLiveQuery(() => db.stores.toArray());
}

export function useAisles(storeId: ID | undefined) {
  return useLiveQuery(
    () => (storeId ? db.aisles.where("storeId").equals(storeId).toArray() : []),
    [storeId],
  );
}

export function useOverrides() {
  return useLiveQuery(() => db.overrides.toArray());
}

/** Nombre d'achats par article (sessions clôturées), pour la recherche et les habituels. */
export function usePurchaseCounts() {
  return useLiveQuery(async () => {
    const closed = new Set(
      await db.sessions.where("status").equals("closed").primaryKeys(),
    );
    const counts = new Map<ID, number>();
    await db.purchases.each((purchase) => {
      if (!closed.has(purchase.sessionId)) return;
      counts.set(purchase.articleId, (counts.get(purchase.articleId) ?? 0) + 1);
    });
    return counts;
  });
}

/**
 * Dernière session de courses de la liste (ouverte ou clôturée), `null` s'il n'y en a
 * pas, `undefined` pendant la lecture (et tant que la liste n'est pas connue : au
 * changement de liste, le hook rend d'abord le résultat précédent).
 */
export function useLatestSession(listId: ID | undefined) {
  return useLiveQuery(
    async () =>
      listId ? ((await latestSession(db, listId)) ?? null) : undefined,
    [listId],
  );
}

export function useSession(sessionId: ID | undefined) {
  return useLiveQuery(
    async () =>
      sessionId ? ((await db.sessions.get(sessionId)) ?? null) : null,
    [sessionId],
  );
}

/** Achats d'une session, dans l'ordre des coches. */
export function useSessionPurchases(sessionId: ID | undefined) {
  return useLiveQuery(
    () =>
      sessionId
        ? db.purchases.where("sessionId").equals(sessionId).sortBy("at")
        : [],
    [sessionId],
  );
}
