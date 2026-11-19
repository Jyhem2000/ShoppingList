import { useArticleItems } from "@/db/hooks";
import type { Article, ID, Unit } from "@/domain/model";
import { pieceUnit, unitByKey, usualUnits } from "@/domain/quantity";
import { suggestedUnitKey } from "@/common/format";
import type { ListData } from "@/common/useListData";

/**
 * Unités habituelles d'un article, proposées en puces dans la fiche d'une ligne
 * (`usualUnits`) : son unité par défaut, l'unité habituelle de sa catégorie, « pièce »,
 * puis celles déjà utilisées pour lui sur d'autres lignes. La ligne affichée (`itemId`)
 * ne compte pas : choisir une puce ne la déplace jamais.
 */
export function useUsualUnits(
  article: Article | undefined,
  data: ListData,
  itemId?: ID,
): Unit[] {
  const items = useArticleItems(article?.id);
  if (!article) return [];
  const categoryKey = data.categoryById.get(article.categoryId)?.catalogKey;
  return usualUnits(
    [
      article.defaultUnitId,
      unitByKey(data.units, suggestedUnitKey(categoryKey))?.id,
      pieceUnit(data.units)?.id,
    ],
    (items ?? [])
      .filter((item) => item.id !== itemId)
      .map((item) => item.unitId),
    data.unitById,
  );
}
