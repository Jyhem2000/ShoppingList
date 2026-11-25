import { categoriesData, unitsData } from "@/data";
import { CATALOG_VERSION, SEASON_ZONE, catalogData } from "@/data/catalog";
import type {
  Article,
  Category,
  ID,
  Settings,
  ShoppingList,
  Unit,
} from "@/domain/model";
import { appLanguage, type Language } from "@/domain/language";
import { slugify } from "@/domain/slug";
import { textsByLanguage } from "@/i18n";
import type { ShoppingDatabase } from "./database";

/**
 * Premier lancement (docs/02 § 10, docs/04 § 2.11) : copie des données initiales
 * dans la base et création de la liste « Courses ». Aucun magasin : le premier se crée
 * au premier « C'est parti », et ses rayons pendant les courses.
 * Ensuite, ce sont les données de l'utilisateur : rien n'est jamais recopié par-dessus.
 * Les noms du catalogue sont ceux de la langue de l'app.
 */
export interface InitialData {
  units: Unit[];
  categories: Category[];
  articles: Article[];
  list: ShoppingList;
  settings: Settings;
}

export function buildInitialData(
  now: number,
  newId: () => ID = () => crypto.randomUUID(),
  language: Language = appLanguage(),
): InitialData {
  const base = () => ({ id: newId(), createdAt: now, updatedAt: now });

  const units: Unit[] = unitsData.map((unit) => ({
    ...base(),
    slug: unit.key,
    singular: unit.name[language].singular,
    plural: unit.name[language].plural,
    abbr: unit.name[language].abbr,
    dimension: unit.dimension,
    group: unit.group,
    factor: unit.factor,
    step: unit.step,
    aliases: unit.aliases?.[language] ?? [],
    catalogKey: unit.key,
  }));
  const unitByKey = new Map(units.map((unit) => [unit.slug, unit]));

  const categories: Category[] = categoriesData.map((category) => ({
    ...base(),
    slug: slugify(category.name[language]),
    name: category.name[language],
    icon: category.icon,
    color: category.color,
    useIconAsFallback: false,
    isSystem: category.system ?? false,
    catalogKey: category.key,
  }));
  const categoryByKey = new Map(
    categories.map((category) => [category.catalogKey, category]),
  );
  const require = <T>(value: T | undefined, what: string): T => {
    if (value === undefined)
      throw new Error(`Donnée initiale inconnue : ${what}`);
    return value;
  };

  const articles: Article[] = catalogData.map((article) => {
    const slug = slugify(article.name[language]);
    const aliases = [
      ...new Set((article.aliases?.[language] ?? []).map(slugify)),
    ].filter((alias) => alias !== slug);
    return {
      ...base(),
      slug,
      name: article.name[language],
      categoryId: require(categoryByKey.get(article.category), article.category)
        .id,
      defaultUnitId: require(unitByKey.get(article.unit), article.unit).id,
      defaultQuantity: article.quantity,
      countable: article.countable,
      generic: article.generic,
      types: article.types?.[language] ?? [],
      aliases,
      icon: article.icon,
      favorite: false,
      seasonMonths: article.season?.[SEASON_ZONE],
      notDuplicateOf: [],
      catalogKey: article.key,
    };
  });

  const list: ShoppingList = {
    ...base(),
    name: textsByLanguage[language].defaults.listName,
    position: 0,
  };

  const settings: Settings = {
    // Celle posée au démarrage : au premier lancement, la langue du téléphone.
    language,
    catalogVersion: CATALOG_VERSION,
    currentListId: list.id,
    dismissedSuggestions: [],
  };

  return { units, categories, articles, list, settings };
}

/**
 * Remplit la base si elle est vide (premier lancement), en une seule transaction.
 * Renvoie `true` si les données ont été créées.
 */
export async function seedDatabase(
  database: ShoppingDatabase,
  now = Date.now(),
): Promise<boolean> {
  return database.transaction("rw", database.tables, async () => {
    if (await database.meta.get("settings")) return false;
    const data = buildInitialData(now);
    await database.units.bulkAdd(data.units);
    await database.categories.bulkAdd(data.categories);
    await database.articles.bulkAdd(data.articles);

    await database.lists.add(data.list);
    await database.meta.add({ key: "settings", value: data.settings });
    return true;
  });
}
