import { useLiveQuery } from "dexie-react-hooks";
import { categoriesData } from "@/data";
import { db } from "@/db/database";
import type { Article, ID, Unit } from "@/domain/model";
import type { ListData } from "./useListData";

const MAX = 4;

/**
 * Unités habituelles d'un article, proposées en puces dans la fiche d'une ligne, dans un
 * ordre fixe : son unité par défaut, l'unité habituelle de sa catégorie, « pièce », puis
 * celles déjà utilisées pour lui sur d'autres lignes (les plus fréquentes d'abord).
 * La ligne affichée (`itemId`) ne compte pas : choisir une puce ne la déplace jamais.
 * Aucune donnée en plus : tout vient des lignes déjà saisies.
 */
export function useUsualUnits(
  article: Article | undefined,
  data: ListData,
  itemId?: ID,
): Unit[] {
  const used = useLiveQuery(
    async () =>
      article
        ? (await db.items.where("articleId").equals(article.id).toArray())
            .filter((item) => item.id !== itemId)
            .map((item) => item.unitId)
        : [],
    [article?.id, itemId],
  );
  if (!article) return [];

  const counts = new Map<string, number>();
  for (const unitId of used ?? [])
    counts.set(unitId, (counts.get(unitId) ?? 0) + 1);
  const byUse = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([unitId]) => unitId);

  const categoryKey = data.categoryById.get(article.categoryId)?.catalogKey;
  const suggested = categoriesData.find((c) => c.key === categoryKey)?.unit;
  const bySlug = (slug: string | undefined) =>
    data.units.find((u) => u.slug === slug)?.id;

  const ids = [
    article.defaultUnitId,
    bySlug(suggested),
    bySlug("piece"),
    ...byUse,
  ].filter((unitId): unitId is string => unitId !== undefined);
  return [...new Set(ids)]
    .map((unitId) => data.unitById.get(unitId))
    .filter((unit): unit is Unit => unit !== undefined)
    .slice(0, MAX);
}
