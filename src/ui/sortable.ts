import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DndContextProps, UniqueIdentifier } from "@dnd-kit/core";
import { texts } from "@/i18n";

const t = texts.sortable;

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

/**
 * Une ligne de `SortableList` : `rowProps` va sur le `<li>`, `handleProps` sur la
 * `DragHandle` ; `isDragging` pendant le glissement. `disabled` : ligne fixe.
 */
export function useSortableRow(id: string, disabled = false) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });
  return {
    isDragging,
    rowProps: {
      ref: setNodeRef,
      style: { transform: CSS.Transform.toString(transform), transition },
    },
    handleProps: { ...attributes, ...listeners },
  };
}
