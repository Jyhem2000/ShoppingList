import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { exportBackup, importBackup, readBackup } from "@/db/backup";
import { updateCatalog } from "@/db/catalogUpdate";
import {
  COPIES_KEPT,
  listCopies,
  replaceAllData,
  restoreCopy,
  takeDailyCopy,
} from "@/db/copies";
import { SCHEMA_V1, ShoppingDatabase } from "@/db/database";
import { Dexie } from "dexie";
import { addListItem } from "@/db/items";
import { seedDatabase } from "@/db/seed";
import { updateSettings } from "@/db/settings";
import { createEmptyStore } from "@/db/stores";

const databases: ShoppingDatabase[] = [];
function open(): ShoppingDatabase {
  const database = new ShoppingDatabase(`test-${crypto.randomUUID()}`);
  databases.push(database);
  return database;
}
afterEach(async () => {
  await Promise.all(databases.splice(0).map((d) => d.delete()));
});

describe("sauvegarde (docs/03 H4)", () => {
  it("export puis import : aller-retour sans perte, dans une base vierge", async () => {
    const source = open();
    await seedDatabase(source, 0);
    const list = await source.lists.toCollection().first();
    const pommes = await source.articles
      .where("catalogKey")
      .equals("pommes")
      .first();
    if (!list || !pommes) throw new Error("données");
    await addListItem(source, {
      listId: list.id,
      articleId: pommes.id,
      quantity: 2,
      unitId: pommes.defaultUnitId,
    });
    await source.articles.update(pommes.id, { aliases: ["api"] });

    const text = JSON.stringify(await exportBackup(source, 1000));
    const read = readBackup(text, source.verno);
    if (read.kind !== "ok") throw new Error(read.kind);
    expect(read.summary.lists).toBe(1);

    const target = open();
    await seedDatabase(target, 5);
    await importBackup(target, read.backup);
    for (const table of source.tables)
      expect(await target.table(table.name).toArray(), table.name).toEqual(
        await table.toArray(),
      );
  });

  it("refuse un fichier qui n'est pas une sauvegarde, ou d'une version plus récente", () => {
    expect(readBackup("pas du json", 1).kind).toBe("invalid");
    expect(readBackup(JSON.stringify({ app: "Autre" }), 1).kind).toBe(
      "invalid",
    );
    const tables = Object.fromEntries(
      [
        "units",
        "categories",
        "articles",
        "stores",
        "aisles",
        "overrides",
        "lists",
        "items",
        "recipes",
        "sessions",
        "purchases",
        "meta",
      ].map((name) => [name, []]),
    );
    const future = {
      app: "ShoppingList",
      format: 1,
      schema: 99,
      exportedAt: 0,
      tables,
    };
    expect(readBackup(JSON.stringify(future), 1).kind).toBe("newer");
    // Enregistrement abîmé (ligne sans ses tableaux) : refusé avant d'importer.
    const broken = {
      ...future,
      schema: 1,
      tables: { ...tables, items: [{ id: "x", listId: "l" }] },
    };
    expect(readBackup(JSON.stringify(broken), 1).kind).toBe("invalid");
  });
});

describe("mise à jour du catalogue sans réinstaller (docs/06 § 7)", () => {
  it("ajoute les nouveautés du catalogue, sans toucher à ce que l'utilisateur a supprimé avant", async () => {
    const database = open();
    await seedDatabase(database, 0);
    // Comme une base créée avec le catalogue 1 : ni Brandade, ni Gnocchis, ni « Épices ».
    for (const key of ["brandade-de-morue", "gnocchis", "conserves"])
      await database.articles.where("catalogKey").equals(key).delete();
    await database.categories.filter((c) => c.catalogKey === "epices").delete();
    await database.articles.where("catalogKey").equals("pommes").delete();
    // Livrée en sachet avant la correction du catalogue 4.
    const sachet = await database.units.where("slug").equals("sachet").first();
    const litiere = await database.articles
      .where("catalogKey")
      .equals("litiere")
      .first();
    if (!sachet || !litiere) throw new Error("données");
    await database.articles.update(litiere.id, { defaultUnitId: sachet.id });
    // Livrés au poids avant le catalogue 8 ; les poireaux ont été modifiés depuis.
    const article = async (key: string) => {
      const found = await database.articles
        .where("catalogKey")
        .equals(key)
        .first();
      if (!found) throw new Error(key);
      return found;
    };
    const units = await database.units.toArray();
    const unitId = (slug: string) => units.find((u) => u.slug === slug)?.id;
    const [oignons, echalotes, poireaux, tomates] = await Promise.all(
      ["oignons", "echalotes", "poireaux", "tomates"].map(article),
    );
    if (!oignons || !echalotes || !poireaux || !tomates)
      throw new Error("données");
    await database.articles.update(oignons.id, { defaultUnitId: unitId("kg") });
    await database.articles.update(echalotes.id, {
      defaultUnitId: unitId("g"),
      defaultQuantity: 500,
    });
    await database.articles.update(poireaux.id, {
      defaultUnitId: unitId("kg"),
      updatedAt: 1,
    });
    await database.articles.update(tomates.id, { countable: undefined });
    await updateSettings(database, { catalogVersion: 1 });

    // 3 articles, 1 catégorie, la litière et les 21 corrections du catalogue 8
    // (17 articles qui se comptent, pommes supprimées ; 6 à la pièce, sauf les poireaux).
    expect(await updateCatalog(database)).toBe(26);
    expect(await database.articles.get(oignons.id)).toMatchObject({
      defaultUnitId: unitId("piece"),
    });
    const fixed = await database.articles.get(echalotes.id);
    expect(fixed?.defaultUnitId).toBe(unitId("piece"));
    expect(fixed?.defaultQuantity).toBeUndefined();
    expect((await database.articles.get(poireaux.id))?.defaultUnitId).toBe(
      unitId("kg"),
    );
    expect((await database.articles.get(tomates.id))?.countable).toBe(true);
    const paquet = await database.units.where("slug").equals("paquet").first();
    expect((await database.articles.get(litiere.id))?.defaultUnitId).toBe(
      paquet?.id,
    );
    for (const key of ["brandade-de-morue", "gnocchis", "conserves"])
      expect(
        await database.articles.where("catalogKey").equals(key).count(),
        key,
      ).toBe(1);
    expect(
      await database.categories
        .filter((c) => c.catalogKey === "epices")
        .count(),
    ).toBe(1);
    // Supprimé par l'utilisateur, pas une nouveauté : il ne revient pas.
    expect(
      await database.articles.where("catalogKey").equals("pommes").count(),
    ).toBe(0);
    // Une seule fois.
    expect(await updateCatalog(database)).toBe(0);
  });
});

describe("copies automatiques internes (docs/03 H4)", () => {
  const DAY = 24 * 60 * 60 * 1000;
  // Midi, pour rester dans le même jour local quel que soit le fuseau des tests.
  const noon = (day: number) => new Date(2026, 10, 1 + day, 12).getTime();

  it("une par jour au plus, les 7 dernières gardées, restauration sans perte", async () => {
    const database = open();
    await seedDatabase(database, 0);
    const list = await database.lists.toCollection().first();
    if (!list) throw new Error("liste");

    expect(await takeDailyCopy(database, noon(0))).toBe(true);
    // Même jour : pas de deuxième copie.
    expect(await takeDailyCopy(database, noon(0) + 3 * 60 * 60 * 1000)).toBe(
      false,
    );
    const before = await database.lists.toArray();

    // Une fausse manipulation, puis la restauration de la copie du jour.
    await database.lists.update(list.id, { name: "Effacée par erreur" });
    const [copy] = await listCopies(database);
    if (!copy) throw new Error("copie");
    expect(copy.summary.lists).toBe(1);
    expect(
      await restoreCopy(database, copy.id, noon(0) + 4 * 60 * 60 * 1000),
    ).toBe(true);
    expect(await database.lists.toArray()).toEqual(before);
    // Les copies restent, et l'état d'avant la restauration est gardé dans une nouvelle.
    const [safety] = await listCopies(database);
    expect(await database.copies.count()).toBe(2);
    expect(safety?.beforeReplace).toBe(true);
    const saved = await database.copyBackups.get(safety?.id ?? "");
    expect(saved?.backup.tables.lists).toContainEqual(
      expect.objectContaining({ name: "Effacée par erreur" }),
    );

    for (let day = 1; day <= 9; day++)
      await takeDailyCopy(database, noon(0) + day * DAY);
    const kept = await listCopies(database);
    expect(kept).toHaveLength(COPIES_KEPT);
    // Les plus récentes d'abord ; les plus anciennes ont disparu.
    expect(kept[0]?.at).toBe(noon(0) + 9 * DAY);
    expect(kept.at(-1)?.at).toBe(noon(0) + 3 * DAY);
    // Les données complètes suivent : rien ne reste des copies effacées.
    expect(await database.copyBackups.count()).toBe(COPIES_KEPT);
    // Le fichier exporté ne contient jamais les copies.
    expect(Object.keys((await exportBackup(database)).tables)).not.toContain(
      "copies",
    );
  });

  it("restaurer la plus ancienne des 7 copies la garde", async () => {
    const database = open();
    await seedDatabase(database, 0);
    for (let day = 0; day < COPIES_KEPT; day++)
      await takeDailyCopy(database, noon(0) + day * DAY);
    const oldest = (await listCopies(database)).at(-1);
    if (!oldest) throw new Error("copie");
    await restoreCopy(database, oldest.id, noon(0) + 8 * DAY);
    const kept = await listCopies(database);
    expect(kept).toHaveLength(COPIES_KEPT);
    expect(kept.map((copy) => copy.id)).toContain(oldest.id);
  });

  it("un magasin sans rayon « À placer » le retrouve à l'import", async () => {
    const database = open();
    await seedDatabase(database, 0);
    await createEmptyStore(database, "Marché", 0);
    expect(await database.stores.count()).toBeGreaterThan(0);
    const backup = await exportBackup(database, noon(0));
    backup.tables.aisles = (
      backup.tables.aisles as { isUnsorted: boolean }[]
    ).filter((aisle) => !aisle.isUnsorted);
    await replaceAllData(database, backup, noon(0));
    for (const store of await database.stores.toArray())
      expect(
        await database.aisles
          .where("storeId")
          .equals(store.id)
          .filter((aisle) => aisle.isUnsorted)
          .count(),
      ).toBe(1);
  });

  it("un remplacement qui échoue ne change rien, pas même les copies", async () => {
    const database = open();
    await seedDatabase(database, 0);
    await takeDailyCopy(database, noon(0));
    const backup = await exportBackup(database, noon(0));
    const [list] = backup.tables.lists;
    // Deux listes de même identifiant : l'import échoue en cours de route.
    backup.tables.lists = [list, list];
    const before = await exportBackup(database, noon(0));

    await expect(replaceAllData(database, backup, noon(0))).rejects.toThrow();
    expect(await exportBackup(database, noon(0))).toEqual(before);
    expect(await database.copies.count()).toBe(1);
  });

  it("le passage aux schémas suivants garde les données de la version 2", async () => {
    const name = `test-${crypto.randomUUID()}`;
    const old = new Dexie(name);
    old.version(2).stores(SCHEMA_V1);
    await old.open();
    await old.table("lists").add({ id: "l1", name: "Liste 1", position: 0 });
    old.close();

    const database = new ShoppingDatabase(name);
    databases.push(database);
    expect(await database.lists.get("l1")).toMatchObject({ name: "Liste 1" });
    expect(await database.copies.count()).toBe(0);
    expect(database.verno).toBe(6);
  });
});
