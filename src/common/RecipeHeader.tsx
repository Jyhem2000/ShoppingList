import type { Recipe } from "@/domain/model";
import { yieldLabel } from "@/domain/recipes";
import { fr } from "@/i18n/fr";
import { cn } from "@/ui/utils";
import { RecipeIcon } from "./RecipeIcon";

/**
 * En-tête d'une recette (docs/04 § 2.6) : sa grande icône et son rendement, et son nom
 * quand le titre de l'écran ne le donne pas (recette reçue, docs/03 E3).
 */
export function RecipeHeader({
  recipe,
  withName = false,
  className,
}: {
  recipe: Pick<Recipe, "name" | "icon" | "yield">;
  withName?: boolean;
  className?: string;
}) {
  const serves = fr.recipes.serves(
    yieldLabel(recipe.yield.quantity, recipe.yield.unit),
  );
  return (
    <div className={cn("flex items-center gap-4 px-4 pt-1", className)}>
      <RecipeIcon recipe={recipe} size={56} />
      {withName ? (
        <div className="min-w-0">
          <p className="text-lg font-semibold">{recipe.name}</p>
          <p className="text-muted-foreground">{serves}</p>
        </div>
      ) : (
        <p className="text-lg font-semibold">{serves}</p>
      )}
    </div>
  );
}
