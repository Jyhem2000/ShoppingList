import { AnimatePresence, motion } from "motion/react";
import type { ID } from "@/domain/model";
import { inSeason, monthOf } from "@/domain/season";
import type { Suggestion } from "@/domain/suggestions";
import { fr } from "@/i18n/fr";
import { quantitiesInList } from "@/common/format";
import { useCatalogPick } from "@/common/useCatalogPick";
import type { ListData } from "@/common/useListData";
import { Button } from "@/ui/button";
import { QuantityText } from "@/ui/PreviewRow";
import { ProductIcon } from "@/ui/ProductIcon";
import { RowButton, RowText } from "@/ui/RowButton";
import { SeasonBadge } from "@/ui/SeasonBadge";

const t = fr.tour;
const DAY = 24 * 60 * 60 * 1000;

/**
 * Articles à racheter (docs/03 D1) : icône, nom, rythme d'achat et dernier achat. Un
 * toucher ajoute l'article (déjà dans la liste : le réglage de sa quantité, comme au
 * catalogue) ; « Pas cette fois » l'écarte jusqu'aux prochaines courses terminées.
 */
export function RestockRows({
  suggestions,
  data,
  now,
  onDismiss,
}: {
  suggestions: Suggestion[];
  data: ListData;
  now: number;
  onDismiss: (articleId: ID) => void;
}) {
  const { pick, sheet } = useCatalogPick(data);
  const inList = quantitiesInList(data.items, data.unitById);
  const month = monthOf(now);

  return (
    <>
      <ul className="mx-4 divide-y divide-border overflow-hidden rounded-2xl bg-surface">
        <AnimatePresence initial={false}>
          {suggestions.map(({ articleId, rhythm }) => {
            const article = data.articleById.get(articleId);
            if (!article) return null;
            const quantity = inList.get(articleId);
            const color = data.categoryById.get(article.categoryId)?.color;
            return (
              <motion.li
                key={articleId}
                // Sortie : la ligne se replie (contenu rogné). Pas d'opacité : animée par
                // le navigateur, elle ne se termine pas toujours sous le WebKit des tests,
                // et la ligne écartée resterait affichée.
                layout="position"
                exit={{ height: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                className="flex items-center overflow-hidden"
              >
                <RowButton
                  className="min-w-0 flex-1 pr-2"
                  icon={
                    <ProductIcon
                      icon={article.icon}
                      label={article.name}
                      color={color}
                      size={32}
                    />
                  }
                  trailing={
                    quantity !== undefined && (
                      <QuantityText>{quantity}</QuantityText>
                    )
                  }
                  onClick={() => {
                    pick(article);
                  }}
                >
                  <RowText
                    wrap
                    title={
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate">{article.name}</span>
                        {inSeason(article, month) && <SeasonBadge />}
                      </span>
                    }
                    detail={t.rhythm(
                      Math.max(1, Math.round(rhythm.interval / DAY)),
                      Math.max(1, Math.round((now - rhythm.last) / DAY)),
                    )}
                  />
                </RowButton>
                {quantity === undefined && (
                  <Button
                    variant="iconMuted"
                    className="mr-1 px-3 text-sm"
                    aria-label={t.notThisTimeLabel(article.name)}
                    onClick={() => {
                      onDismiss(articleId);
                    }}
                  >
                    {t.notThisTime}
                  </Button>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {sheet}
    </>
  );
}
