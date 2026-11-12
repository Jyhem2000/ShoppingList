import type { Aisle, ID, ListItem, Purchase, ShoppingSession } from "./model";

/**
 * Mode courses, clôture et apprentissage (docs/03 C1 à C8, docs/07 § 7.6).
 * Fonctions pures : aucune dépendance à React ni à Dexie.
 */

type Coche = Pick<Purchase, "at"> & { id?: ID };

/**
 * Seul l'ordre des coches compte, pas leur heure : une pause en magasin ne dit
 * rien du parcours. Rang 0 = premier article coché de la session.
 */
function ranked<P extends Coche>(
  purchases: readonly P[],
): (P & { rank: number })[] {
  return [...purchases]
    .sort((a, b) => a.at - b.at || (a.id ?? "").localeCompare(b.id ?? ""))
    .map((purchase, rank) => ({ ...purchase, rank }));
}

export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length === 0) return Number.NaN;
  return sorted.length % 2
    ? (sorted[middle] ?? Number.NaN)
    : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

/**
 * Les éléments visités se répartissent entre leurs propres places, dans l'ordre
 * observé (rang médian de leurs coches, robuste à un aller-retour) ; les autres ne
 * bougent pas. `current` : valeur actuelle de chaque élément visité (plus petit d'abord).
 */
function reorderVisited(
  current: ReadonlyMap<ID, number>,
  ranks: ReadonlyMap<ID, number[]>,
): Map<ID, number> {
  const visited = [...current.keys()];
  const slots = visited.map((id) => current.get(id) ?? 0).sort((a, b) => a - b);
  const observed = visited.sort(
    (a, b) =>
      median(ranks.get(a) ?? []) - median(ranks.get(b) ?? []) ||
      (current.get(a) ?? 0) - (current.get(b) ?? 0),
  );
  return new Map(observed.map((id, index) => [id, slots[index] ?? 0]));
}

/**
 * Apprentissage de l'ordre des rayons (C7) : les rayons où l'on a coché prennent,
 * entre eux, l'ordre du parcours ; les rayons non visités et « Non classé » gardent
 * leur position. Renvoie les nouvelles positions des rayons qui changent.
 */
export function learnAislePositions(
  aisles: readonly Pick<Aisle, "id" | "position" | "isUnsorted">[],
  purchases: readonly (Coche & Pick<Purchase, "aisleId">)[],
): Record<ID, number> {
  const sortable = new Map(
    aisles.filter((a) => !a.isUnsorted).map((a) => [a.id, a.position]),
  );
  const ranks = new Map<ID, number[]>();
  for (const { aisleId, rank } of ranked(purchases)) {
    if (!sortable.has(aisleId)) continue;
    ranks.set(aisleId, [...(ranks.get(aisleId) ?? []), rank]);
  }
  const current = new Map(
    [...ranks.keys()].map((id) => [id, sortable.get(id) ?? 0]),
  );
  const changes: Record<ID, number> = {};
  for (const [id, position] of reorderVisited(current, ranks))
    if (position !== sortable.get(id)) changes[id] = position;
  return changes;
}

/**
 * Apprentissage de l'ordre des articles dans chaque rayon (C7) : même principe, rayon
 * par rayon. Un article sans ordre appris prend une place après les articles connus.
 * `order` : score de chaque article dans ce magasin (plus petit d'abord).
 */
export function learnArticleOrder(
  order: Readonly<Record<ID, number>>,
  purchases: readonly (Coche & Pick<Purchase, "aisleId" | "articleId">)[],
): Record<ID, number> {
  const known = Object.values(order);
  let next = known.length ? Math.max(...known) + 1 : 0;
  const byAisle = new Map<ID, Map<ID, number[]>>();
  for (const { aisleId, articleId, rank } of ranked(purchases)) {
    const ranks = byAisle.get(aisleId) ?? new Map<ID, number[]>();
    ranks.set(articleId, [...(ranks.get(articleId) ?? []), rank]);
    byAisle.set(aisleId, ranks);
  }
  const result: Record<ID, number> = { ...order };
  for (const ranks of byAisle.values()) {
    const current = new Map<ID, number>();
    for (const articleId of ranks.keys()) {
      const score = order[articleId];
      current.set(articleId, score ?? next++);
    }
    for (const [articleId, score] of reorderVisited(current, ranks))
      result[articleId] = score;
  }
  return result;
}

/** L'ordre d'affichage des rayons change-t-il entre deux jeux de positions ? */
export function aisleOrderChanged(
  before: Readonly<Record<ID, number>>,
  after: Readonly<Record<ID, number>>,
): boolean {
  const ids = Object.keys(before).filter((id) => id in after);
  const sort = (positions: Readonly<Record<ID, number>>) =>
    [...ids]
      .sort(
        (a, b) =>
          (positions[a] ?? 0) - (positions[b] ?? 0) || a.localeCompare(b),
      )
      .join();
  return sort(before) !== sort(after);
}

/** Compteur « 12 / 18 » (C1) : lignes dans le caddie sur l'ensemble des lignes. */
export function shoppingProgress(items: readonly Pick<ListItem, "status">[]): {
  checked: number;
  total: number;
} {
  return {
    checked: items.filter((item) => item.status === "checked").length,
    total: items.length,
  };
}

/**
 * Rayons déjà passés (C4) : ceux où l'on a coché quelque chose, sauf le rayon de la
 * dernière coche (on y est encore). Revenir cocher dans un rayon le rouvre.
 */
export function passedAisles(
  purchases: readonly (Coche & Pick<Purchase, "aisleId">)[],
): Set<ID> {
  const sorted = ranked(purchases);
  const last = sorted.at(-1)?.aisleId;
  return new Set(sorted.map((p) => p.aisleId).filter((id) => id !== last));
}

/**
 * Lignes « À récupérer » (C4) : ajoutées pendant les courses, encore à prendre, et
 * dont le rayon est déjà passé.
 */
export function pickUpItems<
  I extends Pick<ListItem, "id" | "status" | "createdAt">,
>(
  items: readonly I[],
  aisleOf: (item: I) => ID | undefined,
  passed: ReadonlySet<ID>,
  session: Pick<ShoppingSession, "startedAt">,
): Set<ID> {
  return new Set(
    items
      .filter((item) => {
        const aisle = aisleOf(item);
        return (
          item.status === "todo" &&
          item.createdAt >= session.startedAt &&
          aisle !== undefined &&
          passed.has(aisle)
        );
      })
      .map((item) => item.id),
  );
}

/**
 * Rayon courant (C2) : le premier rayon qui a encore des articles à prendre, à partir
 * du rayon de la dernière coche ; sinon le premier de la liste qui en a.
 * `aisles` : dans l'ordre d'affichage.
 */
export function currentAisle(
  aisles: readonly { id: ID; hasTodo: boolean }[],
  lastCheckedAisle: ID | undefined,
): ID | undefined {
  const start = Math.max(
    0,
    aisles.findIndex((a) => a.id === lastCheckedAisle),
  );
  return (
    aisles.slice(start).find((a) => a.hasTodo)?.id ??
    aisles.find((a) => a.hasTodo)?.id
  );
}

/** Session oubliée (C8) : plus de 3 heures sans rien cocher. */
export const STALE_AFTER_MS = 3 * 60 * 60 * 1000;

export function isStale(lastActivity: number, now: number): boolean {
  return now - lastActivity >= STALE_AFTER_MS;
}
