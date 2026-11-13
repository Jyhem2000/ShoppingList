import type {
  Aisle,
  Article,
  ID,
  ListItem,
  Purchase,
  ShoppingSession,
} from "@/domain/model";
import { learnAislePositions, learnArticleOrder } from "@/domain/shopping";
import { insertAisleAfter, placementScope } from "@/domain/stores";
import type { ShoppingDatabase } from "./database";

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

/** Dernière session de la liste (la plus récente). */
export async function latestSession(
  database: ShoppingDatabase,
  listId: ID,
): Promise<ShoppingSession | undefined> {
  const sessions = await database.sessions
    .where("listId")
    .equals(listId)
    .sortBy("startedAt");
  return sessions.at(-1);
}

/**
 * Démarre les courses (C1), ou reprend la session déjà ouverte. Une nouvelle session
 * supprime les lignes archivées des courses précédentes (les achats restent dans
 * l'historique) et remet les introuvables à prendre.
 */
export async function startSession(
  database: ShoppingDatabase,
  listId: ID,
  storeId: ID,
  now = Date.now(),
): Promise<ShoppingSession> {
  return database.transaction(
    "rw",
    [database.sessions, database.items, database.lists, database.stores],
    async () => {
      const open = await openSession(database, listId);
      if (open) return open;
      const items = await database.items
        .where("listId")
        .equals(listId)
        .toArray();
      await database.items.bulkDelete(
        items.filter((item) => item.closedInSessionId).map((item) => item.id),
      );
      for (const item of items)
        if (!item.closedInSessionId && item.status !== "todo")
          await database.items.update(item.id, {
            status: "todo",
            checkedAt: undefined,
            updatedAt: now,
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
      await removePurchases(database, session.id, item.articleId);
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
        aisleId,
        quantity: item.quantity,
        unitId: item.unitId,
        at: now,
      };
      await database.purchases.add(purchase);
    },
  );
}

/** Icône et couleur d'un rayon qui vient d'être ouvert, avant qu'il reçoive une catégorie. */
const NEW_AISLE_STYLE = { icon: "shopping-basket", color: "gris" } as const;

/** Rayon ouvert pendant ces courses, encore vide : ni catégorie, ni exception. */
async function isFreshEmptyAisle(
  database: ShoppingDatabase,
  aisle: Aisle,
  session: Pick<ShoppingSession, "startedAt">,
): Promise<boolean> {
  if (aisle.isUnsorted || aisle.categories.length > 0) return false;
  if (aisle.createdAt < session.startedAt) return false;
  const overrides = await database.overrides
    .filter((o) => o.aisleId === aisle.id)
    .count();
  return overrides === 0;
}

/** Nouveau rayon sans nom, juste après `afterId` (en tête si absent). */
async function openAisleAfter(
  database: ShoppingDatabase,
  storeId: ID,
  afterId: ID | undefined,
  now: number,
): Promise<Aisle> {
  const aisles = await database.aisles
    .where("storeId")
    .equals(storeId)
    .toArray();
  const aisle: Aisle = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    storeId,
    name: "",
    ...NEW_AISLE_STYLE,
    position: 0,
    categories: [],
    isUnsorted: false,
  };
  const positions = insertAisleAfter([...aisles, aisle], afterId, aisle.id);
  aisle.position = positions[aisle.id] ?? 0;
  await database.aisles.add(aisle);
  for (const other of aisles)
    if (
      positions[other.id] !== undefined &&
      positions[other.id] !== other.position
    )
      await database.aisles.update(other.id, { position: positions[other.id] });
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
        current && (await isFreshEmptyAisle(database, current, session))
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
      const aisles = await database.aisles
        .where("storeId")
        .equals(session.storeId)
        .toArray();
      const target =
        aisles.find((a) => a.id === targetId && !a.isUnsorted) ??
        (await openAisleAfter(database, session.storeId, undefined, now));
      const category = await database.categories.get(article.categoryId);
      const existing = await database.overrides
        .where("[storeId+articleId]")
        .equals([session.storeId, article.id])
        .toArray();
      await database.overrides.bulkDelete(existing.map((o) => o.id));
      if (placementScope(category, aisles) === "category" && category) {
        const fresh = target.categories.length === 0;
        await database.aisles.update(target.id, {
          categories: [
            ...target.categories.filter((c) => c.categoryId !== category.id),
            { categoryId: category.id, primary: true },
          ],
          ...(fresh &&
          target.icon === NEW_AISLE_STYLE.icon &&
          target.color === NEW_AISLE_STYLE.color
            ? { icon: category.icon, color: category.color }
            : {}),
          updatedAt: now,
        });
        const current = await database.sessions.get(session.id);
        await database.sessions.update(session.id, {
          placedCategories: [
            ...(current?.placedCategories ?? []),
            { categoryId: category.id, at: now },
          ],
        });
      } else if (
        // Déjà le rayon de sa catégorie : aucune exception à garder.
        !target.categories.some(
          (c) => c.categoryId === article.categoryId && c.primary,
        )
      )
        await database.overrides.add({
          id: crypto.randomUUID(),
          storeId: session.storeId,
          articleId: article.id,
          aisleId: target.id,
        });
      await checkItem(database, session, item, target.id, now);
      return target.id;
    },
  );
}

/** Remettre à prendre (décocher, ou retirer « Introuvable »). */
export async function uncheckItem(
  database: ShoppingDatabase,
  sessionId: ID,
  item: Pick<ListItem, "id" | "articleId">,
  now = Date.now(),
): Promise<void> {
  await database.transaction(
    "rw",
    database.items,
    database.purchases,
    async () => {
      await removePurchases(database, sessionId, item.articleId);
      await database.items.update(item.id, {
        status: "todo",
        checkedAt: undefined,
        updatedAt: now,
      });
    },
  );
}

/** Introuvable (C3) : la ligne reste dans la liste après les courses. */
export async function markUnavailable(
  database: ShoppingDatabase,
  sessionId: ID,
  item: Pick<ListItem, "id" | "articleId">,
  now = Date.now(),
): Promise<void> {
  await database.transaction(
    "rw",
    database.items,
    database.purchases,
    async () => {
      await removePurchases(database, sessionId, item.articleId);
      await database.items.update(item.id, {
        status: "unavailable",
        checkedAt: undefined,
        updatedAt: now,
      });
    },
  );
}

async function removePurchases(
  database: ShoppingDatabase,
  sessionId: ID,
  articleId: ID,
): Promise<void> {
  await database.purchases
    .where("sessionId")
    .equals(sessionId)
    .filter((purchase) => purchase.articleId === articleId)
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
      // Rayons ouverts par « Rayon suivant » restés vides : ils n'apprennent rien.
      for (const aisle of await database.aisles
        .where("storeId")
        .equals(session.storeId)
        .toArray())
        if (await isFreshEmptyAisle(database, aisle, session))
          await database.aisles.delete(aisle.id);
      const store = await database.stores.get(session.storeId);
      const aisles = await database.aisles
        .where("storeId")
        .equals(session.storeId)
        .toArray();
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
        for (const [id, position] of Object.entries(positions))
          await database.aisles.update(id, { position, updatedAt: now });
        await database.stores.update(store.id, {
          articleOrder: learnArticleOrder(articleOrder, purchases),
        });
      }
      const checked = await database.items
        .where("listId")
        .equals(session.listId)
        .filter((item) => item.status === "checked" && !item.closedInSessionId)
        .toArray();
      for (const item of checked)
        await database.items.update(item.id, { closedInSessionId: sessionId });
      await database.sessions.update(sessionId, {
        status: "closed",
        closedAt: now,
        learningSnapshot,
      });
    },
  );
}

/**
 * Rouvrir les courses (C8), tant qu'aucune nouvelle session n'a démarré : l'ordre
 * d'avant la clôture est rétabli et les articles achetés réapparaissent cochés. La
 * clôture suivante recalcule tout : rien n'est jamais compté deux fois.
 */
export async function reopenSession(
  database: ShoppingDatabase,
  sessionId: ID,
): Promise<boolean> {
  return database.transaction(
    "rw",
    [database.sessions, database.aisles, database.stores, database.items],
    async () => {
      const session = await database.sessions.get(sessionId);
      if (session?.status !== "closed") return false;
      const latest = await latestSession(database, session.listId);
      if (latest?.id !== session.id) return false;
      // Magasin supprimé depuis : plus rien à rouvrir.
      if (!(await database.stores.get(session.storeId))) return false;
      const snapshot = session.learningSnapshot;
      if (snapshot) {
        for (const [id, position] of Object.entries(snapshot.aislePositions))
          await database.aisles.update(id, { position });
        await database.stores.update(session.storeId, {
          articleOrder: snapshot.articleOrder,
        });
      }
      await database.items
        .where("closedInSessionId")
        .equals(sessionId)
        .modify((item) => {
          delete item.closedInSessionId;
        });
      await database.sessions.update(sessionId, {
        status: "open",
        closedAt: undefined,
        learningSnapshot: undefined,
      });
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
      const existing = await database.overrides
        .where("[storeId+articleId]")
        .equals([storeId, article.id])
        .toArray();
      await database.overrides.bulkDelete(existing.map((o) => o.id));
      if (scope === "article") {
        const aisles = await database.aisles
          .where("storeId")
          .equals(storeId)
          .toArray();
        const primary = aisles.find((a) =>
          a.categories.some(
            (c) => c.categoryId === article.categoryId && c.primary,
          ),
        );
        // Déjà le rayon de sa catégorie : aucune exception à garder.
        if (primary?.id !== aisleId)
          await database.overrides.add({
            id: crypto.randomUUID(),
            storeId,
            articleId: article.id,
            aisleId,
          });
      } else {
        const aisles = await database.aisles
          .where("storeId")
          .equals(storeId)
          .toArray();
        for (const aisle of aisles) {
          const others = aisle.categories.filter(
            (c) => c.categoryId !== article.categoryId,
          );
          const had = aisle.categories.find(
            (c) => c.categoryId === article.categoryId,
          );
          const categories =
            aisle.id === aisleId
              ? [...others, { categoryId: article.categoryId, primary: true }]
              : had
                ? [
                    ...others,
                    { categoryId: article.categoryId, primary: false },
                  ]
                : aisle.categories;
          if (categories !== aisle.categories)
            await database.aisles.update(aisle.id, {
              categories,
              updatedAt: now,
            });
        }
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
