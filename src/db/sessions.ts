import { Dexie } from "dexie";
import type {
  Aisle,
  Article,
  ID,
  ListItem,
  Purchase,
  ShoppingSession,
} from "@/domain/model";
import { isPurchaseOf, lineKey } from "@/domain/lines";
import {
  canReopen,
  learnAislePositions,
  learnArticleOrder,
} from "@/domain/shopping";
import {
  insertAisleAfter,
  isFreshEmptyAisle,
  newAisle,
  placementScope,
  withPrimaryCategory,
} from "@/domain/stores";
import type { PurchaseHistory } from "@/domain/history";
import type { ShoppingDatabase } from "./database";
import { activeItems } from "./items";
import { updateSettings } from "./settings";
import {
  ensureUnsortedAisle,
  setAisleCategoryRole,
  setArticleOverride,
  storeAisles,
} from "./stores";

/**
 * Courses : session, coches, clôture, apprentissage et réouverture (docs/02 § 8,
 * docs/07 § 7.6). Les calculs sont dans `src/domain/shopping.ts`.
 */

/** Session ouverte de la liste, s'il y en a une. */
export async function openSession(
  database: ShoppingDatabase,
  listId: ID,
): Promise<ShoppingSession | undefined> {
  return database.sessions
    .where("listId")
    .equals(listId)
    .filter((session) => session.status === "open")
    .first();
}

/**
 * Achats des courses terminées et fin des dernières courses terminées : ce que
 * l'historique apprend (`purchaseStats`) se calcule à partir de là.
 */
export async function closedPurchases(
  database: ShoppingDatabase,
): Promise<PurchaseHistory> {
  // Clés seulement : une session porte l'ordre appris du magasin, inutile ici.
  const closed = await database.sessions
    .where("status")
    .equals("closed")
    .primaryKeys();
  const [purchases, last] = await Promise.all([
    database.purchases.where("sessionId").anyOf(closed).toArray(),
    // `closedAt` n'existe que sur des courses terminées (effacé à la réouverture).
    database.sessions.orderBy("closedAt").last(),
  ]);
  return { purchases, lastClosedAt: last?.closedAt };
}

/** Dernière session de la liste (la plus récente). */
export async function latestSession(
  database: ShoppingDatabase,
  listId: ID,
): Promise<ShoppingSession | undefined> {
  // Index par liste et date : seule la dernière est lue.
  return database.sessions
    .where("[listId+startedAt]")
    .between([listId, Dexie.minKey], [listId, Dexie.maxKey])
    .last();
}

/**
 * Démarre les courses (C1), ou reprend la session déjà ouverte. Une nouvelle session
 * supprime les lignes archivées des courses précédentes (les achats restent dans
 * l'historique), remet les introuvables à prendre et vide l'état gardé pour rouvrir les
 * courses précédentes (`learningSnapshot`).
 */
export async function startSession(
  database: ShoppingDatabase,
  listId: ID,
  storeId: ID,
  now = Date.now(),
): Promise<ShoppingSession> {
  return database.transaction(
    "rw",
    [
      database.sessions,
      database.items,
      database.lists,
      database.stores,
      database.aisles,
      database.categories,
    ],
    async () => {
      await ensureUnsortedAisle(database, storeId, now);
      const open = await openSession(database, listId);
      if (open) return open;
      const items = await database.items
        .where("listId")
        .equals(listId)
        .toArray();
      await database.items.bulkDelete(
        items.filter((item) => item.closedInSessionId).map((item) => item.id),
      );
      await database.items.bulkUpdate(
        items
          .filter((item) => !item.closedInSessionId && item.status !== "todo")
          .map((item) => ({
            key: item.id,
            changes: { status: "todo", checkedAt: undefined, updatedAt: now },
          })),
      );
      // Les courses précédentes ne peuvent plus être rouvertes (`canReopen`) : l'état
      // d'avant leur apprentissage ne sert plus.
      await database.sessions
        .where("listId")
        .equals(listId)
        .filter((previous) => previous.learningSnapshot !== undefined)
        .modify((previous) => {
          delete previous.learningSnapshot;
        });
      const session: ShoppingSession = {
        id: crypto.randomUUID(),
        listId,
        storeId,
        startedAt: now,
        status: "open",
      };
      await database.sessions.add(session);
      await database.lists.update(listId, {
        lastStoreId: storeId,
        updatedAt: now,
      });
      await database.stores.update(storeId, { lastUsedAt: now });
      return session;
    },
  );
}

/** Cocher (C2) : la ligne est dans le caddie, l'achat est noté avec son rayon. */
export async function checkItem(
  database: ShoppingDatabase,
  session: Pick<ShoppingSession, "id" | "storeId">,
  item: Pick<ListItem, "id" | "articleId" | "quantity" | "unitId">,
  aisleId: ID,
  now = Date.now(),
): Promise<void> {
  await database.transaction(
    "rw",
    database.items,
    database.purchases,
    async () => {
      await removePurchases(database, session.id, item);
      await database.items.update(item.id, {
        status: "checked",
        checkedAt: now,
        updatedAt: now,
      });
      const purchase: Purchase = {
        id: crypto.randomUUID(),
        sessionId: session.id,
        storeId: session.storeId,
        articleId: item.articleId,
        itemId: item.id,
        aisleId,
        quantity: item.quantity,
        unitId: item.unitId,
        at: now,
      };
      await database.purchases.add(purchase);
    },
  );
}

/** Rayons du magasin visés par au moins une exception par article (lus en une fois). */
async function aislesWithOverrides(
  database: ShoppingDatabase,
  storeId: ID,
): Promise<Set<ID>> {
  const overrides = await database.overrides
    .where("storeId")
    .equals(storeId)
    .toArray();
  return new Set(overrides.map((o) => o.aisleId));
}

/** Nouveau rayon sans nom, juste après `afterId` (en tête si absent). */
async function openAisleAfter(
  database: ShoppingDatabase,
  storeId: ID,
  afterId: ID | undefined,
  now: number,
): Promise<Aisle> {
  const aisles = await storeAisles(database, storeId);
  const aisle = newAisle(crypto.randomUUID(), storeId, now);
  const positions = insertAisleAfter([...aisles, aisle], afterId, aisle.id);
  aisle.position = positions[aisle.id] ?? 0;
  await database.aisles.add(aisle);
  await database.aisles.bulkUpdate(
    aisles.flatMap((other) => {
      const position = positions[other.id];
      return position !== undefined && position !== other.position
        ? [{ key: other.id, changes: { position } }]
        : [];
    }),
  );
  return aisle;
}

/**
 * « Rayon suivant » (docs/03 C4) : ouvre un rayon juste après le rayon en cours, qui
 * devient le rayon en cours. Si le rayon en cours vient d'être ouvert et est encore
 * vide, il sert tel quel : jamais deux rayons vides à la suite.
 */
export async function openNextAisle(
  database: ShoppingDatabase,
  session: Pick<ShoppingSession, "id" | "storeId" | "startedAt">,
  currentId: ID | undefined,
  now = Date.now(),
): Promise<Aisle> {
  return database.transaction(
    "rw",
    [database.aisles, database.overrides, database.sessions],
    async () => {
      const current = currentId
        ? await database.aisles.get(currentId)
        : undefined;
      const aisle =
        current &&
        isFreshEmptyAisle(
          current,
          session,
          await aislesWithOverrides(database, session.storeId),
        )
          ? current
          : await openAisleAfter(database, session.storeId, currentId, now);
      await database.sessions.update(session.id, {
        openedAisle: { aisleId: aisle.id, at: now },
      });
      return aisle;
    },
  );
}

/**
 * Cocher un article de « À placer » (docs/03 C4) : il est rangé dans le rayon en cours
 * (ouvert en tête du magasin s'il n'y en a pas encore) — toute sa catégorie, ou lui
 * seul (`placementScope`) —, puis coché. Un rayon qui reçoit sa première catégorie
 * prend son icône et sa couleur. Renvoie le rayon choisi.
 */
export async function placeAndCheck(
  database: ShoppingDatabase,
  session: Pick<ShoppingSession, "id" | "storeId">,
  item: Pick<ListItem, "id" | "articleId" | "quantity" | "unitId">,
  article: Pick<Article, "id" | "categoryId">,
  targetId: ID | undefined,
  now = Date.now(),
): Promise<ID> {
  return database.transaction(
    "rw",
    [
      database.aisles,
      database.overrides,
      database.categories,
      database.items,
      database.purchases,
      database.sessions,
    ],
    async () => {
      const aisles = await storeAisles(database, session.storeId);
      const target =
        aisles.find((a) => a.id === targetId && !a.isUnsorted) ??
        (await openAisleAfter(database, session.storeId, undefined, now));
      const category = await database.categories.get(article.categoryId);
      if (placementScope(category, aisles) === "category" && category) {
        await setArticleOverride(database, session.storeId, article);
        await database.aisles.update(target.id, {
          ...withPrimaryCategory(target, category),
          updatedAt: now,
        });
        const current = await database.sessions.get(session.id);
        await database.sessions.update(session.id, {
          placedCategories: [
            ...(current?.placedCategories ?? []),
            { categoryId: category.id, at: now },
          ],
        });
      } else
        await setArticleOverride(database, session.storeId, article, {
          aisleId: target.id,
          aisles,
        });
      await checkItem(database, session, item, target.id, now);
      return target.id;
    },
  );
}

/** Ligne non prise : son achat dans la session est retiré. */
async function setUnbought(
  database: ShoppingDatabase,
  sessionId: ID,
  item: Pick<ListItem, "id" | "articleId">,
  status: "todo" | "unavailable",
  now: number,
): Promise<void> {
  await database.transaction(
    "rw",
    database.items,
    database.purchases,
    async () => {
      await removePurchases(database, sessionId, item);
      await database.items.update(item.id, {
        status,
        checkedAt: undefined,
        updatedAt: now,
      });
    },
  );
}

/** Remettre à prendre (décocher, ou retirer « Introuvable »). */
export const uncheckItem = (
  database: ShoppingDatabase,
  sessionId: ID,
  item: Pick<ListItem, "id" | "articleId">,
  now = Date.now(),
) => setUnbought(database, sessionId, item, "todo", now);

/** Introuvable (C3) : la ligne reste dans la liste après les courses. */
export const markUnavailable = (
  database: ShoppingDatabase,
  sessionId: ID,
  item: Pick<ListItem, "id" | "articleId">,
  now = Date.now(),
) => setUnbought(database, sessionId, item, "unavailable", now);

/** Retire l'achat de cette ligne dans la session (`isPurchaseOf`). */
export async function removePurchases(
  database: ShoppingDatabase,
  sessionId: ID,
  item: Pick<ListItem, "id" | "articleId">,
): Promise<void> {
  await database.purchases
    .where("sessionId")
    .equals(sessionId)
    .filter(isPurchaseOf(item))
    .delete();
}

/**
 * Terminer les courses (C6), en une seule transaction : les rayons ouverts pendant les
 * courses et restés vides disparaissent, photo de l'ordre actuel, apprentissage à
 * partir de tous les achats de la session (sauf ordre verrouillé), puis les lignes
 * cochées quittent la liste.
 */
export async function closeSession(
  database: ShoppingDatabase,
  sessionId: ID,
  now = Date.now(),
): Promise<void> {
  await database.transaction(
    "rw",
    [
      database.sessions,
      database.purchases,
      database.aisles,
      database.stores,
      database.items,
      database.overrides,
    ],
    async () => {
      const session = await database.sessions.get(sessionId);
      if (session?.status !== "open") return;
      // Rayons ouverts par « Rayon suivant » restés vides : ils n'apprennent rien. Le
      // rayon en cours peut en faire partie : on l'oublie aussi, pour qu'une réouverture
      // range la suite après le rayon de la dernière coche, pas en tête du magasin.
      const withOverrides = await aislesWithOverrides(
        database,
        session.storeId,
      );
      const all = await storeAisles(database, session.storeId);
      const empty = new Set(
        all
          .filter((aisle) => isFreshEmptyAisle(aisle, session, withOverrides))
          .map((aisle) => aisle.id),
      );
      await database.aisles.bulkDelete([...empty]);
      if (session.openedAisle && empty.has(session.openedAisle.aisleId))
        await database.sessions.update(sessionId, { openedAisle: undefined });
      const store = await database.stores.get(session.storeId);
      const aisles = all.filter((aisle) => !empty.has(aisle.id));
      const purchases = await database.purchases
        .where("sessionId")
        .equals(sessionId)
        .toArray();
      const articleOrder = store?.articleOrder ?? {};
      const learningSnapshot = {
        aislePositions: Object.fromEntries(
          aisles.map((a) => [a.id, a.position]),
        ),
        articleOrder,
      };
      if (store && !store.orderLocked) {
        const positions = learnAislePositions(aisles, purchases);
        await database.aisles.bulkUpdate(
          Object.entries(positions).map(([key, position]) => ({
            key,
            changes: { position, updatedAt: now },
          })),
        );
        await database.stores.update(store.id, {
          articleOrder: learnArticleOrder(articleOrder, purchases),
        });
      }
      const checked = (await activeItems(database, session.listId)).filter(
        (item) => item.status === "checked",
      );
      await database.items.bulkUpdate(
        checked.map((item) => ({
          key: item.id,
          changes: { closedInSessionId: sessionId },
        })),
      );
      await database.sessions.update(sessionId, {
        status: "closed",
        closedAt: now,
        learningSnapshot,
      });
    },
  );
}

/**
 * Rouvrir les courses (C8), si `canReopen` le permet : l'ordre
 * d'avant la clôture est rétabli et les articles achetés réapparaissent cochés. La
 * clôture suivante recalcule tout : rien n'est jamais compté deux fois. Sa liste
 * devient la liste courante : le mode courses l'affiche, pas une autre.
 */
export async function reopenSession(
  database: ShoppingDatabase,
  sessionId: ID,
  now = Date.now(),
): Promise<boolean> {
  return database.transaction(
    "rw",
    [
      database.sessions,
      database.aisles,
      database.stores,
      database.items,
      database.meta,
    ],
    async () => {
      const session = await database.sessions.get(sessionId);
      if (
        !session ||
        !canReopen(
          session,
          (await latestSession(database, session.listId))?.id,
          (await database.stores.get(session.storeId)) !== undefined,
          now,
        )
      )
        return false;
      const snapshot = session.learningSnapshot;
      if (snapshot) {
        await database.aisles.bulkUpdate(
          Object.entries(snapshot.aislePositions).map(([key, position]) => ({
            key,
            changes: { position },
          })),
        );
        await database.stores.update(session.storeId, {
          articleOrder: snapshot.articleOrder,
        });
      }
      // Une seule ligne par article et par types : un achat remis dans la liste depuis
      // (une nouvelle ligne à prendre) l'emporte, la ligne achetée reste archivée.
      const active = new Set(
        (await activeItems(database, session.listId)).map(lineKey),
      );
      await database.items
        .where("closedInSessionId")
        .equals(sessionId)
        .filter((item) => !active.has(lineKey(item)))
        .modify((item) => {
          delete item.closedInSessionId;
        });
      await database.sessions.update(sessionId, {
        status: "open",
        closedAt: undefined,
        learningSnapshot: undefined,
      });
      await updateSettings(database, { currentListId: session.listId });
      return true;
    },
  );
}

/** Ce qu'un déplacement d'article change (docs/02 § 4 « Déplacer un article »). */
export type MoveScope = "article" | "category";

/**
 * Déplacer un article vers un autre rayon de ce magasin (C5) : exception pour cet
 * article seul, ou ce rayon devient le rayon principal de toute sa catégorie
 * (l'ancien devient secondaire). Les achats de la session en cours suivent.
 */
export async function moveArticle(
  database: ShoppingDatabase,
  input: {
    storeId: ID;
    article: Pick<Article, "id" | "categoryId">;
    aisleId: ID;
    scope: MoveScope;
    sessionId?: ID;
  },
  now = Date.now(),
): Promise<void> {
  const { storeId, article, aisleId, scope, sessionId } = input;
  await database.transaction(
    "rw",
    [database.overrides, database.aisles, database.purchases],
    async () => {
      if (scope === "article")
        await setArticleOverride(database, storeId, article, {
          aisleId,
          aisles: await storeAisles(database, storeId),
        });
      else {
        await setArticleOverride(database, storeId, article);
        await setAisleCategoryRole(
          database,
          storeId,
          aisleId,
          article.categoryId,
          "primary",
          now,
        );
      }
      if (sessionId)
        await database.purchases
          .where("sessionId")
          .equals(sessionId)
          .filter((p) => p.articleId === article.id)
          .modify({ aisleId });
    },
  );
}
