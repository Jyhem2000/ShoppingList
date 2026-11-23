import { groupArticlesByCategory } from "./categories";
import { groupBy } from "./collections";
import type { Article, Category, ID, Purchase, Settings } from "./model";
import { purchaseOccasions } from "./occasions";
import { byName } from "./slug";

/**
 * Anti-oubli et tour de la cuisine (docs/03 D1, D2, 07 § 7.7) : d'après les achats des
 * courses terminées, ce qu'il est temps de racheter, et les articles habituels de chaque
 * catégorie. Rien n'est stocké : tout se recalcule à la lecture de l'historique.
 */

/** À partir de combien d'occasions d'achat un article a un rythme (deux intervalles). */
const RHYTHM_MIN_PURCHASES = 3;
/** Suggéré dès 90 % de l'intervalle habituel écoulé. */
const DUE_RATIO = 0.9;
/** Suggestions « À racheter » au plus. */
const MAX_SUGGESTIONS = 5;
/** Achats à partir desquels un article est « habituel » dans le tour (favoris : toujours). */
const TOUR_MIN_PURCHASES = 2;

/** Rythme d'achat d'un article : intervalle médian entre deux achats, dernier achat. */
export interface Rhythm {
  interval: number;
  last: number;
}

type PurchaseTime = Pick<Purchase, "articleId" | "at">;

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? (sorted[middle] ?? 0)
    : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

/**
 * Rythme de chaque article acheté au moins `RHYTHM_MIN_PURCHASES` fois (occasions
 * d'achat, `purchaseOccasions`).
 */
export function purchaseRhythms(
  purchases: readonly PurchaseTime[],
): Map<ID, Rhythm> {
  const result = new Map<ID, Rhythm>();
  const byArticle = groupBy(purchases, (purchase) => purchase.articleId);
  for (const [articleId, list] of byArticle) {
    const occasions = purchaseOccasions(list.map((purchase) => purchase.at));
    if (occasions.length < RHYTHM_MIN_PURCHASES) continue;
    const intervals = occasions
      .slice(1)
      .map((at, index) => at - (occasions[index] ?? at));
    const last = occasions.at(-1) ?? 0;
    result.set(articleId, { interval: median(intervals), last });
  }
  return result;
}

/** Écart encore valable : aucunes courses terminées depuis. */
function stillDismissed(
  entry: Settings["dismissedSuggestions"][number],
  lastClosedAt: number | undefined,
): boolean {
  return lastClosedAt === undefined || entry.at > lastClosedAt;
}

/** « Pas cette fois » : masqué tant qu'aucunes courses n'ont été terminées depuis. */
export function isDismissed(
  articleId: ID,
  dismissed: Settings["dismissedSuggestions"],
  lastClosedAt: number | undefined,
): boolean {
  return dismissed.some(
    (entry) =>
      entry.articleId === articleId && stillDismissed(entry, lastClosedAt),
  );
}

/**
 * Écarter un article (« Pas cette fois ») : les écarts devenus caducs (courses
 * terminées depuis) sont retirés au passage.
 */
export function dismissSuggestion(
  dismissed: Settings["dismissedSuggestions"],
  articleId: ID,
  lastClosedAt: number | undefined,
  now: number,
): Settings["dismissedSuggestions"] {
  return [
    ...dismissed.filter(
      (entry) =>
        entry.articleId !== articleId && stillDismissed(entry, lastClosedAt),
    ),
    { articleId, at: now },
  ];
}

/** Article à racheter, et depuis combien de temps il a été acheté. */
export interface Suggestion {
  articleId: ID;
  rhythm: Rhythm;
}

/**
 * À racheter (D1) : 90 % de l'intervalle habituel écoulé depuis le dernier achat, absent
 * de la liste, pas écarté. Les plus en retard (rapporté à leur rythme) d'abord ;
 * `MAX_SUGGESTIONS` au plus.
 */
export function restockSuggestions(
  rhythms: ReadonlyMap<ID, Rhythm>,
  {
    inList,
    exists,
    dismissed,
    lastClosedAt,
    now,
  }: {
    inList: ReadonlySet<ID>;
    exists: (articleId: ID) => boolean;
    dismissed: Settings["dismissedSuggestions"];
    lastClosedAt: number | undefined;
    now: number;
  },
): Suggestion[] {
  return [...rhythms]
    .filter(
      ([articleId, rhythm]) =>
        rhythm.interval > 0 &&
        now - rhythm.last >= DUE_RATIO * rhythm.interval &&
        !inList.has(articleId) &&
        exists(articleId) &&
        !isDismissed(articleId, dismissed, lastClosedAt),
    )
    .map(([articleId, rhythm]) => ({
      articleId,
      rhythm,
      late: (now - rhythm.last) / rhythm.interval,
    }))
    .sort((a, b) => b.late - a.late)
    .slice(0, MAX_SUGGESTIONS)
    .map(({ articleId, rhythm }) => ({ articleId, rhythm }));
}

/**
 * Tour de la cuisine (D2) : chaque catégorie (dans l'ordre donné) avec ses articles
 * habituels, favoris ou achetés au moins `TOUR_MIN_PURCHASES` fois, les plus achetés
 * d'abord. Les catégories sans article habituel sont sautées.
 */
export function tourCategories(
  categories: readonly Category[],
  articles: readonly Article[],
  purchaseCounts: ReadonlyMap<ID, number>,
): { category: Category; articles: Article[] }[] {
  const count = (article: Article) => purchaseCounts.get(article.id) ?? 0;
  const usual = articles.filter(
    (article) => article.favorite || count(article) >= TOUR_MIN_PURCHASES,
  );
  return groupArticlesByCategory(
    categories,
    usual,
    (a, b) => count(b) - count(a) || byName(a, b),
  );
}
