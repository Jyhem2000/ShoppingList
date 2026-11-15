import type { DndContextProps, UniqueIdentifier } from "@dnd-kit/core";
import { fr } from "@/i18n/fr";

const t = fr.sortable;

/**
 * Consignes et annonces du glisser-déposer pour le lecteur d'écran, en français et
 * avec les noms des éléments (dnd-kit annonce sinon en anglais, avec leurs
 * identifiants). `ids` : l'ordre affiché ; `nameOf` : le nom d'un élément.
 */
export function sortableAccessibility(
  ids: readonly UniqueIdentifier[],
  nameOf: (id: UniqueIdentifier) => string,
): NonNullable<DndContextProps["accessibility"]> {
  const position = (id: UniqueIdentifier) => ids.indexOf(id) + 1;
  return {
    screenReaderInstructions: { draggable: t.instructions },
    announcements: {
      onDragStart: ({ active }) => t.picked(nameOf(active.id)),
      onDragOver: ({ active, over }) =>
        over
          ? t.over(nameOf(active.id), position(over.id), ids.length)
          : undefined,
      onDragEnd: ({ active, over }) =>
        over
          ? t.dropped(nameOf(active.id), position(over.id), ids.length)
          : t.cancelled(nameOf(active.id)),
      onDragCancel: ({ active }) => t.cancelled(nameOf(active.id)),
    },
  };
}
