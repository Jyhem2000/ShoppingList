import { useState } from "react";
import { db } from "@/db/database";
import { createList, reorderLists } from "@/db/lists";
import { updateSettings } from "@/db/settings";
import type { ID, ShoppingList } from "@/domain/model";
import { fr } from "@/i18n/fr";
import { AddButton } from "@/ui/AddButton";
import { Button } from "@/ui/button";
import { Field, TextInput, FieldLabel, CheckRow, ChoiceMark } from "@/ui/form";
import { Sheet } from "@/ui/Sheet";
import { useSortableRow } from "@/ui/sortable";
import { DragHandle, SortableList } from "@/ui/SortableList";
import { cn } from "@/ui/utils";
import type { ListData } from "@/common/useListData";
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
  const { isDragging, rowProps, handleProps } = useSortableRow(list.id);
  return (
    <li
      {...rowProps}
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
        <span className={cn("truncate", current && "text-secondary")}>
          {list.name}
        </span>
      </RowButton>
      <DragHandle {...handleProps} aria-label={t.reorder(list.name)} />
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

  return (
    <Sheet
      onClose={() => {
        onClose();
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
          <SortableList
            items={data.lists}
            nameOf={(list) => list.name}
            onReorder={(ids) => void reorderLists(db, ids)}
            renderItem={(list) => (
              <ListRow
                key={list.id}
                list={list}
                current={list.id === data.list.id}
                onSelect={() => {
                  void updateSettings(db, { currentListId: list.id });
                  onClose();
                }}
              />
            )}
          />
          <AddButton
            label={t.newList}
            onClick={() => {
              setCreating(true);
            }}
          />
        </div>
      )}
    </Sheet>
  );
}
