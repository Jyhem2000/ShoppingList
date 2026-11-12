import type { Article, Category, ID, Store } from "@/domain/model";
import { slugify } from "@/domain/slug";
import type { ShoppingDatabase } from "./database";
import { buildStore } from "./stores";

/**
 * Articles et magasins créés par l'utilisateur (docs/03 A4, B5). L'édition complète
 * (fiches article, catégories, rayons) arrive en phase 6.
 */
export interface NewArticle {
  name: string;
  categoryId: ID;
  defaultUnitId: ID;
  icon?: string;
}

export type CreateArticleResult =
  | { kind: "created"; article: Article }
  /** Même slug qu'un article existant (variation d'écriture) : on propose celui-ci. */
  | { kind: "exists"; article: Article };

export async function createArticle(
  database: ShoppingDatabase,
  input: NewArticle,
  now = Date.now(),
): Promise<CreateArticleResult> {
  return database.transaction("rw", database.articles, async () => {
    const slug = slugify(input.name);
    const existing = await database.articles.where("slug").equals(slug).first();
    if (existing) return { kind: "exists", article: existing };
    const article: Article = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      slug,
      name: input.name.trim(),
      categoryId: input.categoryId,
      defaultUnitId: input.defaultUnitId,
      types: [],
      aliases: [],
      icon: input.icon,
      favorite: false,
      barcodes: [],
      notDuplicateOf: [],
    };
    await database.articles.add(article);
    return { kind: "created", article };
  });
}

/** Nouveau type ajouté à la volée depuis une ligne (docs/02 § 6). */
export async function addArticleType(
  database: ShoppingDatabase,
  articleId: ID,
  type: string,
): Promise<void> {
  await database.transaction("rw", database.articles, async () => {
    const article = await database.articles.get(articleId);
    const clean = type.trim();
    if (!article || !clean) return;
    if (article.types.some((t) => slugify(t) === slugify(clean))) return;
    await database.articles.update(articleId, {
      types: [...article.types, clean],
      updatedAt: Date.now(),
    });
  });
}

/** Magasin créé à partir d'un modèle (docs/02 § 4). */
export async function createStoreFromTemplate(
  database: ShoppingDatabase,
  templateKey: string,
  name: string,
  now = Date.now(),
): Promise<Store> {
  return database.transaction(
    "rw",
    database.stores,
    database.aisles,
    database.categories,
    async () => {
      const categories: Category[] = await database.categories.toArray();
      const { store, aisles } = buildStore(templateKey, name, categories, now);
      await database.stores.add(store);
      await database.aisles.bulkAdd(aisles);
      return store;
    },
  );
}

/** Change la catégorie d'un article (achat ponctuel gardé dans le catalogue). */
export async function setArticleCategory(
  database: ShoppingDatabase,
  articleId: ID,
  categoryId: ID,
  now = Date.now(),
): Promise<void> {
  await database.articles.update(articleId, { categoryId, updatedAt: now });
}
