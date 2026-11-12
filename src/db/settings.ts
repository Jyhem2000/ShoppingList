import type { Settings } from "@/domain/model";
import type { ShoppingDatabase } from "./database";

/** Réglages de l'utilisateur (table `meta`, docs/07 § 5). */
export async function getSettings(
  database: ShoppingDatabase,
): Promise<Settings | undefined> {
  return (await database.meta.get("settings"))?.value;
}

export async function updateSettings(
  database: ShoppingDatabase,
  changes: Partial<Settings>,
): Promise<void> {
  await database.transaction("rw", database.meta, async () => {
    const current = await getSettings(database);
    if (!current) return;
    await database.meta.put({
      key: "settings",
      value: { ...current, ...changes },
    });
  });
}
