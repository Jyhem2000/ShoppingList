import type { Article, Category } from "@/domain/model";
import { paletteColor } from "@/ui/palette";
import { ProductIcon } from "@/ui/ProductIcon";

/**
 * Icône d'un article dans une ligne (recherche, suggestions, listes de gestion, bilan) :
 * son icône, dans la couleur de sa catégorie. 28 px par défaut.
 */
export function ArticleIcon({
  article,
  category,
  size = 28,
}: {
  article: Pick<Article, "icon" | "name">;
  category: Pick<Category, "color"> | undefined;
  size?: number;
}) {
  return (
    <ProductIcon
      icon={article.icon}
      label={article.name}
      color={paletteColor(category?.color)}
      size={size}
    />
  );
}
