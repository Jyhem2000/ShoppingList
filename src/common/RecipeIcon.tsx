import type { Recipe } from "@/domain/model";
import type { PaletteColor } from "@/ui/palette";
import { ProductIcon } from "@/ui/ProductIcon";

/** Couleur du monogramme d'une recette sans icône. */
export const RECIPE_COLOR: PaletteColor = "ambre";

/** Icône d'une recette : son icône dessinée, sinon son monogramme. */
export function RecipeIcon({
  recipe,
  size = 28,
}: {
  recipe: Pick<Recipe, "icon" | "name">;
  size?: number;
}) {
  return (
    <ProductIcon
      icon={recipe.icon}
      label={recipe.name}
      color={RECIPE_COLOR}
      size={size}
    />
  );
}
