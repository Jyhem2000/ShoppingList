import { useMemo } from "react";
import { sortCategories } from "@/domain/categories";
import { restockSuggestions, tourCategories } from "@/domain/suggestions";
import { catalogOrder } from "./format";
import type { ListData } from "./useListData";

/**
 * Anti-oubli (docs/03 D1) pour la liste courante : les articles qu'il est temps de
 * racheter, les plus en retard d'abord. Le bouton de la liste, le tour et les
 * « Habituels » du catalogue lisent les mêmes.
 */
export function useRestockSuggestions(data: ListData | undefined, now: number) {
  const { items, articleById, rhythms, lastClosedAt } = data ?? {};
  const dismissed = data?.settings.dismissedSuggestions;
  return useMemo(() => {
    if (!items || !articleById || !rhythms || !dismissed) return undefined;
    return restockSuggestions(rhythms, {
      inList: new Set(items.map((item) => item.articleId)),
      exists: (id) => articleById.has(id),
      dismissed,
      lastClosedAt,
      now,
    });
  }, [items, articleById, rhythms, dismissed, lastClosedAt, now]);
}

/**
 * Tour de la cuisine (docs/03 D2) : les catégories avec leurs articles habituels, dans
 * l'ordre du catalogue. Ne dépend pas de la liste : une coche ne refait pas le tour.
 */
export function useTourCategories(data: ListData | undefined) {
  const { categories, articles, purchaseCounts } = data ?? {};
  return useMemo(
    () =>
      categories &&
      articles &&
      purchaseCounts &&
      tourCategories(
        sortCategories(categories, catalogOrder),
        articles,
        purchaseCounts,
      ),
    [categories, articles, purchaseCounts],
  );
}
