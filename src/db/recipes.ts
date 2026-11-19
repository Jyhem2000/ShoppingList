import type { ID, Recipe } from "@/domain/model";
import { stepAmount } from "@/domain/quantity";
import { recipeMerge, type RecipeAddLine } from "@/domain/recipes";
import type { ShoppingDatabase } from "./database";
import { activeItems } from "./items";
import { applyListMerge } from "./lists";

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

type Ingredient = Recipe["ingredients"][number];

/** Modifie les ingrédients d'une recette à partir de leur état actuel en base. */
async function editIngredients(
  database: ShoppingDatabase,
  recipeId: ID,
  edit: (ingredients: Ingredient[]) => Ingredient[],
  now: number,
): Promise<void> {
  await database.transaction("rw", database.recipes, async () => {
    const recipe = await database.recipes.get(recipeId);
    if (!recipe) return;
    await database.recipes.update(recipeId, {
      ingredients: edit([...recipe.ingredients]),
      updatedAt: now,
    });
  });
}

/** Ajoute un ingrédient en fin de recette (barre d'ajout, docs/03 E1). */
export async function addIngredient(
  database: ShoppingDatabase,
  recipeId: ID,
  ingredient: Ingredient,
  now = Date.now(),
): Promise<void> {
  await editIngredients(
    database,
    recipeId,
    (ingredients) => [...ingredients, ingredient],
    now,
  );
}

/** Change un ingrédient (quantité, unité, sortes, facultatif, quantité fixe). */
export async function updateIngredient(
  database: ShoppingDatabase,
  recipeId: ID,
  index: number,
  changes: Partial<Ingredient>,
  now = Date.now(),
): Promise<void> {
  await editIngredients(
    database,
    recipeId,
    (ingredients) =>
      ingredients.map((ingredient, i) =>
        i === index ? { ...ingredient, ...changes } : ingredient,
      ),
    now,
  );
}

/**
 * − / + d'un ingrédient, comme une ligne (docs/02 § 5) : un pas de son unité, qui
 * change au besoin (950 g → 1 kg). Calculé depuis la recette enregistrée : des appuis
 * rapprochés s'enchaînent sans se perdre.
 */
export async function stepIngredient(
  database: ShoppingDatabase,
  recipeId: ID,
  index: number,
  direction: 1 | -1,
  now = Date.now(),
): Promise<void> {
  await database.transaction(
    "rw",
    [database.recipes, database.units, database.articles],
    async () => {
      const ingredient = (await database.recipes.get(recipeId))?.ingredients[
        index
      ];
      if (!ingredient) return;
      const units = await database.units.toArray();
      const unit = units.find((u) => u.id === ingredient.unitId);
      const article = await database.articles.get(ingredient.articleId);
      const home = units.find((u) => u.id === article?.defaultUnitId);
      const next =
        unit &&
        stepAmount({ quantity: ingredient.quantity, unit }, direction, units, {
          home,
        });
      if (next)
        await updateIngredient(
          database,
          recipeId,
          index,
          { quantity: next.quantity, unitId: next.unit.id },
          now,
        );
    },
  );
}

/** Retire un ingrédient de la recette. */
export async function removeIngredient(
  database: ShoppingDatabase,
  recipeId: ID,
  index: number,
  now = Date.now(),
): Promise<void> {
  await editIngredients(
    database,
    recipeId,
    (ingredients) => ingredients.filter((_, i) => i !== index),
    now,
  );
}

/** Copie complète, sous le nom donné (demandé à la duplication). */
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
