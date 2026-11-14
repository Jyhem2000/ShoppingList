import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { exportBackup, importBackup, readBackup } from "@/db/backup";
import { updateCatalog } from "@/db/catalogUpdate";
import {
  COPIES_KEPT,
  listCopies,
  restoreCopy,
  takeDailyCopy,
} from "@/db/copies";
import { SCHEMA_V1, ShoppingDatabase } from "@/db/database";
import { Dexie } from "dexie";
import { addListItem } from "@/db/items";
import { seedDatabase } from "@/db/seed";
import { updateSettings } from "@/db/settings";

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
    await updateSettings(database, { catalogVersion: 1 });

    // 3 articles, 1 catégorie, 1 correction (la litière, jamais modifiée).
    expect(await updateCatalog(database)).toBe(5);
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
    expect(await restoreCopy(database, copy.id)).toBe(true);
    expect(await database.lists.toArray()).toEqual(before);
    // Les copies, elles, restent après une restauration.
    expect(await database.copies.count()).toBe(1);

    for (let day = 1; day <= 9; day++)
      await takeDailyCopy(database, noon(0) + day * DAY);
    const kept = await listCopies(database);
    expect(kept).toHaveLength(COPIES_KEPT);
    // Les plus récentes d'abord ; les plus anciennes ont disparu.
    expect(kept[0]?.at).toBe(noon(0) + 9 * DAY);
    expect(kept.at(-1)?.at).toBe(noon(0) + 3 * DAY);
    // Le fichier exporté ne contient jamais les copies.
    expect(Object.keys((await exportBackup(database)).tables)).not.toContain(
      "copies",
    );
  });

  it("le passage au schéma 3 garde les données de la version 2", async () => {
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
    expect(database.verno).toBe(3);
  });
});
