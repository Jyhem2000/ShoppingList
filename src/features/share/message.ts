import { groupListByCategory } from "@/domain/categories";
import { buildSharedList, shareLink, sharedItems } from "@/domain/share";
import {
  catalogOrder,
  lineDetails,
  lineQuantity,
} from "@/features/list/format";
import type { ListData } from "@/features/list/useListData";
import { fr } from "@/i18n/fr";

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
 * Message de partage (docs/03 F1) : la liste lisible, groupée par catégorie, une puce
 * par article (le message se relit aussi par « Coller une liste », docs/03 A8), puis
 * le lien d'import qui porte les données complètes.
 */
export function shareMessage(data: ListData): string {
  const items = sharedItems(data.items);
  const shared = buildSharedList(
    data.list.name,
    items,
    data.articleById,
    data.categoryById,
    data.unitById,
  );
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
