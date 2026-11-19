import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { categoriesData, keywordRules, unitsData } from "@/data";
import { catalogData } from "@/data/catalog";
import { ShoppingDatabase } from "@/db/database";
import { addListItem } from "@/db/items";
import { activeItems } from "@/db/items";
import { seedDatabase } from "@/db/seed";
import { createRecipe } from "@/db/recipes";
import { applyImport, applyRecipeImport } from "@/db/share";
import type { Article, Category, ID, ListItem, Unit } from "@/domain/model";
import {
  buildImportCatalog,
  buildSharedList,
  buildSharedRecipe,
  canKeep,
  defaultChoice,
  findShared,
  receivedRecipe,
  resolveImport,
  shareLink,
  suggestCandidates,
  textImportLines,
  type ImportContext,
  type Shared,
  type ShareSource,
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

async function shareSource(db: ShoppingDatabase): Promise<ShareSource> {
  const map = <T extends { id: ID }>(rows: T[]) =>
    new Map(rows.map((row) => [row.id, row]));
  return {
    articleById: map<Article>(await db.articles.toArray()),
    categoryById: map<Category>(await db.categories.toArray()),
    unitById: map<Unit>(await db.units.toArray()),
  };
}

/** La liste partagée par `db` : ses lignes à acheter. */
async function share(db: ShoppingDatabase): Promise<SharedList> {
  const list = await db.lists.orderBy("position").first();
  if (!list) throw new Error("liste");
  return buildSharedList(
    list.name,
    await activeItems(db, list.id),
    await shareSource(db),
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
    expect(findShared(message)).toEqual({ ...shared, c: [], u: [] });
  });

  it("un lien abîmé ou absent ne donne rien", () => {
    expect(findShared("Des tomates et du pain")).toBeUndefined();
    expect(findShared("https://exemple.fr/#/import?d=abc")).toBeUndefined();
  });

  it("un lien réencodé par une messagerie se relit ; un nom vide est écarté", () => {
    const shared: SharedList = {
      v: 1,
      type: "list",
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
    expect(findShared(reencoded)?.i).toEqual([{ k: "tomates", q: 1, u: "kg" }]);
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
      notDuplicateOf: [],
    };
    await sender.categories.add(category);
    await sender.units.add(unit);
    await sender.articles.add(article);
    await add(sender, article, 2);

    const shared = await share(sender);

    // Par défaut, juste cette fois : « Achats ponctuels », sa catégorie n'est pas créée.
    const once = await seeded();
    const onceLines = resolveImport(shared, await context(once));
    expect(onceLines[0]?.match.kind).toBe("unknown");
    const first = await applyImport(once, onceLines, [], {
      kind: "new",
      name: shared.n,
    });
    const [oneOff] = await activeItems(once, first.listId);
    const kept = await once.articles.get(oneOff?.articleId ?? "");
    expect(
      (await once.categories.get(kept?.categoryId ?? ""))?.catalogKey,
    ).toBe("achats-ponctuels");
    expect(await once.categories.where("slug").equals("vrac").count()).toBe(0);

    // Gardé dans le catalogue : sa catégorie et son unité sont créées.
    const recipient = await seeded();
    const lines = resolveImport(shared, await context(recipient));
    const { listId } = await applyImport(
      recipient,
      lines,
      [{ kind: "create", name: "Sirop de sureau maison", oneOff: false }],
      { kind: "new", name: shared.n },
    );
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
      type: "list",
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
      type: "list",
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
      type: "list",
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
    const created = await recipient.articles.get(line?.articleId ?? "");
    expect(created?.catalogKey).toBe("tomates");
    // Sa vraie catégorie, pas « Achats ponctuels ».
    expect(
      (await recipient.categories.get(created?.categoryId ?? ""))?.catalogKey,
    ).toBe(catalog.articles.get("tomates")?.category.catalogKey);
  });

  it("un achat ponctuel de l'expéditeur reste un achat ponctuel chez le destinataire", async () => {
    const recipient = await seeded();
    const shared: SharedList = {
      v: 1,
      type: "list",
      l: "fr",
      n: "Courses",
      i: [
        {
          n: "Friteuse",
          a: { c: "achats-ponctuels", u: "piece" },
          q: 1,
          u: "piece",
        },
      ],
    };
    const lines = resolveImport(shared, await context(recipient));
    const [line] = lines;
    if (!line) throw new Error("ligne");
    expect(canKeep(line)).toBe(false);
    expect(defaultChoice(line)).toMatchObject({ kind: "create", oneOff: true });
    const { listId } = await applyImport(recipient, lines, [], {
      kind: "new",
      name: shared.n,
    });
    const [item] = await activeItems(recipient, listId);
    const created = await recipient.articles.get(item?.articleId ?? "");
    expect(
      (await recipient.categories.get(created?.categoryId ?? ""))?.catalogKey,
    ).toBe("achats-ponctuels");
  });

  it("une faute de frappe est proposée, à confirmer", async () => {
    const recipient = await seeded();
    const tomatoes = await byKey(recipient, "tomates");
    const shared: SharedList = {
      v: 1,
      type: "list",
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
      type: "list",
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
      type: "list",
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

  it("une liste à puces sur une seule ligne se découpe ; une autre puce reste dans l'article", async () => {
    const recipient = await seeded();
    const collapsed = textImportLines(
      "- 200 g de beurre - 3 cl de lait",
      await context(recipient),
    );
    expect(collapsed.map((line) => line.received.label)).toEqual([
      "beurre",
      "lait",
    ]);
    const dashed = textImportLines(
      "• Lait - 2 L\n• Jambon : 4 tranches",
      await context(recipient),
    );
    expect(dashed.map((line) => line.received.label)).toEqual([
      "Lait",
      "Jambon",
    ]);
    expect(dashed[0]?.amount).toMatchObject({
      entry: { quantity: 2, unitSlug: "l" },
    });
  });
});

describe("partage d'une recette (docs/03 E3)", () => {
  it("voyage avec son rendement, son icône, ses étapes et ses ingrédients ; le destinataire la crée", async () => {
    const sender = await seeded();
    const tomates = await byKey(sender, "tomates");
    const now = Date.now();
    const sauce: Article = {
      ...tomates,
      id: "sauce",
      createdAt: now,
      updatedAt: now,
      slug: "sauce-secrete",
      name: "Sauce secrète",
      aliases: [],
      types: [],
      catalogKey: undefined,
    };
    await sender.articles.add(sauce);
    const steps = "## Préparer\n- **Couper** les tomates";
    const id = await createRecipe(sender, {
      name: "Raclette",
      icon: "fromage",
      yield: { quantity: 4, unit: "personnes" },
      ingredients: [
        {
          articleId: tomates.id,
          quantity: 0.5,
          unitId: tomates.defaultUnitId,
          acceptedTypes: ["grappe"],
          optional: false,
          fixed: true,
        },
        {
          articleId: sauce.id,
          quantity: 1,
          unitId: tomates.defaultUnitId,
          acceptedTypes: [],
          optional: true,
          fixed: false,
        },
      ],
      steps,
    });
    const recipe = await sender.recipes.get(id);
    if (!recipe) throw new Error("recette");
    const shared = buildSharedRecipe(recipe, await shareSource(sender));
    expect(shared).toMatchObject({
      type: "recipe",
      n: "Raclette",
      y: { q: 4, u: "personnes" },
      ic: "fromage",
      s: steps,
    });
    expect(shared.i[0]).toEqual({
      k: "tomates",
      q: 0.5,
      u: "kg",
      t: ["grappe"],
      fx: 1,
    });
    expect(shared.i[1]).toMatchObject({ n: "Sauce secrète", op: 1 });
    const found = findShared(
      `Raclette\n${shareLink("https://exemple.fr/", shared)}`,
    );
    expect(found).toEqual({ ...shared, c: [], u: [] });
    if (found?.type !== "recipe") throw new Error("recette");

    // Le destinataire a déjà une « Raclette » : la reçue ne la remplace pas.
    const recipient = await seeded();
    await createRecipe(recipient, {
      name: "Raclette",
      yield: { quantity: 2, unit: "personnes" },
      ingredients: [],
    });
    const lines = resolveImport(found, await context(recipient));
    expect(lines.map((line) => line.ingredient)).toEqual([
      { optional: false, fixed: true },
      { optional: true, fixed: false },
    ]);
    // Un ingrédient inconnu est gardé dans le catalogue : la recette resservira.
    const sauceLine = lines[1];
    if (!sauceLine) throw new Error("ingrédient");
    expect(defaultChoice(sauceLine)).toEqual({
      kind: "create",
      name: "Sauce secrète",
      oneOff: false,
    });
    const result = await applyRecipeImport(
      recipient,
      receivedRecipe(found),
      lines,
      [],
    );
    expect(result).toMatchObject({ name: "Raclette (2)", count: 2 });
    const created = await recipient.recipes.get(result.recipeId);
    expect(created).toMatchObject({
      name: "Raclette (2)",
      icon: "fromage",
      yield: { quantity: 4, unit: "personnes" },
      steps,
    });
    const [first, second] = created?.ingredients ?? [];
    expect(first).toMatchObject({
      articleId: (await byKey(recipient, "tomates")).id,
      quantity: 0.5,
      acceptedTypes: ["grappe"],
      optional: false,
      fixed: true,
    });
    const article = await recipient.articles.get(second?.articleId ?? "");
    expect(article?.name).toBe("Sauce secrète");
    expect(article?.categoryId).toBe(
      (await byKey(recipient, "tomates")).categoryId,
    );
    expect(second).toMatchObject({ optional: true, fixed: false });
  });

  it("un lien sans type, ou une recette sans rendement, ne donne rien", () => {
    const link = (value: unknown) =>
      shareLink("https://exemple.fr/", value as Shared);
    const list = { v: 1, l: "fr", n: "Courses", i: [] };
    expect(findShared(link(list))).toBeUndefined();
    expect(findShared(link({ ...list, type: "menu" }))).toBeUndefined();
    expect(findShared(link({ ...list, type: "recipe" }))).toBeUndefined();
    expect(
      findShared(link({ ...list, type: "recipe", y: { q: 0, u: "parts" } })),
    ).toBeUndefined();
    expect(findShared(link({ ...list, type: "list" }))?.type).toBe("list");
  });
});
