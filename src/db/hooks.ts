import { useLiveQuery } from "dexie-react-hooks";
import type { ID, ShoppingSession } from "@/domain/model";
import { db } from "./database";
import { latestSession } from "./sessions";

/**
 * Lectures de la base pour les écrans : chaque hook se met à jour tout seul quand
 * les données changent. `undefined` tant que la lecture n'est pas terminée.
 */
/**
 * Lecture qui dépend d'un identifiant (liste, magasin, session…). Quand l'identifiant
 * change, `useLiveQuery` rend encore le résultat de l'ancien jusqu'à la fin de la
 * nouvelle lecture : on aurait par exemple une liste connue avec les lignes d'une autre
 * (ou aucune ligne), et un ajout du catalogue créerait un doublon. Le résultat est donc
 * rangé avec son identifiant, et `undefined` (« en cours de lecture ») s'il n'est pas
 * celui demandé.
 */
function useKeyedLiveQuery<T>(
  key: ID | undefined,
  querier: (key: ID) => Promise<T> | T,
  whenNoKey: T,
): T | undefined {
  const result = useLiveQuery(
    async () => ({ key, value: key ? await querier(key) : whenNoKey }),
    [key],
  );
  return result && result.key === key ? result.value : undefined;
}

export function useSettings() {
  return useLiveQuery(async () => (await db.meta.get("settings"))?.value);
}

export function useLists() {
  return useLiveQuery(() => db.lists.orderBy("position").toArray());
}

export function useListItems(listId: ID | undefined) {
  return useKeyedLiveQuery(
    listId,
    (id) =>
      db.items
        .where("listId")
        .equals(id)
        .filter((item) => !item.closedInSessionId)
        .toArray(),
    [],
  );
}

/** Recettes, par ordre alphabétique. */
export function useRecipes() {
  return useLiveQuery(async () =>
    (await db.recipes.toArray()).sort((a, b) =>
      a.name.localeCompare(b.name, "fr"),
    ),
  );
}

export function useRecipe(recipeId: ID | undefined) {
  return useKeyedLiveQuery(
    recipeId,
    async (id) => (await db.recipes.get(id)) ?? null,
    null,
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
  return useKeyedLiveQuery(
    storeId,
    (id) => db.aisles.where("storeId").equals(id).toArray(),
    [],
  );
}

export function useOverrides() {
  return useLiveQuery(() => db.overrides.toArray());
}

/**
 * Nombre d'achats par article (sessions clôturées), pour la recherche et les habituels.
 * Lus par l'index `sessionId` : une coche pendant les courses (achat d'une session
 * ouverte) ne fait pas tout relire.
 */
export function usePurchaseCounts() {
  return useLiveQuery(async () => {
    const closed = await db.sessions
      .where("status")
      .equals("closed")
      .primaryKeys();
    const counts = new Map<ID, number>();
    await db.purchases
      .where("sessionId")
      .anyOf(closed)
      .each((purchase) => {
        counts.set(
          purchase.articleId,
          (counts.get(purchase.articleId) ?? 0) + 1,
        );
      });
    return counts;
  });
}

/**
 * Dernière session de courses de la liste (ouverte ou clôturée), `null` s'il n'y en a
 * pas, `undefined` pendant la lecture et tant que la liste n'est pas connue.
 */
export function useLatestSession(listId: ID | undefined) {
  return useKeyedLiveQuery<ShoppingSession | null | undefined>(
    listId,
    async (id) => (await latestSession(db, id)) ?? null,
    undefined,
  );
}

export function useSession(sessionId: ID | undefined) {
  return useKeyedLiveQuery(
    sessionId,
    async (id) => (await db.sessions.get(id)) ?? null,
    null,
  );
}

/** Achats d'une session, dans l'ordre des coches. */
export function useSessionPurchases(sessionId: ID | undefined) {
  return useKeyedLiveQuery(
    sessionId,
    (id) => db.purchases.where("sessionId").equals(id).sortBy("at"),
    [],
  );
}
