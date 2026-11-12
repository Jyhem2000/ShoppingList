import { useState } from "react";
import type { Article } from "@/domain/model";
import { fr } from "@/i18n/fr";
import { CatalogCard } from "@/ui/CatalogCard";
import { lineQuantity, paletteColor } from "@/features/list/format";
import { useAddToList } from "@/features/list/useAddToList";
import type { ListData } from "@/features/list/useListData";
import { QuantitySheet } from "./QuantitySheet";

/**
 * Grille d'articles du catalogue (docs/03 A5) : un tap ajoute l'article absent
 * avec sa quantité par défaut ; s'il est déjà dans la liste, sa pastille de
 * quantité s'affiche et un tap ouvre le réglage − / + / ✕ au lieu d'ajouter.
 */
export function ArticleGrid({
  articles,
  data,
}: {
  articles: Article[];
  data: ListData;
}) {
  const adding = useAddToList(data);
  const [open, setOpen] = useState<string | null>(null);
  const inList = new Map(data.items.map((item) => [item.articleId, item]));
  const openItem = open
    ? data.items.find((item) => item.id === open)
    : undefined;

  if (articles.length === 0)
    return (
      <p className="px-5 pt-6 text-center text-muted-foreground">
        {fr.catalog.noResult}
      </p>
    );

  return (
    <>
      <div className="grid grid-cols-3 gap-2 px-3">
        {articles.map((article) => {
          const item = inList.get(article.id);
          const category = data.categoryById.get(article.categoryId);
          return (
            <CatalogCard
              key={article.id}
              label={article.name}
              icon={article.icon}
              color={paletteColor(category?.color)}
              quantity={item ? lineQuantity(item, data.unitById) : undefined}
              onClick={() => {
                if (item) setOpen(item.id);
                else void adding.pick(article);
              }}
            />
          );
        })}
      </div>
      {openItem && (
        <QuantitySheet
          key={openItem.id}
          item={openItem}
          data={data}
          onClose={() => {
            setOpen(null);
          }}
        />
      )}
    </>
  );
}
