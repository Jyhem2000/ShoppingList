import { groupListByCategory } from "@/domain/categories";
import { markdownToText } from "@/domain/markdown";
import type { Recipe } from "@/domain/model";
import { yieldLabel } from "@/domain/recipes";
import {
  buildSharedList,
  buildSharedRecipe,
  shareLink,
  sharedItems,
} from "@/domain/share";
import {
  catalogOrder,
  lineDetails,
  lineQuantity,
} from "@/features/list/format";
import type { ListData } from "@/features/list/useListData";
import { fr } from "@/i18n/fr";
import { copyText } from "@/platform/clipboard";
import { shareText } from "@/platform/share";
import { showToast } from "@/ui/toast";

const t = fr.share;

/** Adresse de l'app, sans `#` : base du lien d'import. */
export function appAddress(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}

/** Peut-on partager la liste ? (il reste quelque chose à acheter) */
export function canShare(data: ListData): boolean {
  return sharedItems(data.items).length > 0;
}

/**
 * Message de partage d'une liste (docs/03 F1) : la liste lisible, groupée par
 * catégorie, une puce par article (le message se relit aussi par « Coller une liste »,
 * docs/03 A8), puis le lien d'import qui porte les données complètes.
 */
export function listMessage(data: ListData): string {
  const items = sharedItems(data.items);
  const shared = buildSharedList(data.list.name, items, data);
  const lines = [t.messageTitle(data.list.name, items.length)];
  for (const group of groupListByCategory(
    items,
    data.articleById,
    data.categories,
    catalogOrder,
  )) {
    lines.push("", group.category.name);
    for (const item of group.items) {
      const name = data.articleById.get(item.articleId)?.name ?? "";
      const details = lineDetails(item);
      lines.push(
        `• ${name} ${lineQuantity(item, data.unitById)}${details ? ` (${details})` : ""}`,
      );
    }
  }
  lines.push("", t.messageLink, shareLink(appAddress(), shared));
  return lines.join("\n");
}

/**
 * Message de partage d'une recette (docs/03 E3) : son nom et son rendement, ses
 * ingrédients (une puce chacun), ses étapes en texte simple, puis le lien d'import.
 */
export function recipeMessage(recipe: Recipe, data: ListData): string {
  const shared = buildSharedRecipe(recipe, data);
  const lines = [
    t.recipeMessageTitle(
      recipe.name,
      yieldLabel(recipe.yield.quantity, recipe.yield.unit),
    ),
  ];
  if (recipe.ingredients.length) {
    lines.push("", fr.recipes.ingredients);
    for (const ingredient of recipe.ingredients) {
      const name = data.articleById.get(ingredient.articleId)?.name;
      if (!name) continue;
      const details = [
        lineDetails(ingredient),
        ingredient.optional ? fr.recipes.optional : undefined,
        ingredient.fixed ? fr.recipes.fixed : undefined,
      ]
        .filter(Boolean)
        .join(", ");
      lines.push(
        `• ${name} ${lineQuantity(ingredient, data.unitById)}${details ? ` (${details})` : ""}`,
      );
    }
  }
  const steps = recipe.steps?.trim();
  if (steps) lines.push("", fr.recipes.steps, markdownToText(steps));
  lines.push("", t.recipeMessageLink, shareLink(appAddress(), shared));
  return lines.join("\n");
}

/**
 * Envoie un message de partage (docs/03 F1, E3) par la feuille de partage du
 * téléphone ; sans feuille de partage, il est copié, à coller dans une messagerie.
 */
export async function sendMessage(
  message: string,
  copied: string,
): Promise<void> {
  if ((await shareText(message)) !== "unsupported") return;
  const done = await copyText(Promise.resolve(message));
  showToast(done ? copied : t.shareError, {
    tone: done ? "success" : "error",
  });
}
