import { type AisleGroup, groupListForStore } from "./aisles";
import type {
  Aisle,
  Article,
  ArticleAisleOverride,
  ID,
  ListItem,
  Purchase,
  ShoppingSession,
  Store,
} from "./model";
import { sortAisles } from "./stores";

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
    const list = ranks.get(aisleId);
    if (list) list.push(rank);
    else ranks.set(aisleId, [rank]);
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
    const list = ranks.get(articleId);
    if (list) list.push(rank);
    else ranks.set(articleId, [rank]);
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

/** Lignes encore à prendre. */
export function countTodo(items: readonly Pick<ListItem, "status">[]): number {
  return items.filter((item) => item.status === "todo").length;
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

/**
 * Rayon en cours pour ranger ce qu'on coche dans « À placer » (C4) : celui ouvert par
 * « Rayon suivant » s'il est plus récent que la dernière coche, sinon celui de la
 * dernière coche.
 */
export function placingAisle(
  opened: ShoppingSession["openedAisle"],
  lastPurchase: Pick<Purchase, "aisleId" | "at"> | undefined,
): ID | undefined {
  if (opened && (!lastPurchase || opened.at >= lastPurchase.at))
    return opened.aisleId;
  return lastPurchase?.aisleId;
}

/**
 * « Rouvrir les courses » (C8) : seulement la dernière course de la liste, terminée le
 * jour même, dans un magasin qui existe encore. Au-delà, rouvrir n'a plus de sens.
 */
export function canReopen(
  session: Pick<ShoppingSession, "id" | "status" | "closedAt">,
  latestId: ID | undefined,
  storeExists: boolean,
  now: number,
): boolean {
  if (session.status !== "closed" || session.closedAt === undefined)
    return false;
  if (session.id !== latestId || !storeExists) return false;
  return (
    new Date(session.closedAt).toDateString() === new Date(now).toDateString()
  );
}

/** Session oubliée (C8) : plus de 3 heures sans rien cocher. */
export const STALE_AFTER_MS = 3 * 60 * 60 * 1000;

export function isStale(lastActivity: number, now: number): boolean {
  return now - lastActivity >= STALE_AFTER_MS;
}

export interface ShoppingGroup extends AisleGroup<Aisle, ListItem> {
  /** Plus rien à prendre dans ce rayon (C2) : replié, avec une coche. */
  done: boolean;
}

export interface ShoppingView {
  /** Rayons qui ont des lignes, dans l'ordre du parcours, plus le rayon en cours (même vide). */
  groups: ShoppingGroup[];
  /** « À récupérer » (C4), en haut. */
  pickUp: ListItem[];
  /**
   * « À placer » (C4) : lignes dont la catégorie n'a pas encore de rayon dans ce
   * magasin, ou vient d'en recevoir un pendant ces courses, rangées dans le rayon en
   * cours quand on les coche.
   */
  unplaced: ListItem[];
  /**
   * Rayon en cours pour ranger ce qu'on coche dans « À placer », qui s'affiche
   * après lui (en tête sans lui).
   */
  placing: Aisle | undefined;
  current: ID | undefined;
  /** Rayon de la dernière coche : là où l'on est. */
  here: ID | undefined;
  aisleOf: Map<ID, Aisle>;
  progress: { checked: number; total: number };
}

/** Ce que lit la vue des courses : la liste, les articles et le magasin. */
export interface ShoppingData {
  items: readonly ListItem[];
  articleById: ReadonlyMap<ID, Article>;
  store: Store;
  aisles: readonly Aisle[];
  overrides: readonly ArticleAisleOverride[];
}

/** Ce qu'affiche le mode courses : rayons, état de chacun, « À placer », « À récupérer ». */
export function buildShoppingView(
  data: ShoppingData,
  session: Pick<
    ShoppingSession,
    "storeId" | "startedAt" | "openedAisle" | "placedCategories"
  >,
  purchases: readonly Purchase[],
): ShoppingView {
  const grouped = groupListForStore(
    data.items,
    data.articleById,
    data.store.id,
    data.aisles,
    data.overrides,
    data.store.articleOrder,
  );
  const aisleOf = new Map<ID, Aisle>();
  for (const { aisle, items } of grouped)
    for (const item of items) aisleOf.set(item.id, aisle);

  // Catégorie rangée pendant ces courses : ses autres articles déjà dans la liste,
  // encore à prendre, ne sautent pas vers le rayon ; ils restent dans « À placer »
  // jusqu'à leur coche. Ceux ajoutés ensuite vont dans leur rayon (ou « À récupérer »).
  const placedAt = new Map(
    (session.placedCategories ?? []).map((p) => [p.categoryId, p.at]),
  );
  const overridden = new Set(
    data.overrides
      .filter((o) => o.storeId === session.storeId)
      .map((o) => o.articleId),
  );
  const staying = new Set(
    data.items
      .filter((item) => {
        const article = data.articleById.get(item.articleId);
        return (
          item.status === "todo" &&
          article !== undefined &&
          item.createdAt < (placedAt.get(article.categoryId) ?? 0) &&
          !overridden.has(article.id) &&
          aisleOf.get(item.id)?.isUnsorted === false
        );
      })
      .map((item) => item.id),
  );

  const last = purchases.at(-1);
  const pickUpIds = pickUpItems(
    data.items.filter((item) => !staying.has(item.id)),
    (item) => {
      const aisle = aisleOf.get(item.id);
      return aisle?.isUnsorted ? undefined : aisle?.id;
    },
    passedAisles(purchases),
    session,
  );
  const findAisle = (id: ID | undefined) =>
    data.aisles.find((aisle) => aisle.id === id && !aisle.isUnsorted);
  // Rayon ouvert disparu depuis (supprimé à la clôture, puis courses rouvertes) :
  // celui de la dernière coche, jamais un nouveau rayon en tête du magasin.
  const placing =
    findAisle(placingAisle(session.openedAisle, last)) ??
    findAisle(last?.aisleId);

  const byAisle = new Map(
    grouped
      .filter(({ aisle }) => !aisle.isUnsorted)
      .map(({ aisle, items }) => [aisle.id, items]),
  );
  // Le rayon en cours reste affiché même vide : c'est là que vont les coches.
  if (placing && !byAisle.has(placing.id)) byAisle.set(placing.id, []);
  const groups = sortAisles(data.aisles).flatMap((aisle) => {
    const items = byAisle.get(aisle.id);
    if (!items) return [];
    const own = items.filter(
      (item) => !pickUpIds.has(item.id) && !staying.has(item.id),
    );
    if (own.length === 0 && aisle.id !== placing?.id) return [];
    return [
      {
        aisle,
        items: own,
        // Le rayon en cours reste ouvert tant qu'on y range.
        done:
          aisle.id !== placing?.id &&
          own.every((item) => item.status !== "todo"),
      },
    ];
  });
  const unplaced = [
    ...(grouped
      .find(({ aisle }) => aisle.isUnsorted)
      ?.items.filter((item) => !pickUpIds.has(item.id)) ?? []),
    ...data.items.filter((item) => staying.has(item.id)),
  ];
  const current =
    placing?.id ??
    currentAisle(
      groups.map((g) => ({ id: g.aisle.id, hasTodo: !g.done })),
      last?.aisleId,
    );
  return {
    groups,
    pickUp: data.items.filter((item) => pickUpIds.has(item.id)),
    unplaced,
    placing,
    current,
    here: last?.aisleId,
    aisleOf,
    progress: shoppingProgress(data.items),
  };
}

/**
 * Ce que fait la coche d'une ligne à prendre (C4) : sans rayon (ou dans « À placer »),
 * elle est rangée dans le rayon en cours ; sinon cochée dans son rayon, ou dans celui
 * où l'article a été pris (`aisleId`). `lastOfAisle` : plus rien à prendre dans ce
 * rayon, ni dans le rayon affiché ni dans « À récupérer » (une ligne restée dans
 * « À placer » sera rangée ailleurs : elle ne compte pas).
 */
export function checkAction(
  view: Pick<ShoppingView, "aisleOf" | "unplaced" | "groups" | "pickUp">,
  item: ListItem,
  aisleId?: ID,
):
  | { kind: "place" }
  | { kind: "check"; aisleId: ID; lastOfAisle: boolean }
  | undefined {
  const own = view.aisleOf.get(item.id);
  const unplaced = view.unplaced.some((other) => other.id === item.id);
  if (!aisleId && (unplaced || !own || own.isUnsorted))
    return { kind: "place" };
  const target = aisleId ?? own?.id;
  if (!target) return undefined;
  const remaining = [
    ...(view.groups.find((g) => g.aisle.id === target)?.items ?? []),
    ...view.pickUp.filter((other) => view.aisleOf.get(other.id)?.id === target),
  ];
  const lastOfAisle = !remaining.some(
    (other) => other.id !== item.id && other.status === "todo",
  );
  return { kind: "check", aisleId: target, lastOfAisle };
}
