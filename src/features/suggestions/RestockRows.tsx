import { AnimatePresence, motion } from "motion/react";
import type { ID } from "@/domain/model";
import { inSeason, monthOf } from "@/domain/season";
import type { Suggestion } from "@/domain/suggestions";
import { texts } from "@/i18n";
import { quantitiesInList } from "@/common/format";
import { DAY_MS } from "@/common/time";
import { useCatalogPick } from "@/common/useCatalogPick";
import type { ListData } from "@/common/useListData";
import { Button } from "@/ui/button";
import { QuantityText } from "@/ui/PreviewRow";
import { ArticleIcon } from "@/ui/ArticleIcon";
import { RowButton, RowText } from "@/ui/RowButton";
import { SeasonLabel } from "@/ui/SeasonBadge";

const t = texts.tour;

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
                    <ArticleIcon
                      article={article}
                      category={data.categoryById.get(article.categoryId)}
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
                      <SeasonLabel inSeason={inSeason(article, month)}>
                        <span className="truncate">{article.name}</span>
                      </SeasonLabel>
                    }
                    detail={t.rhythm(
                      Math.max(1, Math.round(rhythm.interval / DAY_MS)),
                      Math.max(1, Math.round((now - rhythm.last) / DAY_MS)),
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
