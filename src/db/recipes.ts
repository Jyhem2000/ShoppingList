import type { ID, Recipe } from "@/domain/model";
import {
  planRecipeAdd,
  recipeMerge,
  type RecipeAddLine,
} from "@/domain/recipes";
import type { ShoppingDatabase } from "./database";
import { activeItems, applyListMerge } from "./lists";

/**
 * Recettes (docs/02 § 7, docs/03 E1 et E2). Une recette ne garde que des identifiants
 * d'articles et d'unités, jamais de libellé. L'ajouter à une liste crée ou complète des
 * lignes ; ce qui arrive ensuite à ces lignes ne touche jamais la recette.
 */
const newId = () => crypto.randomUUID();

export type RecipeInput = Pick<
  Recipe,
  "name" | "icon" | "yield" | "ingredients" | "steps"
>;

/** Rendement par défaut d'une nouvelle recette : 4 personnes. */
export const DEFAULT_YIELD: Recipe["yield"] = {
  quantity: 4,
  unit: "personnes",
};

export async function createRecipe(
  database: ShoppingDatabase,
  input: RecipeInput,
  now = Date.now(),
): Promise<ID> {
  const id = newId();
  await database.recipes.add({
    ...input,
    name: input.name.trim(),
    id,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateRecipe(
  database: ShoppingDatabase,
  id: ID,
  changes: Partial<RecipeInput>,
  now = Date.now(),
): Promise<void> {
  await database.recipes.update(id, {
    ...changes,
    ...(changes.name !== undefined && { name: changes.name.trim() }),
    updatedAt: now,
  });
}

/** Copie complète, sous le nom donné (« Raclette (copie) »). */
export async function duplicateRecipe(
  database: ShoppingDatabase,
  id: ID,
  name: string,
  now = Date.now(),
): Promise<ID | undefined> {
  const recipe = await database.recipes.get(id);
  if (!recipe) return undefined;
  return createRecipe(
    database,
    {
      name,
      icon: recipe.icon,
      yield: { ...recipe.yield },
      ingredients: recipe.ingredients.map((ingredient) => ({
        ...ingredient,
        acceptedTypes: [...ingredient.acceptedTypes],
      })),
      steps: recipe.steps,
    },
    now,
  );
}

/**
 * Supprimer une recette. Les lignes qu'elle a ajoutées restent dans les listes ; leur
 * origine « via … » disparaît avec elle.
 */
export async function deleteRecipe(
  database: ShoppingDatabase,
  id: ID,
): Promise<void> {
  await database.recipes.delete(id);
}

/** Aperçu de l'ajout à une liste, pour `requested` (dans l'unité de rendement). */
export async function previewRecipeAdd(
  database: ShoppingDatabase,
  recipeId: ID,
  listId: ID,
  requested: number,
): Promise<RecipeAddLine[]> {
  const recipe = await database.recipes.get(recipeId);
  if (!recipe) return [];
  const [target, units] = await Promise.all([
    activeItems(database, listId),
    database.units.toArray(),
  ]);
  return planRecipeAdd(recipe, requested, target, units);
}

/**
 * Ajoute les ingrédients cochés de l'aperçu à la liste : nouvelles lignes, ou quantités
 * fusionnées avec les lignes aux mêmes types (docs/02 § 6). Chaque ligne touchée garde
 * l'origine « via <recette> ». Renvoie le nombre de lignes ajoutées ou complétées.
 */
export async function addRecipeToList(
  database: ShoppingDatabase,
  recipeId: ID,
  listId: ID,
  requested: number,
  lines: readonly RecipeAddLine[],
  now = Date.now(),
): Promise<number> {
  return database.transaction(
    "rw",
    [database.items, database.units],
    async () => {
      // La liste a pu changer depuis l'aperçu : la fusion repart de son état actuel.
      const [target, units] = await Promise.all([
        activeItems(database, listId),
        database.units.toArray(),
      ]);
      const merge = recipeMerge(lines, target, units);
      await applyListMerge(database, listId, merge, now, {
        recipeId,
        amount: requested,
      });
      return merge.length;
    },
  );
}

/** Recettes qui utilisent un article (avant de le supprimer, docs/02 § 2). */
export async function recipesUsing(
  database: ShoppingDatabase,
  articleId: ID,
): Promise<Recipe[]> {
  return database.recipes
    .filter((recipe) =>
      recipe.ingredients.some(
        (ingredient) => ingredient.articleId === articleId,
      ),
    )
    .toArray();
}
