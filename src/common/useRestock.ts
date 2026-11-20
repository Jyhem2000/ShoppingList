import { useMemo } from "react";
import { sortCategories } from "@/domain/categories";
import { restockSuggestions, tourCategories } from "@/domain/suggestions";
import { useNow } from "@/ui/useNow";
import { catalogOrder } from "./format";
import type { ListData } from "./useListData";

/**
 * Anti-oubli et tour de la cuisine (docs/03 D1, D2) pour la liste courante : les
 * articles qu'il est temps de racheter (`suggestions`, les plus en retard d'abord) et les
 * catégories du tour avec leurs articles habituels, dans l'ordre du catalogue.
 * Le bouton de la liste, le tour et les « Habituels » du catalogue lisent les mêmes.
 */
export function useRestock(data: ListData | undefined) {
  const now = useNow();
  const categories = useMemo(
    () =>
      data &&
      tourCategories(
        sortCategories(data.categories, catalogOrder),
        data.articles,
        data.purchaseCounts,
      ),
    [data],
  );
  const suggestions = useMemo(() => {
    if (!data) return undefined;
    return restockSuggestions(data.rhythms, {
      inList: new Set(data.items.map((item) => item.articleId)),
      exists: (id) => data.articleById.has(id),
      dismissed: data.settings.dismissedSuggestions,
      lastClosedAt: data.lastClosedAt,
      now,
    });
  }, [data, now]);
  return useMemo(
    () =>
      categories && suggestions ? { categories, suggestions, now } : undefined,
    [categories, suggestions, now],
  );
}
