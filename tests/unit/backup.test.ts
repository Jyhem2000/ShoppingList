import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { exportBackup, importBackup, readBackup } from "@/db/backup";
import { updateCatalog } from "@/db/catalogUpdate";
import { ShoppingDatabase } from "@/db/database";
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
