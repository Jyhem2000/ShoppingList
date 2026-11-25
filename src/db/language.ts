import { categoriesData, unitsData } from "@/data";
import { catalogData } from "@/data/catalog";
import {
  DEFAULT_LANGUAGE,
  isLanguage,
  languages,
  type ByLanguage,
  type Language,
} from "@/domain/language";
import { languageChanges, type DefaultNames } from "@/domain/languageChange";
import { textsByLanguage } from "@/i18n";
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
    const from = isLanguage(settings.language)
      ? settings.language
      : DEFAULT_LANGUAGE;
    const changes = languageChanges(
      {
        articles: await database.articles.toArray(),
        categories: await database.categories.toArray(),
        units: await database.units.toArray(),
        lists: await database.lists.toArray(),
        aisles: await database.aisles.toArray(),
        items: await database.items.toArray(),
        recipes: await database.recipes.toArray(),
      },
      { articles: catalogData, categories: categoriesData, units: unitsData },
      from,
      language,
      defaultNames,
    );
    // Slugs uniques : deux noms qui s'échangent d'une langue à l'autre se
    // croiseraient. Un slug provisoire (l'identifiant) d'abord, puis le vrai.
    await database.articles.bulkPut(
      changes.articles.map((row) => ({ ...row, slug: row.id })),
    );
    await database.articles.bulkPut(changes.articles);
    await database.categories.bulkPut(
      changes.categories.map((row) => ({ ...row, slug: row.id })),
    );
    await database.categories.bulkPut(changes.categories);
    await database.units.bulkPut(changes.units);
    await database.lists.bulkPut(changes.lists);
    await database.aisles.bulkPut(changes.aisles);
    await database.items.bulkPut(changes.items);
    await database.recipes.bulkPut(changes.recipes);
    await updateSettings(database, { language });
  });
}
