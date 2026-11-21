import type { ID, Settings } from "@/domain/model";
import { dismissSuggestion } from "@/domain/suggestions";
import type { ShoppingDatabase } from "./database";

/** Réglages de l'utilisateur (table `meta`, docs/07 § 5). */
export async function getSettings(
  database: ShoppingDatabase,
): Promise<Settings | undefined> {
  return (await database.meta.get("settings"))?.value;
}

/** « Pas cette fois » sur une suggestion anti-oubli (docs/03 D1). */
export async function dismissRestock(
  database: ShoppingDatabase,
  articleId: ID,
  lastClosedAt: number | undefined,
  now = Date.now(),
): Promise<void> {
  await updateSettings(database, (current) => ({
    dismissedSuggestions: dismissSuggestion(
      current.dismissedSuggestions,
      articleId,
      lastClosedAt,
      now,
    ),
  }));
}

/**
 * Change des réglages : `changes`, ou une fonction des réglages actuels (lus dans la
 * même transaction).
 */
export async function updateSettings(
  database: ShoppingDatabase,
  changes: Partial<Settings> | ((current: Settings) => Partial<Settings>),
): Promise<void> {
  await database.transaction("rw", database.meta, async () => {
    const current = await getSettings(database);
    if (!current) return;
    await database.meta.put({
      key: "settings",
      value: {
        ...current,
        ...(typeof changes === "function" ? changes(current) : changes),
      },
    });
  });
}
