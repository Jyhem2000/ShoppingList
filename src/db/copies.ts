import type { ID } from "@/domain/model";
import {
  type Backup,
  type BackupSummary,
  exportBackup,
  importBackup,
  summarizeBackup,
} from "./backup";
import type { ShoppingDatabase } from "./database";

/**
 * Copies automatiques internes (docs/03 H4) : une par jour, au premier lancement de la
 * journée (ou au retour dans l'app), les 7 dernières gardées. Elles vivent dans la même
 * base que les données : elles protègent d'une fausse manipulation, d'un import ou
 * d'une mise à jour, pas de la suppression de l'app (pour ça : exporter un fichier).
 */
export interface AutoCopy {
  id: ID;
  at: number;
  /** Jour local de la copie (AAAA-MM-JJ) : une seule par jour. */
  day: string;
  summary: BackupSummary;
  backup: Backup;
}

export const COPIES_KEPT = 7;

/** Jour local (le téléphone), pas UTC : une copie par journée vécue. */
export function dayKey(at: number): string {
  const date = new Date(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Fait la copie du jour si elle n'existe pas encore. Renvoie `true` si une copie a été faite. */
export async function takeDailyCopy(
  database: ShoppingDatabase,
  now = Date.now(),
): Promise<boolean> {
  return database.transaction("rw", database.tables, async () => {
    const day = dayKey(now);
    const latest = await database.copies.orderBy("at").last();
    if (latest?.day === day) return false;
    const backup = await exportBackup(database, now);
    await database.copies.add({
      id: crypto.randomUUID(),
      at: now,
      day,
      summary: summarizeBackup(backup),
      backup,
    });
    const extra = (
      await database.copies.orderBy("at").reverse().primaryKeys()
    ).slice(COPIES_KEPT);
    await database.copies.bulkDelete(extra);
    return true;
  });
}

/** Les copies, de la plus récente à la plus ancienne. */
export async function listCopies(
  database: ShoppingDatabase,
): Promise<AutoCopy[]> {
  return database.copies.orderBy("at").reverse().toArray();
}

/** Remplace toutes les données par celles d'une copie (les copies, elles, restent). */
export async function restoreCopy(
  database: ShoppingDatabase,
  id: ID,
): Promise<boolean> {
  const copy = await database.copies.get(id);
  if (!copy) return false;
  await importBackup(database, copy.backup);
  return true;
}
