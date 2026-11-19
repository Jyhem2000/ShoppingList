import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { type ComponentProps, type ReactNode, useState } from "react";
import { sortableAccessibility } from "@/ui/sortable";
import { cn } from "@/ui/utils";

/**
 * Liste réordonnable en glissant une poignée (listes, rayons d'un magasin), au doigt
 * ou au clavier, annoncée en français. `onReorder` reçoit le nouvel ordre ; il est
 * affiché aussitôt, sans attendre que la base renvoie les éléments.
 * Chaque ligne appelle `useSortableRow` et pose une `DragHandle`.
 */
export function SortableList<T extends { id: string }>({
  items,
  nameOf,
  onReorder,
  renderItem,
  className,
  ariaLabel,
}: {
  items: readonly T[];
  nameOf: (item: T) => string;
  onReorder: (ids: string[]) => void;
  renderItem: (item: T) => ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  // Ordre choisi, valable tant que la base n'a pas renvoyé d'autres éléments.
  const [moved, setMoved] = useState<{ from: readonly T[]; order: T[] }>();
  const shown = moved?.from === items ? moved.order : items;
  const ids = shown.map((item) => item.id);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const order = arrayMove(
      [...shown],
      ids.indexOf(String(active.id)),
      ids.indexOf(String(over.id)),
    );
    setMoved({ from: items, order });
    onReorder(order.map((item) => item.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={sortableAccessibility(ids, (id) => {
        const item = shown.find((i) => i.id === id);
        return item ? nameOf(item) : "";
      })}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul aria-label={ariaLabel} className={cn("flex flex-col", className)}>
          {shown.map(renderItem)}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

/** Poignée à glisser d'une ligne réordonnable. */
export function DragHandle({
  className,
  ...props
}: Omit<ComponentProps<"button">, "type">) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "flex size-11 shrink-0 touch-none items-center justify-center text-muted-foreground",
        className,
      )}
    >
      <GripVertical className="size-5" aria-hidden />
    </button>
  );
}
