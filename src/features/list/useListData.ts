import { useMemo } from "react";
import {
  useAisles,
  useArticles,
  useCategories,
  useListItems,
  useLists,
  useOverrides,
  usePurchaseCounts,
  useSettings,
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
  Settings,
  ShoppingList,
  Store,
  Unit,
} from "@/domain/model";

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
}

/**
 * Tout ce qu'il faut pour afficher et modifier la liste courante ; `undefined`
 * pendant le chargement (et au premier lancement, le temps de créer les données).
 */
export function useListData(storeId?: ID): ListData | undefined {
  const settings = useSettings();
  const lists = useLists();
  const list =
    lists?.find((l) => l.id === settings?.currentListId) ?? lists?.[0];
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
  const purchaseCounts = usePurchaseCounts();

  return useMemo(() => {
    if (
      !settings ||
      !lists ||
      !list ||
      !items ||
      !articles ||
      !units ||
      !categories ||
      !stores ||
      !aisles ||
      !overrides ||
      !purchaseCounts
    )
      return undefined;
    return {
      settings,
      lists,
      list,
      items,
      articles,
      articleById: new Map(articles.map((a) => [a.id, a])),
      units,
      unitById: new Map(units.map((u) => [u.id, u])),
      categories,
      categoryById: new Map(categories.map((c) => [c.id, c])),
      stores,
      store,
      aisles,
      overrides,
      purchaseCounts,
    };
  }, [
    settings,
    lists,
    list,
    items,
    articles,
    units,
    categories,
    stores,
    store,
    aisles,
    overrides,
    purchaseCounts,
  ]);
}
