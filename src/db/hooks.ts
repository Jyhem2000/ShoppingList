import { useLiveQuery } from "dexie-react-hooks";
import type { ID, ShoppingSession } from "@/domain/model";
import { db } from "./database";
import { activeItems } from "./items";
import { latestSession, purchaseStats } from "./sessions";
import { storeAisles } from "./stores";
import { countBy } from "@/domain/collections";
import { byName } from "@/domain/slug";

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

/**
 * Liste courante : celle des réglages, sinon la première. `list` est `undefined`
 * pendant la lecture, ou s'il n'y a aucune liste (`lists` vide).
 */
export function useCurrentList() {
  const settings = useSettings();
  const lists = useLists();
  const list =
    lists?.find((l) => l.id === settings?.currentListId) ?? lists?.[0];
  return { settings, lists, list };
}

export function useListItems(listId: ID | undefined) {
  return useKeyedLiveQuery(listId, (id) => activeItems(db, id), []);
}

/** Recettes, par ordre alphabétique. */
export function useRecipes() {
  return useLiveQuery(async () => (await db.recipes.toArray()).sort(byName));
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
  return useKeyedLiveQuery(storeId, (id) => storeAisles(db, id), []);
}

export function useOverrides() {
  return useLiveQuery(() => db.overrides.toArray());
}

/**
 * Ce que l'historique apprend (sessions clôturées) : nombre d'achats par article, pour la
 * recherche et les habituels, et unité habituelle de chaque article (`usualAmounts`).
 * Lus par l'index `sessionId` : une coche pendant les courses (achat d'une session
 * ouverte) ne fait pas tout relire.
 */
export function usePurchaseStats() {
  return useLiveQuery(() => purchaseStats(db));
}

/**
 * Dernière session de courses de la liste (ouverte ou clôturée), `null` s'il n'y en a
 * pas, `undefined` pendant la lecture et tant que la liste n'est pas connue.
 */
/** Lignes d'un article, toutes listes confondues (archivées comprises). */
export function useArticleItems(articleId: ID | undefined) {
  return useKeyedLiveQuery(
    articleId,
    (id) => db.items.where("articleId").equals(id).toArray(),
    [],
  );
}

/** Nombre de rayons de chaque magasin, sans « À placer ». */
export function useAisleCounts() {
  return useLiveQuery(async () =>
    countBy(
      (await db.aisles.toArray()).filter((aisle) => !aisle.isUnsorted),
      (aisle) => aisle.storeId,
    ),
  );
}

/** Nombre d'articles, de catégories, de magasins et d'unités (Réglages). */
export function useDataCounts() {
  return useLiveQuery(async () => {
    const [articles, categories, stores, units] = await Promise.all([
      db.articles.count(),
      db.categories.count(),
      db.stores.count(),
      db.units.count(),
    ]);
    return { articles, categories, stores, units };
  });
}

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
