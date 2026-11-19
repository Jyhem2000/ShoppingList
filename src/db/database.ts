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
import type { AutoCopy, CopyBackup } from "./copies";

/** Tables et index du schéma (version 1). */
export const SCHEMA_V1 = {
  units: "id, &slug",
  categories: "id, &slug",
  articles: "id, &slug, *aliases, categoryId, favorite, *barcodes, catalogKey",
  stores: "id",
  aisles: "id, storeId",
  // Aussi lu par magasin seul : `where("storeId")`, premier champ de l'index.
  overrides: "id, [storeId+articleId]",
  lists: "id, position",
  items: "id, listId, articleId, closedInSessionId",
  recipes: "id",
  sessions: "id, listId, storeId, status, startedAt",
  purchases: "id, sessionId, storeId, articleId, at",
  meta: "key",
} as const;

/** Version 3 : + copies automatiques internes (une par jour, 7 gardées). */
export const SCHEMA_V3 = { ...SCHEMA_V1, copies: "id, at" } as const;

/**
 * Version 4 : les données complètes des copies passent dans `copyBackups` ; `copies`
 * ne garde que la date et le résumé (l'écran Sauvegarde ne lit plus 7 bases entières).
 */
export const SCHEMA_V4 = { ...SCHEMA_V3, copyBackups: "id" } as const;

/** Version 5 : dernière session d'une liste lue directement (`latestSession`). */
export const SCHEMA_V5 = {
  ...SCHEMA_V4,
  sessions: "id, listId, storeId, status, startedAt, [listId+startedAt]",
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
  copies!: EntityTable<AutoCopy, "id">;
  copyBackups!: EntityTable<CopyBackup, "id">;

  constructor(name = "shoppinglist") {
    super(name);
    this.version(1).stores(SCHEMA_V1);
    // Version 2 : mêmes tables, aucune donnée modifiée. Elle a porté en préproduction une
    // migration des noms de rayons, retirée depuis (les magasins se construisent pendant
    // les courses) ; elle reste déclarée pour les bases déjà passées en version 2.
    this.version(2).stores(SCHEMA_V1);
    // Version 3 : table des copies automatiques (docs/03 H4). Nouvelle table vide, rien à
    // migrer : les données existantes restent telles quelles.
    this.version(3).stores(SCHEMA_V3);
    // Version 4 : nouvelle table des données complètes des copies. Pas de reprise des
    // anciennes copies : seulement des données d'essai avant la 0.9.0 (docs/07 § 5).
    this.version(4).stores(SCHEMA_V4);
    // Version 5 : nouvel index des sessions par liste et date ; aucune donnée modifiée.
    this.version(5).stores(SCHEMA_V5);
  }
}

/** Base de l'app. Les tests créent leurs propres bases. */
export const db = new ShoppingDatabase();
