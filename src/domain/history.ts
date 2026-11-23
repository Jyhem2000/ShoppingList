import { countBy } from "./collections";
import type { ID, Purchase, Unit } from "./model";
import { purchaseRhythms, type Rhythm } from "./suggestions";
import { type UsualAmount, usualAmounts } from "./usage";

/** Achats des courses terminées, et fin des dernières courses terminées. */
export interface PurchaseHistory {
  purchases: Purchase[];
  lastClosedAt: number | undefined;
}

/** Ce que l'historique apprend (rien n'est stocké : tout se recalcule à la lecture). */
export interface PurchaseStats {
  /** Nombre d'achats par article (recherche, habituels). */
  purchaseCounts: Map<ID, number>;
  /** Unité habituelle (unité selon l'usage, docs/07 § 7.14). */
  usual: Map<ID, UsualAmount>;
  /** Rythme d'achat (anti-oubli, docs/07 § 7.7). */
  rhythms: Map<ID, Rhythm>;
  /** Fin des dernières courses terminées : « Pas cette fois » dure jusque-là. */
  lastClosedAt: number | undefined;
}

export function purchaseStats(
  { purchases, lastClosedAt }: PurchaseHistory,
  units: readonly Unit[],
): PurchaseStats {
  return {
    purchaseCounts: countBy(purchases, (purchase) => purchase.articleId),
    usual: usualAmounts(purchases, units),
    rhythms: purchaseRhythms(purchases),
    lastClosedAt,
  };
}
