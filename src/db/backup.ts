import type { Aisle } from "@/domain/model";
import type { ShoppingDatabase } from "./database";
import { clearTemplateAisleName } from "./migrations";

/**
 * Sauvegarde (docs/03 H4, docs/07 § 5) : toutes les données de l'app dans un fichier
 * JSON — listes, magasins et rayons, articles, catégories, unités, historique, réglages
 * de l'app. Les préférences de l'appareil (sons, thème…) n'en font pas partie.
 * Import en **remplacement** : la base est vidée puis remplie, en une seule transaction.
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
    !TABLES.every((name) => Array.isArray(backup.tables?.[name]))
  )
    return { kind: "invalid" };
  // Fichier venant d'une version plus récente de l'app : on ne sait pas le lire.
  if (backup.format > BACKUP_FORMAT || backup.schema > schema)
    return { kind: "newer" };
  const full = backup as Backup;
  return {
    kind: "ok",
    backup: full,
    summary: {
      exportedAt: full.exportedAt,
      articles: full.tables.articles.length,
      lists: full.tables.lists.length,
      stores: full.tables.stores.length,
    },
  };
}

/**
 * Remplace toutes les données par celles de la sauvegarde. Un fichier d'un schéma plus
 * ancien passe d'abord par les mêmes migrations que la base (migrations.ts).
 */
export async function importBackup(
  database: ShoppingDatabase,
  backup: Backup,
): Promise<void> {
  const tables = { ...backup.tables };
  if (backup.schema < 2)
    tables.aisles = (tables.aisles as Aisle[]).map((aisle) => {
      const copy = { ...aisle };
      clearTemplateAisleName(copy);
      return copy;
    });
  await database.transaction("rw", database.tables, async () => {
    for (const name of TABLES) {
      const table = database.table(name);
      await table.clear();
      await table.bulkAdd(tables[name]);
    }
  });
}

/** Nom du fichier : shoppinglist-2026-11-13.json */
export function backupFileName(at: number): string {
  const date = new Date(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `shoppinglist-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}
