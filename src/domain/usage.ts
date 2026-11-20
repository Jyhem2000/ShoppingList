import type { Article, ID, Purchase, Unit } from "./model";
import { unitGroup } from "./quantity";

/**
 * Unité selon l'usage (docs/03 A2, 07 § 7.14) : un article ajouté sans unité précisée
 * prend celle qu'on achète le plus pour lui, d'après l'historique, sans compteur stocké.
 */

/** À partir de combien d'achats d'un article l'historique l'emporte sur son unité. */
export const USUAL_MIN_PURCHASES = 3;

/** Unité la plus achetée d'un article, et la quantité la plus prise dans cette unité. */
export interface UsualAmount {
  unitId: ID;
  quantity: number;
}

type PurchaseUse = Pick<Purchase, "articleId" | "unitId" | "quantity" | "at">;

/**
 * La valeur la plus fréquente ; à égalité, celle du dernier achat (le plus récent
 * l'emporte : une habitude qui change compte plus que l'ancienne).
 */
function mostFrequent<T>(
  purchases: readonly PurchaseUse[],
  value: (purchase: PurchaseUse) => T,
): T | undefined {
  const counts = new Map<T, { count: number; last: number }>();
  for (const purchase of purchases) {
    const key = value(purchase);
    const entry = counts.get(key) ?? { count: 0, last: -Infinity };
    entry.count++;
    entry.last = Math.max(entry.last, purchase.at);
    counts.set(key, entry);
  }
  let best: T | undefined;
  let bestEntry: { count: number; last: number } | undefined;
  for (const [key, entry] of counts)
    if (
      !bestEntry ||
      entry.count > bestEntry.count ||
      (entry.count === bestEntry.count && entry.last > bestEntry.last)
    ) {
      best = key;
      bestEntry = entry;
    }
  return best;
}

/**
 * Unité et quantité habituelles de chaque article acheté au moins
 * `USUAL_MIN_PURCHASES` fois (achats des courses terminées). Les achats dans une unité
 * qui n'existe plus, ou une unité de cuisine, ne comptent pas.
 */
export function usualAmounts(
  purchases: readonly PurchaseUse[],
  units: readonly Unit[],
): Map<ID, UsualAmount> {
  const buyable = new Set(
    units.filter((unit) => unitGroup(unit) !== "kitchen").map((u) => u.id),
  );
  const byArticle = new Map<ID, PurchaseUse[]>();
  for (const purchase of purchases) {
    if (!buyable.has(purchase.unitId)) continue;
    const list = byArticle.get(purchase.articleId) ?? [];
    list.push(purchase);
    byArticle.set(purchase.articleId, list);
  }
  const result = new Map<ID, UsualAmount>();
  for (const [articleId, list] of byArticle) {
    if (list.length < USUAL_MIN_PURCHASES) continue;
    const unitId = mostFrequent(list, (p) => p.unitId);
    if (unitId === undefined) continue;
    const quantity = mostFrequent(
      list.filter((p) => p.unitId === unitId),
      (p) => p.quantity,
    );
    if (quantity !== undefined) result.set(articleId, { unitId, quantity });
  }
  return result;
}

type Defaults = Pick<
  Article,
  "defaultUnitId" | "defaultQuantity" | "countable" | "defaultUnitChosen"
>;

/**
 * L'article tel qu'un ajout sans unité le lit : son unité habituelle et la quantité
 * habituelle dans cette unité, sauf unité par défaut choisie à la main dans sa fiche.
 * Même unité que celle par défaut : la quantité par défaut de l'article est gardée.
 */
export function withUsualAmount<A extends Defaults>(
  article: A,
  usual: UsualAmount | undefined,
): A {
  if (
    article.defaultUnitChosen === true ||
    !usual ||
    usual.unitId === article.defaultUnitId
  )
    return article;
  return {
    ...article,
    defaultUnitId: usual.unitId,
    defaultQuantity: usual.quantity,
  };
}
