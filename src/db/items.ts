import type { ID, ListItem } from "@/domain/model";
import type { ShoppingDatabase } from "./database";

/**
 * Lignes d'une liste (docs/02 § 6). Une seule ligne par article dans une liste,
 * hors lignes archivées (clôturées) : cette règle est garantie ici.
 */
export type NewListItem = Pick<
  ListItem,
  "listId" | "articleId" | "quantity" | "unitId"
> &
  Partial<Pick<ListItem, "acceptedTypes" | "note">>;

export type AddItemResult =
  | { kind: "added"; item: ListItem }
  /** Déjà dans la liste : rien n'est modifié, l'interface propose d'ajouter. */
  | { kind: "exists"; item: ListItem };

/** Ligne active (non archivée) de cet article dans la liste. */
export async function findActiveItem(
  database: ShoppingDatabase,
  listId: ID,
  articleId: ID,
): Promise<ListItem | undefined> {
  return database.items
    .where("articleId")
    .equals(articleId)
    .filter((item) => item.listId === listId && !item.closedInSessionId)
    .first();
}

export async function addListItem(
  database: ShoppingDatabase,
  input: NewListItem,
  now = Date.now(),
): Promise<AddItemResult> {
  return database.transaction("rw", database.items, async () => {
    const existing = await findActiveItem(
      database,
      input.listId,
      input.articleId,
    );
    if (existing) return { kind: "exists", item: existing };
    const item: ListItem = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      listId: input.listId,
      articleId: input.articleId,
      quantity: input.quantity,
      unitId: input.unitId,
      acceptedTypes: input.acceptedTypes ?? [],
      note: input.note,
      status: "todo",
      fromRecipes: [],
    };
    await database.items.add(item);
    return { kind: "added", item };
  });
}
