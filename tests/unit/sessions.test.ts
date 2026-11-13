import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";

import { ShoppingDatabase } from "@/db/database";
import { addListItem } from "@/db/items";
import { seedDatabase } from "@/db/seed";
import { addTestStore } from "./fixtures";
import {
  checkItem,
  closeSession,
  markUnavailable,
  moveArticle,
  openNextAisle,
  placeAndCheck,
  reopenSession,
  startSession,
} from "@/db/sessions";
import { createEmptyStore } from "@/db/stores";
import { groupListForStore } from "@/domain/aisles";
import type { ID } from "@/domain/model";
import { learnAislePositions } from "@/domain/shopping";

let database: ShoppingDatabase | undefined;

afterEach(async () => {
  await database?.delete();
  database = undefined;
});

async function setup() {
  database = new ShoppingDatabase(`test-${crypto.randomUUID()}`);
  const db = database;
  await seedDatabase(db, 0);
  await addTestStore(db);
  const list = await db.lists.toCollection().first();
  const store = await db.stores.toCollection().first();
  if (!list || !store) throw new Error("données de départ absentes");
  const article = async (key: string) => {
    const found = await db.articles.where("catalogKey").equals(key).first();
    if (!found) throw new Error(key);
    return found;
  };
  const aisleOf = async (name: string) => {
    const found = (
      await db.aisles.where("storeId").equals(store.id).toArray()
    ).find((a) => a.name === name);
    if (!found) throw new Error(name);
    return found;
  };
  /** Ajoute ces articles à la liste et les coche dans cet ordre, dans leur rayon. */
  const shop = async (
    keys: string[],
    aisleNames: string[],
    at: number,
    storeId: ID = store.id,
  ) => {
    for (const key of keys) {
      const a = await article(key);
      await addListItem(db, {
        listId: list.id,
        articleId: a.id,
        quantity: 1,
        unitId: a.defaultUnitId,
      });
    }
    const session = await startSession(db, list.id, storeId, at);
    for (const [index, key] of keys.entries()) {
      const a = await article(key);
      const item = await db.items
        .where("articleId")
        .equals(a.id)
        .filter((i) => !i.closedInSessionId)
        .first();
      const aisle = await aisleOf(aisleNames[index] ?? "");
      if (item) await checkItem(db, session, item, aisle.id, at + index * 1000);
    }
    return session;
  };
  return { db, list, store, article, aisleOf, shop };
}

async function displayedAisles(db: ShoppingDatabase, storeId: ID) {
  const aisles = await db.aisles.where("storeId").equals(storeId).toArray();
  return aisles
    .filter((a) => !a.isUnsorted)
    .sort((a, b) => a.position - b.position)
    .map((a) => a.name);
}

describe("clôture et apprentissage (docs/03 C6, C7)", () => {
  it("après 3 courses Crèmerie → Fruits & Légumes → Épicerie, la liste suit cet ordre dans ce magasin seulement", async () => {
    const { db, list, store, article, shop } = await setup();
    const other = await addTestStore(db, "Autre");
    const otherBefore = await displayedAisles(db, other.id);

    for (let n = 0; n < 3; n++) {
      const session = await shop(
        ["lait", "pommes", "pates"],
        ["Crèmerie", "Fruits & Légumes", "Épicerie salée"],
        n * 86_400_000,
      );
      await closeSession(db, session.id, n * 86_400_000 + 60_000);
    }

    // La liste du prochain passage, avec les mêmes articles.
    for (const key of ["pates", "pommes", "lait"]) {
      const a = await article(key);
      await addListItem(db, {
        listId: list.id,
        articleId: a.id,
        quantity: 1,
        unitId: a.defaultUnitId,
      });
    }
    const items = await db.items.where("listId").equals(list.id).toArray();
    const groups = groupListForStore(
      items,
      new Map((await db.articles.toArray()).map((a) => [a.id, a])),
      store.id,
      await db.aisles.where("storeId").equals(store.id).toArray(),
      [],
    );
    expect(groups.map((g) => g.aisle.name)).toEqual([
      "Crèmerie",
      "Fruits & Légumes",
      "Épicerie salée",
    ]);
    expect(await displayedAisles(db, other.id)).toEqual(otherBefore);
  });

  it("les lignes cochées quittent la liste, les introuvables et les autres restent", async () => {
    const { db, list, article, shop } = await setup();
    const beurre = await article("beurre");
    await addListItem(db, {
      listId: list.id,
      articleId: beurre.id,
      quantity: 1,
      unitId: beurre.defaultUnitId,
    });
    const session = await shop(["lait"], ["Crèmerie"], 0);
    const riz = await article("riz");
    const added = await addListItem(db, {
      listId: list.id,
      articleId: riz.id,
      quantity: 1,
      unitId: riz.defaultUnitId,
    });
    await markUnavailable(db, session.id, added.item);
    await closeSession(db, session.id, 10_000);

    const visible = (await db.items.where("listId").equals(list.id).toArray())
      .filter((i) => !i.closedInSessionId)
      .map((i) => i.articleId);
    expect(visible.sort()).toEqual([beurre.id, riz.id].sort());
  });

  it("ne touche pas à l'ordre d'un magasin verrouillé", async () => {
    const { db, store, shop } = await setup();
    await db.stores.update(store.id, { orderLocked: true });
    const before = await displayedAisles(db, store.id);
    const session = await shop(
      ["pates", "pommes"],
      ["Épicerie salée", "Fruits & Légumes"],
      0,
    );
    await closeSession(db, session.id, 10_000);
    expect(await displayedAisles(db, store.id)).toEqual(before);
  });
});

describe("réouverture (docs/03 C8)", () => {
  it("clôturer, rouvrir, cocher un article de plus, clôturer : chaque article une fois, apprentissage appliqué une fois", async () => {
    const { db, list, article, aisleOf, shop } = await setup();
    const session = await shop(
      ["pates", "pommes"],
      ["Épicerie salée", "Fruits & Légumes"],
      0,
    );
    const positionsBefore = Object.fromEntries(
      (await db.aisles.toArray()).map((a) => [a.id, a.position]),
    );
    await closeSession(db, session.id, 10_000);

    expect(await reopenSession(db, session.id)).toBe(true);
    // L'ordre d'avant la clôture est rétabli, les achats réapparaissent cochés.
    expect(
      Object.fromEntries(
        (await db.aisles.toArray()).map((a) => [a.id, a.position]),
      ),
    ).toEqual(positionsBefore);
    const back = await db.items.where("listId").equals(list.id).toArray();
    expect(
      back.filter((i) => i.status === "checked" && !i.closedInSessionId),
    ).toHaveLength(2);

    const lait = await article("lait");
    const added = await addListItem(db, {
      listId: list.id,
      articleId: lait.id,
      quantity: 1,
      unitId: lait.defaultUnitId,
    });
    const reopened = await db.sessions.get(session.id);
    if (!reopened) throw new Error("session");
    await checkItem(
      db,
      reopened,
      added.item,
      (await aisleOf("Crèmerie")).id,
      20_000,
    );
    await closeSession(db, session.id, 30_000);

    const purchases = await db.purchases
      .where("sessionId")
      .equals(session.id)
      .toArray();
    const articleIds = purchases.map((p) => p.articleId);
    expect(articleIds).toHaveLength(3);
    expect(new Set(articleIds).size).toBe(3);
    // Même résultat qu'une seule clôture avec tous les achats, depuis l'ordre de départ.
    const expected = {
      ...positionsBefore,
      ...learnAislePositions(
        (await db.aisles.toArray()).map((a) => ({
          ...a,
          position: positionsBefore[a.id] ?? a.position,
        })),
        purchases,
      ),
    };
    expect(
      Object.fromEntries(
        (await db.aisles.toArray()).map((a) => [a.id, a.position]),
      ),
    ).toEqual(expected);
  });

  it("n'est plus possible une fois de nouvelles courses commencées", async () => {
    const { db, list, store, shop } = await setup();
    const first = await shop(["pates"], ["Épicerie salée"], 0);
    await closeSession(db, first.id, 1000);
    await startSession(db, list.id, store.id, 2000);
    expect(await reopenSession(db, first.id)).toBe(false);
    // Les lignes archivées des courses précédentes sont supprimées.
    const items = await db.items.where("listId").equals(list.id).toArray();
    expect(items.filter((i) => i.closedInSessionId)).toEqual([]);
  });
});

describe("changer un article de rayon (docs/03 C5)", () => {
  it("seulement cet article : une exception pour ce magasin ; toute la catégorie : nouveau rayon principal", async () => {
    const { db, store, article, aisleOf } = await setup();
    const lait = await article("lait");
    const frais = await aisleOf("Charcuterie & Traiteur");
    await moveArticle(db, {
      storeId: store.id,
      article: lait,
      aisleId: frais.id,
      scope: "article",
    });
    const overrides = await db.overrides.toArray();
    expect(overrides.map((o) => [o.articleId, o.aisleId])).toEqual([
      [lait.id, frais.id],
    ]);

    await moveArticle(db, {
      storeId: store.id,
      article: lait,
      aisleId: frais.id,
      scope: "category",
    });
    expect(await db.overrides.count()).toBe(0);
    const aisles = await db.aisles.where("storeId").equals(store.id).toArray();
    const primaries = aisles.filter((a) =>
      a.categories.some((c) => c.categoryId === lait.categoryId && c.primary),
    );
    expect(primaries.map((a) => a.id)).toEqual([frais.id]);
    const cremerie = aisles.find((a) => a.name === "Crèmerie");
    expect(
      cremerie?.categories.find((c) => c.categoryId === lait.categoryId)
        ?.primary,
    ).toBe(false);
  });
});

describe("magasin construit pendant les courses (docs/03 C4)", () => {
  it("ranger en cochant, « Rayon suivant », rayons vides retirés à la clôture", async () => {
    database = new ShoppingDatabase(`test-${crypto.randomUUID()}`);
    const db = database;
    await seedDatabase(db, 0);
    const list = await db.lists.toCollection().first();
    if (!list) throw new Error("liste");
    const store = await createEmptyStore(db, "Marché", 0);
    const items = new Map<string, Awaited<ReturnType<typeof addListItem>>>();
    const article = async (key: string) => {
      const found = await db.articles.where("catalogKey").equals(key).first();
      if (!found) throw new Error(key);
      return found;
    };
    for (const key of ["pommes", "bananes", "lait"]) {
      const a = await article(key);
      items.set(
        key,
        await addListItem(db, {
          listId: list.id,
          articleId: a.id,
          quantity: 1,
          unitId: a.defaultUnitId,
        }),
      );
    }
    const session = await startSession(db, list.id, store.id, 1000);
    const place = async (
      key: string,
      target: string | undefined,
      at: number,
    ) => {
      const added = items.get(key);
      if (!added) throw new Error(key);
      return placeAndCheck(
        db,
        session,
        added.item,
        await article(key),
        target,
        at,
      );
    };

    // Premier article : le rayon 1 s'ouvre, toute la catégorie Fruits y va.
    const first = await place("pommes", undefined, 2000);
    const fruits = await db.categories
      .filter((c) => c.catalogKey === "fruits")
      .first();
    let aisle = await db.aisles.get(first);
    expect(aisle?.categories).toEqual([
      { categoryId: fruits?.id, primary: true },
    ]);
    expect(aisle?.icon).toBe(fruits?.icon);

    // Rayon suivant (deux fois de suite : un seul rayon vide), puis le lait.
    const next = await openNextAisle(db, session, first, 3000);
    const again = await openNextAisle(db, session, next.id, 3500);
    expect(again.id).toBe(next.id);
    const second = await place("lait", next.id, 4000);
    expect(second).toBe(next.id);

    // Sa catégorie a déjà un rayon (Fruits, au rayon 1) : seul cet article est rangé ici.
    await place("bananes", second, 5000);
    expect(await db.overrides.filter((o) => o.aisleId === second).count()).toBe(
      1,
    );

    // Un rayon ouvert et laissé vide disparaît à la clôture.
    const empty = await openNextAisle(db, session, second, 6000);
    await closeSession(db, session.id, 7000);
    expect(await db.aisles.get(empty.id)).toBeUndefined();
    const kept = (await db.aisles.where("storeId").equals(store.id).toArray())
      .filter((a) => !a.isUnsorted)
      .sort((a, b) => a.position - b.position)
      .map((a) => a.id);
    expect(kept).toEqual([first, second]);
    aisle = await db.aisles.get(second);
    expect(aisle?.categories).toHaveLength(1);
  });
});
