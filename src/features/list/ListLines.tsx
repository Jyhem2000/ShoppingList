import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { groupListByCategory } from "@/domain/categories";
import type { ID, ListItem } from "@/domain/model";
import { inSeason } from "@/domain/season";
import { useMonth } from "@/ui/useNow";
import { fr } from "@/i18n/fr";
import { AisleSection } from "@/ui/AisleHeader";
import { ItemRow } from "@/ui/ItemRow";
import { useOnPulse } from "@/ui/pulse";
import { PulseLine } from "@/ui/PulseLine";
import { SwipeToDelete } from "@/ui/SwipeToDelete";
import {
  catalogOrder,
  joinDetails,
  lineDetails,
  lineQuantity,
  recipeOrigin,
} from "@/common/format";
import type { ListData } from "@/common/useListData";
import { withMember } from "@/domain/collections";
import { countTodo } from "@/domain/shopping";

/**
 * Lignes de la liste groupées par catégorie (docs/03 B1) : une liste ne dépend d'aucun
 * magasin ; les rayons n'apparaissent qu'en mode courses. Tap sur une ligne : sa fiche ;
 * glisser à gauche : retirer.
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
  const month = useMonth();
  // Une ligne qui doit se montrer (article déjà dans la liste) : sa catégorie se déplie.
  useOnPulse((id) => {
    const item = data.items.find((i) => i.id === id);
    const categoryId = item && data.articleById.get(item.articleId)?.categoryId;
    if (!categoryId) return;
    setCollapsed((current) => withMember(current, categoryId, false));
  });
  const groups = useMemo(
    () =>
      groupListByCategory(
        data.items,
        data.articleById,
        data.categories,
        catalogOrder,
      ),
    [data],
  );

  return (
    <div className="flex flex-col gap-4 px-3">
      {groups.map(({ category, items }) => {
        const expanded = !collapsed.has(category.id);
        const remaining = countTodo(items);
        return (
          <AisleSection
            key={category.id}
            label={category.name}
            icon={category.icon}
            color={category.color}
            count={remaining}
            expanded={expanded}
            onToggle={() => {
              setCollapsed((current) =>
                withMember(current, category.id, expanded),
              );
            }}
          >
            {/* Nouvelle ligne : apparition avec un léger rebond (docs/05 § 6). */}
            <AnimatePresence initial={false}>
              {items.map((item) => {
                const article = data.articleById.get(item.articleId);
                if (!article) return null;

                return (
                  <motion.div
                    key={item.id}
                    layout="position"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  >
                    <PulseLine id={item.id}>
                      <SwipeToDelete
                        label={`${article.name} — ${fr.list.swipeHint}`}
                        onDelete={() => {
                          onRemove(item);
                        }}
                      >
                        <ItemRow
                          label={article.name}
                          icon={article.icon}
                          color={category.color}
                          details={joinDetails(
                            item.status === "unavailable" &&
                              fr.list.unavailableLastTime,
                            lineDetails(item),
                            recipeOrigin(item, data.recipeById),
                          )}
                          quantity={lineQuantity(item, data.unitById)}
                          checked={item.status === "checked"}
                          inSeason={inSeason(article, month)}
                          onClick={() => {
                            onOpen(item);
                          }}
                        />
                      </SwipeToDelete>
                    </PulseLine>
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
