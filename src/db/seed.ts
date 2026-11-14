import { categoriesData, unitsData } from "@/data";
import { CATALOG_VERSION, catalogData } from "@/data/catalog";
import type {
  Article,
  Category,
  ID,
  Settings,
  ShoppingList,
  Unit,
} from "@/domain/model";
import { slugify } from "@/domain/slug";
import { fr } from "@/i18n/fr";
import type { ShoppingDatabase } from "./database";

/**
 * Premier lancement (docs/02 § 10, docs/04 § 2.11) : copie des données initiales
 * dans la base et création de la liste « Courses ». Aucun magasin : le premier se crée
 * au premier « C'est parti », et ses rayons pendant les courses.
 * Ensuite, ce sont les données de l'utilisateur : rien n'est jamais recopié par-dessus.
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
): InitialData {
  const base = () => ({ id: newId(), createdAt: now, updatedAt: now });

  const units: Unit[] = unitsData.map((unit) => ({
    ...base(),
    slug: unit.key,
    singular: unit.name.fr.singular,
    plural: unit.name.fr.plural,
    abbr: unit.name.fr.abbr,
    dimension: unit.dimension,
    group: unit.group,
    factor: unit.factor,
    step: unit.step,
    aliases: unit.aliases?.fr ?? [],
    catalogKey: unit.key,
  }));
  const unitByKey = new Map(units.map((unit) => [unit.slug, unit]));

  const categories: Category[] = categoriesData.map((category) => ({
    ...base(),
    slug: slugify(category.name.fr),
    name: category.name.fr,
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
    const slug = slugify(article.name.fr);
    const aliases = [
      ...new Set((article.aliases?.fr ?? []).map(slugify)),
    ].filter((alias) => alias !== slug);
    return {
      ...base(),
      slug,
      name: article.name.fr,
      categoryId: require(categoryByKey.get(article.category), article.category)
        .id,
      defaultUnitId: require(unitByKey.get(article.unit), article.unit).id,
      defaultQuantity: article.quantity,
      generic: article.generic,
      types: article.types?.fr ?? [],
      aliases,
      icon: article.icon,
      favorite: false,
      barcodes: [],
      notDuplicateOf: [],
      catalogKey: article.key,
    };
  });

  const list: ShoppingList = {
    ...base(),
    name: fr.defaults.listName,
    position: 0,
  };

  const settings: Settings = {
    animations: "auto",
    compact: false,
    checkedBehavior: "sink",
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
