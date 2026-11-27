import { categoriesData, unitsData } from "@/data";
import { catalogData } from "@/data/catalog";
import {
  languageOf,
  languages,
  type ByLanguage,
  type Language,
} from "@/domain/language";
import { languageChanges, type DefaultNames } from "@/domain/languageChange";
import { textsByLanguage } from "@/i18n";
import type { ID } from "@/domain/model";
import type { ShoppingDatabase } from "./database";
import { getSettings, updateSettings } from "./settings";

/** Noms donnés par l'app, dans chaque langue. */
const defaultNames = Object.fromEntries(
  languages.map((language) => {
    const t = textsByLanguage[language];
    return [
      language,
      {
        listName: t.defaults.listName,
        unsortedAisle: t.defaults.unsortedAisle,
        yieldUnits: t.recipes.yieldUnits,
      },
    ];
  }),
) as ByLanguage<DefaultNames>;

/**
 * Change la langue de l'app (docs/03 I3), en une seule transaction : renomme ce qui
 * vient du catalogue et n'a jamais été renommé, et les noms donnés par l'app, puis
 * enregistre la langue. L'app doit ensuite être rechargée.
 * Importé à la demande : le catalogue est un fichier à part.
 */
export async function changeLanguage(
  database: ShoppingDatabase,
  language: Language,
): Promise<void> {
  const tables = [
    database.articles,
    database.categories,
    database.units,
    database.lists,
    database.aisles,
    database.items,
    database.recipes,
    database.meta,
  ];
  await database.transaction("rw", tables, async () => {
    const settings = await getSettings(database);
    if (!settings) return;
    const from = languageOf(settings);
    const [articles, categories, units, lists, aisles, items, recipes] =
      await Promise.all([
        database.articles.toArray(),
        database.categories.toArray(),
        database.units.toArray(),
        database.lists.toArray(),
        database.aisles.toArray(),
        database.items.toArray(),
        database.recipes.toArray(),
      ]);
    const changes = languageChanges(
      { articles, categories, units, lists, aisles, items, recipes },
      { articles: catalogData, categories: categoriesData, units: unitsData },
      from,
      language,
      defaultNames,
    );
    await Promise.all([
      putRenamed(changes.articles, articles, (rows) =>
        database.articles.bulkPut(rows),
      ),
      putRenamed(changes.categories, categories, (rows) =>
        database.categories.bulkPut(rows),
      ),
      database.units.bulkPut(changes.units),
      database.lists.bulkPut(changes.lists),
      database.aisles.bulkPut(changes.aisles),
      database.items.bulkPut(changes.items),
      database.recipes.bulkPut(changes.recipes),
      updateSettings(database, { language }),
    ]);
  });
}

/**
 * Écrit des lignes renommées sans doublon de slug, même en cours d'écriture : quand
 * deux noms s'échangent d'une langue à l'autre, une ligne dont l'ancien slug est repris
 * par une autre passe d'abord par un slug provisoire (son identifiant).
 */
async function putRenamed<T extends { id: ID; slug: string }>(
  renamed: readonly T[],
  current: readonly T[],
  put: (rows: T[]) => Promise<unknown>,
): Promise<void> {
  const next = new Map(renamed.map((row) => [row.id, row.slug]));
  const wanted = new Set(next.values());
  const crossing = current.filter((row) => {
    const slug = next.get(row.id);
    return slug !== undefined && slug !== row.slug && wanted.has(row.slug);
  });
  if (crossing.length)
    await put(crossing.map((row) => ({ ...row, slug: row.id })));
  await put([...renamed]);
}
