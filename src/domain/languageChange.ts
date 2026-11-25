import type { ByLanguage, Language } from "./language";
import type {
  Aisle,
  Article,
  Category,
  ID,
  ListItem,
  Recipe,
  ShoppingList,
  Unit,
} from "./model";
import { searchKey, slugify } from "./slug";

/**
 * Changer de langue (docs/03 I3) : ce qui vient du catalogue et n'a jamais été
 * renommé (même nom que le catalogue dans l'ancienne langue) prend le nom de la
 * nouvelle ; ce que l'utilisateur a créé ou renommé garde le sien. Les noms donnés
 * par l'app (première liste, rayon « À placer », rendement d'une recette) suivent
 * aussi, s'ils n'ont pas été changés.
 */

/** Textes du catalogue de départ (`src/data`), par langue. */
export interface CatalogTexts {
  articles: readonly {
    key: string;
    name: ByLanguage<string>;
    aliases?: ByLanguage<string[]>;
    types?: ByLanguage<string[]>;
  }[];
  categories: readonly { key: string; name: ByLanguage<string> }[];
  units: readonly {
    key: string;
    name: ByLanguage<{ singular: string; plural: string; abbr?: string }>;
    aliases?: ByLanguage<string[]>;
  }[];
}

/** Noms donnés par l'app, dans une langue (`texts`). */
export interface DefaultNames {
  listName: string;
  unsortedAisle: string;
  /** Rendements proposés, dans le même ordre d'une langue à l'autre. */
  yieldUnits: readonly string[];
}

export interface LanguageData {
  articles: Article[];
  categories: Category[];
  units: Unit[];
  lists: ShoppingList[];
  aisles: Aisle[];
  items: ListItem[];
  recipes: Recipe[];
}

/**
 * Ce qui change : seulement les lignes modifiées. Leur date de modification reste :
 * un renommage par l'app n'est pas une modification de l'utilisateur (la mise à jour
 * du catalogue continue de corriger les articles qu'il n'a pas touchés).
 */
export function languageChanges(
  data: LanguageData,
  catalog: CatalogTexts,
  from: Language,
  to: Language,
  defaults: ByLanguage<DefaultNames>,
): LanguageData {
  const empty: LanguageData = {
    articles: [],
    categories: [],
    units: [],
    lists: [],
    aisles: [],
    items: [],
    recipes: [],
  };
  if (from === to) return empty;

  // Articles : nom, slug, alias et types du catalogue.
  const articleData = new Map(catalog.articles.map((a) => [a.key, a]));
  const articles = uniqueSlugs(
    data.articles,
    data.articles.flatMap((article) => {
      const source = article.catalogKey
        ? articleData.get(article.catalogKey)
        : undefined;
      if (article.name !== source?.name[from]) return [];
      const name = source.name[to];
      const slug = slugify(name);
      const aliases = swapped(
        article.aliases,
        (source.aliases?.[from] ?? []).map(slugify),
        (source.aliases?.[to] ?? []).map(slugify),
      ).filter((alias) => alias !== slug);
      const types = sameItems(article.types, source.types?.[from] ?? [])
        ? (source.types?.[to] ?? [])
        : article.types;
      if (
        name === article.name &&
        sameItems(aliases, article.aliases) &&
        sameItems(types, article.types)
      )
        return [];
      return [{ ...article, name, slug, aliases, types }];
    }),
  );

  /**
   * Types traduits, par article renommé (clé : `typeKey` de l'ancien type) : le même
   * mot s'il existe dans les deux langues (« Williams »), sinon celui à la même place
   * dans la liste (traductions l'une de l'autre quand les deux listes ont la même
   * longueur).
   */
  const typeMaps = new Map<ID, ReadonlyMap<string, string>>();
  for (const article of articles) {
    const source = articleData.get(article.catalogKey ?? "");
    const oldTypes = source?.types?.[from] ?? [];
    const newTypes = source?.types?.[to] ?? [];
    if (
      oldTypes.length > 0 &&
      oldTypes.length === newTypes.length &&
      sameItems(article.types, newTypes)
    )
      typeMaps.set(
        article.id,
        new Map(
          oldTypes.map((type, index) => [
            typeKey(type),
            newTypes.find((other) => typeKey(other) === typeKey(type)) ??
              newTypes[index] ??
              type,
          ]),
        ),
      );
  }

  // Catégories : nom et slug (le nom court choisi par l'utilisateur reste).
  const categoryData = new Map(catalog.categories.map((c) => [c.key, c]));
  const categories = uniqueSlugs(
    data.categories,
    data.categories.flatMap((category) => {
      const source = category.catalogKey
        ? categoryData.get(category.catalogKey)
        : undefined;
      if (category.name !== source?.name[from]) return [];
      const name = source.name[to];
      return name === category.name
        ? []
        : [{ ...category, name, slug: slugify(name) }];
    }),
  );

  // Unités : noms et alias ; le slug est la clé catalogue, il ne change pas.
  const unitData = new Map(catalog.units.map((u) => [u.key, u]));
  const units = data.units.flatMap((unit) => {
    const source = unit.catalogKey ? unitData.get(unit.catalogKey) : undefined;
    if (!source) return [];
    const old = source.name[from];
    if (
      unit.singular !== old.singular ||
      unit.plural !== old.plural ||
      (unit.abbr ?? "") !== (old.abbr ?? "")
    )
      return [];
    const name = source.name[to];
    const aliases = swapped(
      unit.aliases,
      source.aliases?.[from] ?? [],
      source.aliases?.[to] ?? [],
    );
    if (
      name.singular === unit.singular &&
      name.plural === unit.plural &&
      (name.abbr ?? "") === (unit.abbr ?? "") &&
      sameItems(aliases, unit.aliases)
    )
      return [];
    return [
      {
        ...unit,
        singular: name.singular,
        plural: name.plural,
        abbr: name.abbr,
        aliases,
      },
    ];
  });

  const lists = data.lists
    .filter((list) => list.name === defaults[from].listName)
    .map((list) => ({ ...list, name: defaults[to].listName }));
  const aisles = data.aisles
    .filter(
      (aisle) =>
        aisle.isUnsorted && aisle.name === defaults[from].unsortedAisle,
    )
    .map((aisle) => ({ ...aisle, name: defaults[to].unsortedAisle }));

  // Types acceptés des lignes et des ingrédients, quand les types ont été traduits.
  const translatedTypes = (articleId: ID, types: readonly string[]) => {
    const map = typeMaps.get(articleId);
    if (!map || !types.some((type) => map.has(typeKey(type)))) return undefined;
    return types.map((type) => map.get(typeKey(type)) ?? type);
  };
  const items = data.items.flatMap((item) => {
    const acceptedTypes = translatedTypes(item.articleId, item.acceptedTypes);
    return acceptedTypes ? [{ ...item, acceptedTypes }] : [];
  });

  const recipes = data.recipes.flatMap((recipe) => {
    // Comme le choix du rendement : sans casse ni pluriel (« Personne » = personnes).
    const index = defaults[from].yieldUnits.findIndex(
      (unit) => searchKey(unit) === searchKey(recipe.yield.unit),
    );
    const yieldUnit = defaults[to].yieldUnits[index] ?? recipe.yield.unit;
    let changed = yieldUnit !== recipe.yield.unit;
    const ingredients = recipe.ingredients.map((ingredient) => {
      const acceptedTypes = translatedTypes(
        ingredient.articleId,
        ingredient.acceptedTypes,
      );
      if (!acceptedTypes) return ingredient;
      changed = true;
      return { ...ingredient, acceptedTypes };
    });
    return changed
      ? [
          {
            ...recipe,
            yield: { ...recipe.yield, unit: yieldUnit },
            ingredients,
          },
        ]
      : [];
  });

  return { articles, categories, units, lists, aisles, items, recipes };
}

/** Un type, sans casse ni espaces autour (comme `typesKey`). */
function typeKey(type: string): string {
  return type.trim().toLowerCase();
}

/** Mêmes éléments, dans n'importe quel ordre. */
function sameItems(a: readonly string[], b: readonly string[]): boolean {
  const set = new Set(a);
  return a.length === b.length && b.every((item) => set.has(item));
}

/** Les éléments de `current` venus de `old` remplacés par ceux de `fresh`. */
function swapped(
  current: readonly string[],
  old: readonly string[],
  fresh: readonly string[],
): string[] {
  const removed = new Set(old);
  return [
    ...new Set([...current.filter((item) => !removed.has(item)), ...fresh]),
  ];
}

/**
 * Les renommages possibles sans doublon de slug (unique dans la base) : un nouveau
 * nom déjà pris par une ligne qui reste (créée ou renommée par l'utilisateur dans la
 * nouvelle langue) n'est pas appliqué, et sa ligne garde son nom.
 */
function uniqueSlugs<T extends { id: ID; slug: string }>(
  rows: readonly T[],
  renamed: T[],
): T[] {
  let kept = renamed;
  for (;;) {
    const ids = new Set(kept.map((row) => row.id));
    const taken = new Set(
      rows.filter((row) => !ids.has(row.id)).map((row) => row.slug),
    );
    const counts = new Map<string, number>();
    for (const row of kept)
      counts.set(row.slug, (counts.get(row.slug) ?? 0) + 1);
    const next = kept.filter(
      (row) => !taken.has(row.slug) && counts.get(row.slug) === 1,
    );
    if (next.length === kept.length) return kept;
    kept = next;
  }
}
