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
  shoppingProgress,
} from "@/domain/shopping";
import type { ListData } from "@/features/list/useListData";

export interface ShoppingGroup extends AisleGroup<Aisle, ListItem> {
  /** Plus rien à prendre dans ce rayon (C2) : replié, avec une coche. */
  done: boolean;
}

export interface ShoppingView {
  groups: ShoppingGroup[];
  /** « À récupérer » (C4), en haut. */
  pickUp: ListItem[];
  current: ID | undefined;
  passed: Set<ID>;
  aisleOf: Map<ID, Aisle>;
  progress: { checked: number; total: number };
}

/** Ce qu'affiche le mode courses : rayons, état de chacun, « À récupérer », progression. */
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
    const passed = passedAisles(purchases);
    const pickUpIds = pickUpItems(
      data.items,
      (item) => aisleOf.get(item.id)?.id,
      passed,
      session,
    );
    const hide = data.settings.checkedBehavior === "hide";
    const groups = grouped.flatMap(({ aisle, items }) => {
      const own = items.filter((item) => !pickUpIds.has(item.id));
      if (own.length === 0) return [];
      return [
        {
          aisle,
          items: hide ? own.filter((item) => item.status !== "checked") : own,
          done: own.every((item) => item.status !== "todo"),
        },
      ];
    });
    const current = currentAisle(
      groups.map((g) => ({ id: g.aisle.id, hasTodo: !g.done })),
      purchases.at(-1)?.aisleId,
    );
    return {
      groups,
      pickUp: data.items.filter((item) => pickUpIds.has(item.id)),
      current,
      passed,
      aisleOf,
      progress: shoppingProgress(data.items),
    };
  }, [data, session, purchases]);
}
