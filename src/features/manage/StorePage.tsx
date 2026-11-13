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
import { ChevronRight, GripVertical, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { routes } from "@/app/routes";
import { db } from "@/db/database";
import {
  useAisles,
  useArticles,
  useCategories,
  useOverrides,
  useStores,
} from "@/db/hooks";
import {
  addAisle,
  deleteOverride,
  deleteStore,
  reorderAisles,
  setAisleCategoryRole,
  updateStore,
} from "@/db/stores";
import type { Aisle, Category, ID } from "@/domain/model";
import {
  aisleNumbers,
  sortAisles,
  unattachedCategories,
} from "@/domain/stores";
import {
  type AisleText,
  aisleText,
  paletteColor,
} from "@/features/list/format";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { backState } from "@/ui/navigation";
import { GroupIcon } from "@/ui/GroupIcon";
import { EmptyState, PageHeader, Row, Section } from "@/ui/Page";
import { palette } from "@/ui/palette";
import { Sheet } from "@/ui/Sheet";
import { Switch } from "@/ui/switch";
import { showToast } from "@/ui/toast";
import { cn } from "@/ui/utils";
import { AisleSheet } from "./AisleSheet";
import { NameField } from "./NameField";

const t = fr.manage.store;

/**
 * Un magasin (docs/03 G3, docs/04 § 2.8) : nom, apprentissage de l'ordre, rayons
 * (glisser la poignée pour l'ordre, toucher pour les catégories), catégories non
 * rattachées, exceptions par article, suppression.
 */
export function StorePage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const stores = useStores();
  const store = stores?.find((s) => s.id === storeId);
  const aisles = useAisles(storeId);
  const categories = useCategories();
  const overrides = useOverrides();
  const articles = useArticles();
  const [openAisle, setOpenAisle] = useState<ID | null>(null);
  const [placing, setPlacing] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const sorted = useMemo(() => sortAisles(aisles ?? []), [aisles]);
  const movable = sorted.filter((a) => !a.isUnsorted);
  const unsorted = sorted.find((a) => a.isUnsorted);
  const order = movable.map((a) => a.id);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (stores && !store)
    return (
      <>
        <PageHeader
          title={fr.manage.stores.title}
          backTo={routes.manageStores}
        />
        <EmptyState icon={<X className="size-10" />} title={t.missing} />
      </>
    );
  if (!store || !aisles || !categories || !overrides || !articles) return null;

  const aisleById = new Map(aisles.map((a) => [a.id, a]));
  const articleById = new Map(articles.map((a) => [a.id, a]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const numbers = aisleNumbers(aisles);
  const textOf = (aisle: Aisle) =>
    aisleText(aisle, numbers.get(aisle.id), categoryById);
  const unattached = unattachedCategories(aisles, categories);
  const exceptions = overrides.filter((o) => o.storeId === store.id);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const next = arrayMove(
      order,
      order.indexOf(String(active.id)),
      order.indexOf(String(over.id)),
    );
    void reorderAisles(db, next);
  };

  const aisleRow = (aisle: Aisle, sortable: boolean) => (
    <AisleRow
      key={aisle.id}
      aisle={aisle}
      text={textOf(aisle)}
      sortable={sortable}
      onOpen={() => {
        setOpenAisle(aisle.id);
      }}
    />
  );
  const editing = openAisle ? aisleById.get(openAisle) : undefined;

  return (
    <>
      <PageHeader title={store.name} backTo={routes.manageStores} />
      <Section>
        <div className="px-4 py-3">
          <NameField
            key={store.name}
            label={t.name}
            value={store.name}
            onSave={(clean) => void updateStore(db, store.id, { name: clean })}
          />
        </div>
        <Row label={t.learn} hint={t.learnHint}>
          <Switch
            checked={!store.orderLocked}
            aria-label={t.learn}
            onCheckedChange={(on) =>
              void updateStore(db, store.id, { orderLocked: !on })
            }
          />
        </Row>
      </Section>

      <Section title={t.aisles}>
        <p className="px-4 pt-3 pb-3 text-sm text-muted-foreground">
          {t.aislesHint}
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <ul aria-label={t.aisles} className="flex flex-col py-1">
              {order.flatMap((id) => {
                const aisle = aisleById.get(id);
                return aisle ? [aisleRow(aisle, true)] : [];
              })}
            </ul>
          </SortableContext>
        </DndContext>
        {unsorted && <ul className="pb-1">{aisleRow(unsorted, false)}</ul>}
        <div className="px-4 pt-4 pb-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              void addAisle(db, store.id, {
                icon: "shopping-basket",
                color: "gris",
              }).then((aisle) => {
                setOpenAisle(aisle.id);
              });
            }}
          >
            <Plus />
            {t.addAisle}
          </Button>
        </div>
      </Section>

      {unattached.length > 0 && (
        <Section title={t.unattached}>
          <p className="px-4 pt-3 text-sm text-warning">{t.unattachedHint}</p>
          <ul className="py-1">
            {unattached.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPlacing(category);
                  }}
                  className="flex min-h-12 w-full items-center gap-3 px-4 text-left font-semibold active:bg-raised"
                >
                  <GroupIcon
                    name={category.icon}
                    className={cn(
                      "size-5",
                      palette[paletteColor(category.color)].text,
                    )}
                  />
                  <span className="flex-1">{category.name}</span>
                  <ChevronRight
                    className="size-5 text-muted-foreground"
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {exceptions.length > 0 && (
        <Section title={t.overrides}>
          <p className="px-4 pt-3 text-sm text-muted-foreground">
            {t.overridesHint}
          </p>
          <ul className="py-1">
            {exceptions.map((o) => {
              const article = articleById.get(o.articleId);
              const aisle = aisleById.get(o.aisleId);
              if (!article || !aisle) return null;
              return (
                <li
                  key={o.id}
                  className="flex min-h-12 items-center gap-2 pr-2 pl-4"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {article.name}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      → {textOf(aisle).label}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={t.removeOverride(article.name)}
                    onClick={() => {
                      void deleteOverride(db, o.id).then(() => {
                        showToast(t.overrideRemoved(article.name), {
                          tone: "success",
                        });
                      });
                    }}
                    className="flex size-11 items-center justify-center rounded-xl text-muted-foreground active:bg-raised"
                  >
                    <X className="size-5" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <div className="px-4 pt-6 pb-8">
        <Button
          variant="outline"
          className="w-full border-danger/50 text-danger"
          onClick={() => {
            setConfirmDelete(true);
          }}
        >
          <Trash2 />
          {t.delete}
        </Button>
      </div>

      {editing && (
        <AisleSheet
          key={editing.id}
          aisle={editing}
          aisles={sorted}
          categories={categories}
          onClose={() => {
            setOpenAisle(null);
          }}
        />
      )}
      {placing && (
        <Sheet
          open
          autoFocus={false}
          onOpenChange={(open) => {
            if (!open) setPlacing(null);
          }}
          title={t.place(placing.name)}
          description={t.placeHint}
        >
          <ul className="-mx-2">
            {movable.map((aisle) => {
              const text = textOf(aisle);
              return (
                <li key={aisle.id}>
                  <button
                    type="button"
                    onClick={() => {
                      void setAisleCategoryRole(
                        db,
                        store.id,
                        aisle.id,
                        placing.id,
                        "primary",
                      );
                      setPlacing(null);
                    }}
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left active:bg-raised"
                  >
                    <GroupIcon
                      name={aisle.icon}
                      className={cn(
                        "size-5 shrink-0",
                        palette[paletteColor(aisle.color)].text,
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {text.label}
                      </span>
                      {text.contents && (
                        <span className="block truncate text-sm text-muted-foreground">
                          {text.contents}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Sheet>
      )}
      {confirmDelete && (
        <Sheet
          open
          autoFocus={false}
          onOpenChange={(open) => {
            if (!open) setConfirmDelete(false);
          }}
          title={t.deleteTitle(store.name)}
          description={t.deleteText}
        >
          <div className="flex flex-col gap-3">
            <Button
              variant="destructive"
              onClick={() => {
                void deleteStore(db, store.id).then((result) => {
                  setConfirmDelete(false);
                  if (result === "deleted") {
                    showToast(t.deleted(store.name), { tone: "success" });
                    void navigate(routes.manageStores, {
                      replace: true,
                      state: backState,
                    });
                  } else
                    showToast(
                      result === "last" ? t.deleteLast : t.deleteShopping,
                      { tone: "warning" },
                    );
                });
              }}
            >
              {t.delete}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDelete(false);
              }}
            >
              {fr.manage.confirmCancel}
            </Button>
          </div>
        </Sheet>
      )}
    </>
  );
}

function AisleRow({
  aisle,
  text,
  sortable,
  onOpen,
}: {
  aisle: Aisle;
  text: AisleText;
  sortable: boolean;
  onOpen: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: aisle.id, disabled: !sortable });
  const color = paletteColor(aisle.color);
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center bg-surface",
        isDragging && "relative z-10 rounded-xl bg-raised shadow-lg",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 pl-4 text-left active:bg-raised"
      >
        <span
          className={cn("h-8 w-1 shrink-0 rounded-full", palette[color].solid)}
        />
        <GroupIcon
          name={aisle.icon}
          className={cn("size-5 shrink-0", palette[color].text)}
        />
        <span className="min-w-0 flex-1">
          {text.kicker && (
            <span className="block text-xs leading-tight font-bold tracking-widest text-muted-foreground uppercase">
              {text.kicker}
            </span>
          )}
          <span className="line-clamp-2 font-semibold">{text.title}</span>
          <span className="block truncate text-sm text-muted-foreground">
            {aisle.isUnsorted
              ? t.always
              : (text.description ?? t.categories(aisle.categories.length))}
          </span>
        </span>
      </button>
      {sortable ? (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={t.reorder(text.label)}
          className="flex size-12 shrink-0 touch-none items-center justify-center text-muted-foreground"
        >
          <GripVertical className="size-5" aria-hidden />
        </button>
      ) : (
        <span className="size-12 shrink-0" />
      )}
    </li>
  );
}
