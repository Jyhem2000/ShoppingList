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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import { useState } from "react";
import { db } from "@/db/database";
import { createList, reorderLists } from "@/db/lists";
import { updateSettings } from "@/db/settings";
import type { ID, ShoppingList } from "@/domain/model";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { Field, TextInput, FieldLabel, CheckRow, ChoiceMark } from "@/ui/form";
import { Sheet } from "@/ui/Sheet";
import { cn } from "@/ui/utils";
import type { ListData } from "./useListData";
import { RowButton } from "@/ui/RowButton";
const t = fr.list.lists;

function ListRow({
  list,
  current,
  onSelect,
}: {
  list: ShoppingList;
  current: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-1 rounded-xl bg-surface",
        isDragging && "relative z-10 bg-raised shadow-lg",
      )}
    >
      <RowButton
        inset="sheet"
        className="min-w-0 flex-1 font-semibold"
        onClick={onSelect}
        aria-current={current || undefined}
        icon={<ChoiceMark selected={current} />}
      >
        <span className={cn("truncate", current && "text-primary")}>
          {list.name}
        </span>
      </RowButton>
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={t.reorder(list.name)}
        className="flex size-11 touch-none items-center justify-center text-muted-foreground"
      >
        <GripVertical className="size-5" aria-hidden />
      </button>
    </li>
  );
}

/**
 * Toutes les listes (docs/03 B2) : changer de liste, réordonner (glisser la
 * poignée), créer une liste en y ajoutant le contenu d'autres listes.
 */
export function ListsSheet({
  data,
  onClose,
  onCreated,
}: {
  data: ListData;
  onClose: () => void;
  onCreated: (listId: ID, include: ID[]) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [include, setInclude] = useState<ID[]>([]);
  const [order, setOrder] = useState(data.lists);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = order.findIndex((l) => l.id === active.id);
    const to = order.findIndex((l) => l.id === over.id);
    const next = arrayMove(order, from, to);
    setOrder(next);
    void reorderLists(
      db,
      next.map((l) => l.id),
    );
  };

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={creating ? t.newTitle : t.title}
    >
      {creating ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            void createList(db, name.trim(), data.store?.id).then((list) => {
              onCreated(list.id, include);
            });
          }}
        >
          <Field label={t.name}>
            <TextInput
              value={name}
              autoFocus
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
          </Field>
          <fieldset>
            <FieldLabel as="legend">{t.include}</FieldLabel>
            {data.lists.map((list) => (
              <CheckRow
                key={list.id}
                className="font-semibold"
                checked={include.includes(list.id)}
                onCheckedChange={(checked) => {
                  setInclude((current) =>
                    checked
                      ? [...current, list.id]
                      : current.filter((id) => id !== list.id),
                  );
                }}
              >
                {list.name}
              </CheckRow>
            ))}
          </fieldset>
          <Button type="submit" disabled={!name.trim()}>
            {t.create}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={order.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col">
                {order.map((list) => (
                  <ListRow
                    key={list.id}
                    list={list}
                    current={list.id === data.list.id}
                    onSelect={() => {
                      void updateSettings(db, { currentListId: list.id });
                      onClose();
                    }}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <Button
            variant="outline"
            onClick={() => {
              setCreating(true);
            }}
          >
            <Plus />
            {t.newList}
          </Button>
        </div>
      )}
    </Sheet>
  );
}
