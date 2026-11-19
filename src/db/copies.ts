import type { ID } from "@/domain/model";
import {
  type Backup,
  type BackupSummary,
  dayKey,
  exportBackup,
  importBackup,
  summarizeBackup,
} from "./backup";
import type { ShoppingDatabase } from "./database";

/**
 * Copies automatiques internes (docs/03 H4) : une par jour, au premier lancement de la
 * journée (ou au retour dans l'app), et une juste avant chaque restauration ou import ;
 * les 7 dernières gardées. Elles vivent dans la même base que les données : elles
 * protègent d'une fausse manipulation, d'un import ou d'une mise à jour, pas de la
 * suppression de l'app (pour ça : exporter un fichier).
 *
 * Deux tables : `copies` (date et résumé, pour la liste de l'écran Sauvegarde) et
 * `copyBackups` (les données complètes, lues seulement pour restaurer).
 */
export interface AutoCopy {
  id: ID;
  at: number;
  /** Jour local de la copie (AAAA-MM-JJ). */
  day: string;
  summary: BackupSummary;
  /** Copie faite juste avant de tout remplacer (restauration ou import). */
  beforeReplace?: boolean;
}

/** Données complètes d'une copie (même `id` que dans `copies`). */
export interface CopyBackup {
  id: ID;
  backup: Backup;
}

export const COPIES_KEPT = 7;

export { dayKey };

/** Jour de la dernière copie connue, par base : évite de rouvrir la base à chaque retour dans l'app. */
const copiedDay = new Map<string, string>();

/** Enregistre une copie de `backup` ; `keep` : copie qu'on restaure, gardée même si c'est la plus ancienne. */
async function addCopy(
  database: ShoppingDatabase,
  backup: Backup,
  now: number,
  beforeReplace: boolean,
  keep?: ID,
): Promise<void> {
  const id = crypto.randomUUID();
  await database.copies.add({
    id,
    at: now,
    day: dayKey(now),
    summary: summarizeBackup(backup),
    ...(beforeReplace && { beforeReplace }),
  });
  await database.copyBackups.add({ id, backup });
  const ids = await database.copies.orderBy("at").reverse().primaryKeys();
  const extra = ids
    .filter((other) => other !== keep)
    .slice(keep && ids.includes(keep) ? COPIES_KEPT - 1 : COPIES_KEPT);
  await database.copies.bulkDelete(extra);
  await database.copyBackups.bulkDelete(extra);
}

/** Copie du jour en cours, par base : le retour dans l'app pendant le lancement n'en refait pas une. */
const copying = new Map<string, Promise<boolean>>();

/**
 * Fait la copie du jour si elle n'existe pas encore. Renvoie `true` si une copie a été
 * faite. L'export se fait en lecture seule : les écrans lisent leurs données pendant ce
 * temps ; seules les tables des copies sont ensuite écrites.
 */
export function takeDailyCopy(
  database: ShoppingDatabase,
  now = Date.now(),
): Promise<boolean> {
  const day = dayKey(now);
  const name = database.name;
  if (copiedDay.get(name) === day) return Promise.resolve(false);
  const running = copying.get(name);
  if (running) return running;
  const copiedToday = async () =>
    (await database.copies.orderBy("at").last())?.day === day;
  const copy = (async () => {
    if (await copiedToday()) return false;
    const backup = await exportBackup(database, now);
    return database.transaction(
      "rw",
      [database.copies, database.copyBackups],
      async () => {
        if (await copiedToday()) return false;
        await addCopy(database, backup, now, false);
        return true;
      },
    );
  })()
    .then((made) => {
      copiedDay.set(name, day);
      return made;
    })
    .finally(() => copying.delete(name));
  copying.set(name, copy);
  return copy;
}

/** Les copies, de la plus récente à la plus ancienne (dates et résumés seulement). */
export async function listCopies(
  database: ShoppingDatabase,
): Promise<AutoCopy[]> {
  return database.copies.orderBy("at").reverse().toArray();
}

/**
 * Remplace toutes les données par celles d'une sauvegarde (fichier, texte collé ou
 * copie), après avoir copié les données actuelles : rien de ce qui a été fait depuis la
 * copie du jour n'est perdu. Tout ou rien : en cas d'échec, les données ne changent pas.
 */
export async function replaceAllData(
  database: ShoppingDatabase,
  backup: Backup,
  now = Date.now(),
  keep?: ID,
): Promise<void> {
  await database.transaction("rw", database.tables, async () => {
    await addCopy(database, await exportBackup(database, now), now, true, keep);
    await importBackup(database, backup);
  });
}

/** Revient à une copie (les copies, elles, restent). */
export async function restoreCopy(
  database: ShoppingDatabase,
  id: ID,
  now = Date.now(),
): Promise<boolean> {
  const copy = await database.copyBackups.get(id);
  if (!copy) return false;
  await replaceAllData(database, copy.backup, now, id);
  return true;
}
