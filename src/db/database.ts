import { Dexie, type EntityTable, type Table } from "dexie";
import type {
  Aisle,
  Article,
  ArticleAisleOverride,
  Category,
  ListItem,
  Purchase,
  Recipe,
  Settings,
  ShoppingList,
  ShoppingSession,
  Store,
  Unit,
} from "@/domain/model";
import { clearTemplateAisleName } from "./migrations";

/** Tables et index du schéma (version 1). */
export const SCHEMA_V1 = {
  units: "id, &slug",
  categories: "id, &slug",
  articles: "id, &slug, *aliases, categoryId, favorite, *barcodes, catalogKey",
  stores: "id",
  aisles: "id, storeId",
  overrides: "id, [storeId+articleId]",
  lists: "id, position",
  items: "id, listId, articleId, closedInSessionId",
  recipes: "id",
  sessions: "id, listId, storeId, status, startedAt",
  purchases: "id, sessionId, storeId, articleId, at",
  meta: "key",
} as const;

/** Ligne de la table `meta` : réglages, version du catalogue… */
export interface MetaRow {
  key: "settings";
  value: Settings;
}

/**
 * Base de données locale (docs/07 § 5). La version du schéma est indépendante de
 * la version de l'app : toute évolution = nouvelle `version(n)` + `upgrade` + test.
 */
export class ShoppingDatabase extends Dexie {
  units!: EntityTable<Unit, "id">;
  categories!: EntityTable<Category, "id">;
  articles!: EntityTable<Article, "id">;
  stores!: EntityTable<Store, "id">;
  aisles!: EntityTable<Aisle, "id">;
  overrides!: EntityTable<ArticleAisleOverride, "id">;
  lists!: EntityTable<ShoppingList, "id">;
  items!: EntityTable<ListItem, "id">;
  recipes!: EntityTable<Recipe, "id">;
  sessions!: EntityTable<ShoppingSession, "id">;
  purchases!: EntityTable<Purchase, "id">;
  meta!: Table<MetaRow, string>;

  constructor(name = "shoppinglist") {
    super(name);
    this.version(1).stores(SCHEMA_V1);
    // Version 2 : mêmes tables ; rayons numérotés, nom de modèle retiré (migrations.ts).
    this.version(2)
      .stores(SCHEMA_V1)
      .upgrade((tx) =>
        tx
          .table<Aisle, string>("aisles")
          .toCollection()
          .modify((aisle) => {
            clearTemplateAisleName(aisle);
          }),
      );
  }
}

/** Base de l'app. Les tests créent leurs propres bases. */
export const db = new ShoppingDatabase();
