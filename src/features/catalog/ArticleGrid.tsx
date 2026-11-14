import { useNavigate } from "react-router";
import { manageArticlePath } from "@/app/routes";
import type { Article } from "@/domain/model";
import { fr } from "@/i18n/fr";
import { CatalogCard } from "@/ui/CatalogCard";
import { lineQuantity } from "@/features/list/format";
import type { ListData } from "@/features/list/useListData";
import { useCatalogPick } from "./useCatalogPick";
import { paletteColor } from "@/ui/palette";
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
  const { pick, sheet } = useCatalogPick(data);
  const navigate = useNavigate();
  const inList = new Map(data.items.map((item) => [item.articleId, item]));

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
                pick(article);
              }}
              onLongPress={() => {
                void navigate(manageArticlePath(article.id));
              }}
            />
          );
        })}
      </div>
      {sheet}
    </>
  );
}
