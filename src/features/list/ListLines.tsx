import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { groupListForStore } from "@/domain/aisles";
import type { ID, ListItem } from "@/domain/model";
import { fr } from "@/i18n/fr";
import { AisleSection } from "@/ui/AisleHeader";
import { ItemRow } from "@/ui/ItemRow";
import { SwipeToDelete } from "@/ui/SwipeToDelete";
import { lineDetails, lineQuantity, paletteColor } from "./format";
import type { ListData } from "./useListData";

/**
 * Lignes de la liste groupées par rayon du magasin choisi (docs/03 B1). Tap sur
 * une ligne : sa fiche ; glisser à gauche : retirer.
 */
export function ListLines({
  data,
  onOpen,
  onRemove,
}: {
  data: ListData;
  onOpen: (item: ListItem) => void;
  onRemove: (item: ListItem) => void;
}) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<ID>>(new Set());
  const groups = useMemo(
    () =>
      data.store
        ? groupListForStore(
            data.items,
            data.articleById,
            data.store.id,
            data.aisles,
            data.overrides,
            data.store.articleOrder,
          )
        : [],
    [data],
  );

  return (
    <div className="flex flex-col gap-4 px-3">
      {groups.map(({ aisle, items }) => {
        const expanded = !collapsed.has(aisle.id);
        const remaining = items.filter((i) => i.status === "todo").length;
        return (
          <AisleSection
            key={aisle.id}
            label={aisle.name}
            icon={aisle.icon}
            color={paletteColor(aisle.color)}
            count={remaining}
            expanded={expanded}
            outlined
            onToggle={() => {
              setCollapsed((current) => {
                const next = new Set(current);
                if (expanded) next.add(aisle.id);
                else next.delete(aisle.id);
                return next;
              });
            }}
          >
            {/* Nouvelle ligne : apparition avec un léger rebond (docs/05 § 6). */}
            <AnimatePresence initial={false}>
              {items.map((item) => {
                const article = data.articleById.get(item.articleId);
                if (!article) return null;
                const category = data.categoryById.get(article.categoryId);
                return (
                  <motion.div
                    key={item.id}
                    layout="position"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  >
                    <SwipeToDelete
                      label={`${article.name} — ${fr.list.swipeHint}`}
                      onDelete={() => {
                        onRemove(item);
                      }}
                    >
                      <ItemRow
                        label={article.name}
                        icon={article.icon}
                        color={paletteColor(category?.color)}
                        details={
                          item.status === "unavailable"
                            ? [fr.list.unavailableLastTime, lineDetails(item)]
                                .filter(Boolean)
                                .join(" · ")
                            : lineDetails(item)
                        }
                        quantity={lineQuantity(item, data.unitById)}
                        checked={item.status === "checked"}
                        onClick={() => {
                          onOpen(item);
                        }}
                      />
                    </SwipeToDelete>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </AisleSection>
        );
      })}
    </div>
  );
}
