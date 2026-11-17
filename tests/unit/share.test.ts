import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { categoriesData, keywordRules, unitsData } from "@/data";
import { catalogData } from "@/data/catalog";
import { ShoppingDatabase } from "@/db/database";
import { addListItem } from "@/db/items";
import { activeItems } from "@/db/lists";
import { seedDatabase } from "@/db/seed";
import { applyImport } from "@/db/share";
import type { Article, Category, ID, ListItem, Unit } from "@/domain/model";
import {
  buildImportCatalog,
  buildSharedList,
  findSharedList,
  resolveImport,
  shareLink,
  suggestCandidates,
  textImportLines,
  type ImportContext,
  type SharedList,
} from "@/domain/share";
import { slugify } from "@/domain/slug";

const catalog = buildImportCatalog({
  articles: catalogData,
  categories: categoriesData,
  units: unitsData,
});

const databases: ShoppingDatabase[] = [];
async function seeded(): Promise<ShoppingDatabase> {
  const db = new ShoppingDatabase(`share-${crypto.randomUUID()}`);
  databases.push(db);
  await seedDatabase(db, 0);
  return db;
}
afterEach(async () => {
  for (const db of databases.splice(0)) await db.delete();
});

async function context(db: ShoppingDatabase): Promise<ImportContext> {
  return {
    articles: await db.articles.toArray(),
    categories: await db.categories.toArray(),
    units: await db.units.toArray(),
    purchaseCounts: new Map(),
    catalog,
    keywordRules,
  };
}

const byKey = async (db: ShoppingDatabase, key: string) => {
  const article = await db.articles.where("catalogKey").equals(key).first();
  if (!article) throw new Error(key);
  return article;
};

/** La liste partagée par `db` : ses lignes à acheter. */
async function share(db: ShoppingDatabase): Promise<SharedList> {
  const list = await db.lists.orderBy("position").first();
  if (!list) throw new Error("liste");
  const map = <T extends { id: ID }>(rows: T[]) =>
    new Map(rows.map((row) => [row.id, row]));
  return buildSharedList(
    list.name,
    await activeItems(db, list.id),
    map<Article>(await db.articles.toArray()),
    map<Category>(await db.categories.toArray()),
    map<Unit>(await db.units.toArray()),
  );
}

async function add(
  db: ShoppingDatabase,
  article: Article,
  quantity: number,
  extra: Partial<ListItem> = {},
): Promise<void> {
  const list = await db.lists.orderBy("position").first();
  if (!list) throw new Error("liste");
  await addListItem(db, {
    listId: list.id,
    articleId: article.id,
    quantity,
    unitId: extra.unitId ?? article.defaultUnitId,
    acceptedTypes: extra.acceptedTypes ?? [],
    note: extra.note,
  });
}

describe("lien de partage (docs/07 § 7.9)", () => {
  it("un article du catalogue ne voyage qu'avec sa clé ; le lien se retrouve dans le message", async () => {
    const sender = await seeded();
    await add(sender, await byKey(sender, "tomates"), 1, {
      acceptedTypes: ["grappe"],
      note: "bien mûres",
    });
    const shared = await share(sender);
    expect(shared.i).toEqual([
      { k: "tomates", q: 1, u: "kg", t: ["grappe"], o: "bien mûres" },
    ]);
    const message = `Liste 1\n• Tomates 1 kg\n\nPour l'ajouter : ${shareLink("https://exemple.fr/", shared)}`;
    expect(findSharedList(message)).toEqual({ ...shared, c: [], u: [] });
  });

  it("un lien abîmé ou absent ne donne rien", () => {
    expect(findSharedList("Des tomates et du pain")).toBeUndefined();
    expect(findSharedList("https://exemple.fr/#/import?d=abc")).toBeUndefined();
  });

  it("un lien réencodé par une messagerie se relit ; un nom vide est écarté", () => {
    const shared: SharedList = {
      v: 1,
      l: "fr",
      n: "Courses",
      i: [
        { k: "tomates", q: 1, u: "kg" },
        { n: " … ", q: 1, u: "piece" },
      ],
    };
    const link = shareLink("https://exemple.fr/", shared);
    const start = link.indexOf("d=") + 2;
    const reencoded =
      link.slice(0, start) +
      encodeURIComponent(link.slice(start)).replace(
        /^[A-Za-z0-9]/,
        (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
      );
    expect(reencoded).not.toBe(link);
    expect(findSharedList(reencoded)?.i).toEqual([
      { k: "tomates", q: 1, u: "kg" },
    ]);
  });

  it("un article créé à la main voyage avec sa description, sa catégorie et son unité", async () => {
    const sender = await seeded();
    const now = Date.now();
    const category: Category = {
      id: "cat",
      createdAt: now,
      updatedAt: now,
      slug: "vrac",
      name: "Vrac",
      color: "vert",
      useIconAsFallback: true,
      isSystem: false,
    };
    const unit: Unit = {
      id: "bocal",
      createdAt: now,
      updatedAt: now,
      slug: "bocal",
      singular: "bocal",
      plural: "bocaux",
      dimension: "other",
      step: 1,
      aliases: [],
    };
    const article: Article = {
      id: "lentilles-vrac",
      createdAt: now,
      updatedAt: now,
      slug: "sirop-de-sureau-maison",
      name: "Sirop de sureau maison",
      categoryId: "cat",
      defaultUnitId: "bocal",
      types: [],
      aliases: ["sureau"],
      icon: "sirop",
      favorite: false,
      barcodes: [],
      notDuplicateOf: [],
    };
    await sender.categories.add(category);
    await sender.units.add(unit);
    await sender.articles.add(article);
    await add(sender, article, 2);

    const recipient = await seeded();
    const shared = await share(sender);
    const lines = resolveImport(shared, await context(recipient));
    expect(lines[0]?.match.kind).toBe("unknown");
    const { listId } = await applyImport(recipient, lines, [], {
      kind: "new",
      name: shared.n,
    });
    const [line] = await activeItems(recipient, listId);
    const created = await recipient.articles.get(line?.articleId ?? "");
    expect(created?.name).toBe("Sirop de sureau maison");
    expect(created?.aliases).toEqual(["sureau"]);
    expect(
      (await recipient.categories.get(created?.categoryId ?? ""))?.name,
    ).toBe("Vrac");
    expect((await recipient.units.get(line?.unitId ?? ""))?.plural).toBe(
      "bocaux",
    );
    expect(line?.quantity).toBe(2);
  });
});

describe("resolveImport (docs/02 § 9)", () => {
  it("reconnaît par la clé catalogue, même renommé chez le destinataire", async () => {
    const sender = await seeded();
    await add(sender, await byKey(sender, "coca-cola"), 2);
    const recipient = await seeded();
    const coca = await byKey(recipient, "coca-cola");
    await recipient.articles.update(coca.id, { name: "Coca", slug: "coca" });
    const [line] = resolveImport(await share(sender), await context(recipient));
    expect(line?.match).toEqual({ kind: "known", articleId: coca.id });
  });

  it("alias croisés : « Coca » créé à la main = Coca-Cola", async () => {
    const recipient = await seeded();
    const coca = await byKey(recipient, "coca-cola");
    const shared: SharedList = {
      v: 1,
      l: "fr",
      n: "Courses",
      i: [
        {
          n: "Coca",
          a: { c: "jus-sodas", u: "bouteille" },
          q: 1,
          u: "bouteille",
        },
      ],
    };
    const [line] = resolveImport(shared, await context(recipient));
    expect(line?.match).toEqual({ kind: "known", articleId: coca.id });
  });

  it("le catalogue sert de dictionnaire : « Peanut butter » → Beurre de cacahuète, même renommé", async () => {
    const recipient = await seeded();
    const butter = await byKey(recipient, "beurre-de-cacahuete");
    await recipient.articles.update(butter.id, {
      name: "Pâte d'arachide",
      slug: "pate-d-arachide",
      aliases: [],
    });
    const shared: SharedList = {
      v: 1,
      l: "en",
      n: "Groceries",
      i: [
        {
          n: "Peanut butter",
          a: { c: "autres", u: "piece" },
          q: 1,
          u: "piece",
        },
      ],
    };
    const [line] = resolveImport(shared, await context(recipient));
    expect(line?.match).toEqual({ kind: "known", articleId: butter.id });
  });

  it("un article du catalogue supprimé chez le destinataire est recréé tel que le catalogue le décrit", async () => {
    const recipient = await seeded();
    const tomatoes = await byKey(recipient, "tomates");
    await recipient.articles.delete(tomatoes.id);
    const shared: SharedList = {
      v: 1,
      l: "fr",
      n: "Courses",
      i: [{ k: "tomates", q: 1, u: "kg" }],
    };
    const lines = resolveImport(shared, await context(recipient));
    expect(lines[0]?.match.kind).toBe("unknown");
    expect(lines[0]?.received).toMatchObject({
      name: "Tomates",
      catalogKey: "tomates",
      icon: "tomates",
    });
    const { listId } = await applyImport(recipient, lines, [], {
      kind: "list",
      listId: (await recipient.lists.toArray())[0]?.id ?? "",
    });
    const [line] = await activeItems(recipient, listId);
    expect(
      (await recipient.articles.get(line?.articleId ?? ""))?.catalogKey,
    ).toBe("tomates");
  });

  it("une faute de frappe est proposée, à confirmer", async () => {
    const recipient = await seeded();
    const tomatoes = await byKey(recipient, "tomates");
    const shared: SharedList = {
      v: 1,
      l: "fr",
      n: "Courses",
      i: [{ n: "Tomatess", a: { c: "legumes", u: "kg" }, q: 1, u: "kg" }],
    };
    const [line] = resolveImport(shared, await context(recipient));
    expect(line?.match).toEqual({ kind: "probable", articleId: tomatoes.id });
  });

  it("candidats : même icône et même catégorie d'abord, puis même icône, puis même catégorie", () => {
    const articles = [
      { id: "a", name: "A", icon: "pot", categoryId: "autre" },
      { id: "b", name: "B", icon: "pot", categoryId: "confitures" },
      { id: "c", name: "C", icon: "miel", categoryId: "confitures" },
      { id: "d", name: "D", icon: "miel", categoryId: "confitures" },
      { id: "e", name: "E", icon: "pain", categoryId: "pain" },
    ];
    expect(
      suggestCandidates(
        { icon: "pot", categoryId: "confitures" },
        articles,
        new Map([["d", 3]]),
      ),
    ).toEqual(["b", "a", "d", "c"]);
  });
});

describe("import et associations", () => {
  it("« C'est celui-là » mémorise le libellé reçu ; la fois suivante, il est reconnu", async () => {
    const recipient = await seeded();
    const butter = await byKey(recipient, "beurre-de-cacahuete");
    const shared: SharedList = {
      v: 1,
      l: "fr",
      n: "Courses",
      i: [
        {
          n: "Pâte à tartiner arachide",
          a: { c: "confitures-tartiner", u: "pot" },
          q: 1,
          u: "pot",
        },
      ],
    };
    const lines = resolveImport(shared, await context(recipient));
    expect(lines[0]?.match.kind).toBe("unknown");
    await applyImport(
      recipient,
      lines,
      [{ kind: "use", articleId: butter.id }],
      {
        kind: "new",
        name: "Courses",
      },
    );
    expect((await recipient.articles.get(butter.id))?.aliases).toContain(
      slugify("Pâte à tartiner arachide"),
    );
    const again = resolveImport(shared, await context(recipient));
    expect(again[0]?.match).toEqual({ kind: "known", articleId: butter.id });
  });

  it("un libellé reçu qui désigne déjà un autre article ne devient pas un alias", async () => {
    const recipient = await seeded();
    const potatoes = await byKey(recipient, "pommes-de-terre");
    const lines = textImportLines("pommes", await context(recipient));
    await applyImport(
      recipient,
      lines,
      [{ kind: "use", articleId: potatoes.id }],
      { kind: "new", name: "Courses" },
    );
    expect((await recipient.articles.get(potatoes.id))?.aliases).not.toContain(
      "pommes",
    );
  });

  it("fusion dans une liste existante : les quantités s'additionnent, les types acceptés rejoignent l'article", async () => {
    const recipient = await seeded();
    const tomatoes = await byKey(recipient, "tomates");
    await add(recipient, tomatoes, 1);
    const listId = (await recipient.lists.toArray())[0]?.id ?? "";
    const shared: SharedList = {
      v: 1,
      l: "fr",
      n: "Courses",
      i: [
        { k: "tomates", q: 0.5, u: "kg" },
        { k: "pommes", q: 1, u: "kg", t: ["Pink Lady"] },
      ],
    };
    const lines = resolveImport(shared, await context(recipient));
    await applyImport(recipient, lines, [], { kind: "list", listId });
    const items = await activeItems(recipient, listId);
    expect(items.find((i) => i.articleId === tomatoes.id)?.quantity).toBe(1.5);
    const apples = await byKey(recipient, "pommes");
    expect(apples.types).toContain("Pink Lady");
    expect(items.find((i) => i.articleId === apples.id)?.acceptedTypes).toEqual(
      ["Pink Lady"],
    );
  });
});

describe("coller une liste en texte (docs/03 A8)", () => {
  it("lit chaque ligne comme la saisie ; les lignes à puces seules si le texte en a", async () => {
    const recipient = await seeded();
    const lines = textImportLines(
      "Liste 1 (3 articles)\n\nLégumes\n• Tomates 1 kg\n• Pommes × 6 (Gala uniquement)\n\nAutres\n• Friteuse",
      await context(recipient),
    );
    expect(lines.map((line) => line.received.label)).toEqual([
      "Tomates",
      "Pommes",
      "Friteuse",
    ]);
    expect(lines.map((line) => line.match.kind)).toEqual([
      "known",
      "known",
      "unknown",
    ]);
    const listId = (await recipient.lists.toArray())[0]?.id ?? "";
    await applyImport(recipient, lines, [], { kind: "list", listId });
    const items = await activeItems(recipient, listId);
    const apples = await byKey(recipient, "pommes");
    const piece = await recipient.units.where("slug").equals("piece").first();
    expect(items.find((i) => i.articleId === apples.id)).toMatchObject({
      quantity: 6,
      unitId: piece?.id,
    });
    expect(
      (await recipient.articles.where("slug").equals("friteuse").first())?.name,
    ).toBe("Friteuse");
  });

  it("un texte sans puces : une ligne par article, et la saisie naturelle sur chaque ligne", async () => {
    const recipient = await seeded();
    const lines = textImportLines(
      "2 baguettes\ndu beurre et 6 œufs",
      await context(recipient),
    );
    expect(lines.map((line) => line.received.label)).toEqual([
      "baguettes",
      "beurre",
      "œufs",
    ]);
  });

  it("la mise en forme d'une messagerie et les séparateurs sont retirés avant la lecture", async () => {
    const recipient = await seeded();
    const lines = textImportLines(
      "*Courses samedi*\npain\n-----\n_lait_\n* beurre",
      await context(recipient),
    );
    expect(lines.map((line) => line.received.label)).toEqual(["beurre"]);
    const plain = textImportLines(
      "*Courses samedi*\npain\n-----\n_lait_ ~frais~",
      await context(recipient),
    );
    expect(plain.map((line) => line.received.label)).toEqual([
      "Courses samedi",
      "pain",
      "lait frais",
    ]);
  });

  it("une liste numérotée : le numéro est une puce, pas une quantité", async () => {
    const recipient = await seeded();
    const lines = textImportLines(
      "Pour la tarte :\n1. 2,5 kg de farine\n2. beurre",
      await context(recipient),
    );
    expect(lines.map((line) => line.received.label)).toEqual([
      "farine",
      "beurre",
    ]);
    expect(lines[0]?.amount).toMatchObject({
      entry: { quantity: 2.5, unitSlug: "kg" },
    });
  });
});
