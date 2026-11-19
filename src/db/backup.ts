import type { ShoppingDatabase } from "./database";
import { ensureUnsortedAisle } from "./stores";

/**
 * Sauvegarde (docs/03 H4, docs/07 § 5) : toutes les données de l'app dans un fichier
 * JSON — listes, magasins et rayons, articles, catégories, unités, historique, réglages
 * de l'app. Les préférences de l'appareil (sons, thème…) n'en font pas partie.
 * Import en **remplacement** : la base est vidée puis remplie, en une seule transaction.
 * Les copies automatiques (copies.ts) ne font pas partie du fichier et ne sont pas touchées.
 */

export const BACKUP_FORMAT = 1;

const TABLES = [
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
] as const;
type TableName = (typeof TABLES)[number];

/** Champs tableau sans lesquels les écrans cassent : vérifiés à la lecture. */
const ARRAY_FIELDS: Partial<Record<TableName, readonly string[]>> = {
  units: ["aliases"],
  articles: ["types", "aliases", "notDuplicateOf"],
  aisles: ["categories"],
  items: ["acceptedTypes", "fromRecipes"],
  recipes: ["ingredients"],
};

/** Forme minimale d'un enregistrement : un objet avec sa clé et ses tableaux. */
function wellFormed(name: TableName, record: unknown): boolean {
  if (!record || typeof record !== "object") return false;
  const fields = record as Record<string, unknown>;
  if (typeof fields[name === "meta" ? "key" : "id"] !== "string") return false;
  return (ARRAY_FIELDS[name] ?? []).every((field) =>
    Array.isArray(fields[field]),
  );
}

export interface Backup {
  app: "ShoppingList";
  format: number;
  /** Version du schéma de la base au moment de l'export. */
  schema: number;
  exportedAt: number;
  tables: Record<TableName, unknown[]>;
}

export async function exportBackup(
  database: ShoppingDatabase,
  now = Date.now(),
): Promise<Backup> {
  return database.transaction("r", database.tables, async () => {
    const tables = {} as Record<TableName, unknown[]>;
    for (const name of TABLES)
      tables[name] = await database.table(name).toArray();
    return {
      app: "ShoppingList",
      format: BACKUP_FORMAT,
      schema: database.verno,
      exportedAt: now,
      tables,
    };
  });
}

/** Résumé lisible d'une sauvegarde, avant de l'importer. */
export interface BackupSummary {
  exportedAt: number;
  articles: number;
  lists: number;
  stores: number;
}

export type ReadBackupResult =
  | { kind: "ok"; backup: Backup; summary: BackupSummary }
  | { kind: "invalid" }
  | { kind: "newer" };

/** Lit et vérifie un fichier de sauvegarde (texte JSON). */
export function readBackup(text: string, schema: number): ReadBackupResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { kind: "invalid" };
  }
  if (!data || typeof data !== "object") return { kind: "invalid" };
  const backup = data as Partial<Backup>;
  if (
    backup.app !== "ShoppingList" ||
    typeof backup.format !== "number" ||
    typeof backup.schema !== "number" ||
    !backup.tables ||
    !TABLES.every((name) => {
      const records = backup.tables?.[name];
      return (
        Array.isArray(records) &&
        records.every((record) => wellFormed(name, record))
      );
    })
  )
    return { kind: "invalid" };
  // Fichier venant d'une version plus récente de l'app : on ne sait pas le lire.
  if (backup.format > BACKUP_FORMAT || backup.schema > schema)
    return { kind: "newer" };
  const full = backup as Backup;
  return { kind: "ok", backup: full, summary: summarizeBackup(full) };
}

/** Ce qu'une sauvegarde contient, en quelques nombres. */
export function summarizeBackup(backup: Backup): BackupSummary {
  return {
    exportedAt: backup.exportedAt,
    articles: backup.tables.articles.length,
    lists: backup.tables.lists.length,
    stores: backup.tables.stores.length,
  };
}

/**
 * Remplace toutes les données par celles de la sauvegarde. Un magasin sans rayon
 * « À placer » (fichier abîmé) le retrouve.
 */
export async function importBackup(
  database: ShoppingDatabase,
  backup: Backup,
): Promise<void> {
  await database.transaction("rw", database.tables, async () => {
    for (const name of TABLES) {
      const table = database.table(name);
      await table.clear();
      await table.bulkAdd(backup.tables[name]);
    }
    for (const id of await database.stores.toCollection().primaryKeys())
      await ensureUnsortedAisle(database, id);
  });
}

/** Jour local (le téléphone), pas UTC : AAAA-MM-JJ. */
export function dayKey(at: number): string {
  const date = new Date(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Nom du fichier : shoppinglist-2026-11-13.json */
export function backupFileName(at: number): string {
  return `shoppinglist-${dayKey(at)}.json`;
}
