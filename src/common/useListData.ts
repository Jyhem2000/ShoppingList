import { useMemo } from "react";
import {
  useAisles,
  useArticles,
  useCategories,
  useCurrentList,
  useListItems,
  useOverrides,
  usePurchaseStats,
  useRecipes,
  useStores,
  useUnits,
} from "@/db/hooks";
import type {
  Aisle,
  Article,
  ArticleAisleOverride,
  Category,
  ID,
  ListItem,
  Recipe,
  Settings,
  ShoppingList,
  Store,
  Unit,
} from "@/domain/model";
import { categoryWeights } from "./format";
import { byId } from "@/domain/collections";
import type { UsualAmount } from "@/domain/usage";
import type { Rhythm } from "@/domain/suggestions";

export interface ListData {
  settings: Settings;
  lists: ShoppingList[];
  list: ShoppingList;
  items: ListItem[];
  articles: Article[];
  articleById: Map<ID, Article>;
  units: Unit[];
  unitById: Map<ID, Unit>;
  categories: Category[];
  categoryById: Map<ID, Category>;
  stores: Store[];
  store: Store | undefined;
  aisles: Aisle[];
  overrides: ArticleAisleOverride[];
  purchaseCounts: Map<ID, number>;
  /** Unité habituelle des articles achetés assez souvent (unité selon l'usage). */
  usual: ReadonlyMap<ID, UsualAmount>;
  /** Rythme d'achat des articles achetés assez souvent (anti-oubli). */
  rhythms: ReadonlyMap<ID, Rhythm>;
  /** Fin des dernières courses terminées : « Pas cette fois » dure jusque-là. */
  lastClosedAt: number | undefined;
  recipes: Recipe[];
  /** Origine « via Raclette » des lignes (docs/03 E2). */
  recipeById: Map<ID, Recipe>;
  /** Achats par catégorie : titre des rayons sans nom (docs/02 § 4). */
  categoryWeights: Map<ID, number>;
}

/**
 * Tout ce qu'il faut pour afficher et modifier la liste courante ; `undefined`
 * pendant le chargement (et au premier lancement, le temps de créer les données).
 */
export function useListData(storeId?: ID): ListData | undefined {
  return useListDataOf(useCurrentList(), storeId);
}

/**
 * Même chose, pour un écran qui lit déjà la liste courante (le mode courses, qui en tire
 * sa session et son magasin) : pas de seconde lecture des réglages et des listes.
 * Chaque table dérivée (`articleById`…) n'est refaite que si sa table change : une
 * coche ne reconstruit que ce qui dépend des lignes.
 */
export function useListDataOf(
  { settings, lists, list }: ReturnType<typeof useCurrentList>,
  storeId?: ID,
): ListData | undefined {
  const items = useListItems(list?.id);
  const articles = useArticles();
  const units = useUnits();
  const categories = useCategories();
  const stores = useStores();
  // `storeId` : magasin imposé (celui des courses en cours), sinon celui de la liste.
  const store =
    stores?.find((s) => s.id === (storeId ?? list?.lastStoreId)) ?? stores?.[0];
  const aisles = useAisles(store?.id);
  const overrides = useOverrides();
  const purchaseStats = usePurchaseStats();
  const recipes = useRecipes();

  // Chaque table avec ses dérivées : refaites seulement quand elle change.
  const articleTables = useMemo(
    () => articles && { articles, articleById: byId(articles) },
    [articles],
  );
  const unitTables = useMemo(
    () => units && { units, unitById: byId(units) },
    [units],
  );
  const categoryTables = useMemo(
    () => categories && { categories, categoryById: byId(categories) },
    [categories],
  );
  const recipeTables = useMemo(
    () => recipes && { recipes, recipeById: byId(recipes) },
    [recipes],
  );
  const purchaseTables = useMemo(
    () =>
      articles &&
      purchaseStats && {
        ...purchaseStats,
        categoryWeights: categoryWeights(
          articles,
          purchaseStats.purchaseCounts,
        ),
      },
    [articles, purchaseStats],
  );

  return useMemo(() => {
    if (
      !settings ||
      !lists ||
      !list ||
      !items ||
      !articleTables ||
      !unitTables ||
      !categoryTables ||
      !stores ||
      !aisles ||
      !overrides ||
      !recipeTables ||
      !purchaseTables
    )
      return undefined;
    return {
      settings,
      lists,
      list,
      items,
      ...articleTables,
      ...unitTables,
      ...categoryTables,
      stores,
      store,
      aisles,
      overrides,
      ...recipeTables,
      ...purchaseTables,
    };
  }, [
    settings,
    lists,
    list,
    items,
    articleTables,
    unitTables,
    categoryTables,
    stores,
    store,
    aisles,
    overrides,
    recipeTables,
    purchaseTables,
  ]);
}
