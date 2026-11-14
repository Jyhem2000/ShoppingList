import { useMemo } from "react";
import { type AisleGroup, groupListForStore } from "@/domain/aisles";
import type {
  Aisle,
  ID,
  ListItem,
  Purchase,
  ShoppingSession,
} from "@/domain/model";
import {
  currentAisle,
  passedAisles,
  pickUpItems,
  placingAisle,
  shoppingProgress,
} from "@/domain/shopping";
import { sortAisles } from "@/domain/stores";
import type { ListData } from "@/features/list/useListData";

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
  /** Rayon après lequel afficher « À placer » ; absent : en tête. */
  unplacedAfter: ID | undefined;
  /** Rayon en cours pour ranger ce qu'on coche dans « À placer ». */
  placing: Aisle | undefined;
  current: ID | undefined;
  /** Rayon de la dernière coche : là où l'on est. */
  here: ID | undefined;
  passed: Set<ID>;
  aisleOf: Map<ID, Aisle>;
  progress: { checked: number; total: number };
}

/** Ce qu'affiche le mode courses : rayons, état de chacun, « À placer », « À récupérer ». */
export function useShoppingView(
  data: ListData | undefined,
  session: ShoppingSession | null | undefined,
  purchases: Purchase[] | undefined,
): ShoppingView | undefined {
  return useMemo(() => {
    if (!data?.store || !session || !purchases) return undefined;
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

    const passed = passedAisles(purchases);
    const pickUpIds = pickUpItems(
      data.items.filter((item) => !staying.has(item.id)),
      (item) => {
        const aisle = aisleOf.get(item.id);
        return aisle?.isUnsorted ? undefined : aisle?.id;
      },
      passed,
      session,
    );
    const placingId = placingAisle(session.openedAisle, purchases.at(-1));
    const findAisle = (id: ID | undefined) =>
      data.aisles.find((aisle) => aisle.id === id && !aisle.isUnsorted);
    // Rayon ouvert disparu depuis (supprimé à la clôture, puis courses rouvertes) :
    // celui de la dernière coche, jamais un nouveau rayon en tête du magasin.
    const placing =
      findAisle(placingId) ?? findAisle(purchases.at(-1)?.aisleId);

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
        purchases.at(-1)?.aisleId,
      );
    return {
      groups,
      pickUp: data.items.filter((item) => pickUpIds.has(item.id)),
      unplaced,
      unplacedAfter: placing?.id,
      placing,
      current,
      here: purchases.at(-1)?.aisleId,
      passed,
      aisleOf,
      progress: shoppingProgress(data.items),
    };
  }, [data, session, purchases]);
}
