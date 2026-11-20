import { Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { routes } from "@/app/routes";
import { db } from "@/db/database";
import {
  useAisles,
  useArticles,
  useCategories,
  useOverrides,
  usePurchaseStats,
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
import { sortAisles, unattachedCategories } from "@/domain/stores";
import { type AisleText, aisleText, categoryWeights } from "@/common/format";
import { fr } from "@/i18n/fr";
import { AddButton } from "@/ui/AddButton";
import { Button } from "@/ui/button";
import { useGoBack } from "@/ui/navigation";
import { GroupIcon } from "@/ui/GroupIcon";
import { EmptyState, PageHeader, Row, Section } from "@/ui/Page";
import { palette, paletteColor } from "@/ui/palette";
import { Sheet } from "@/ui/Sheet";
import { useSortableRow } from "@/ui/sortable";
import { DragHandle, SortableList } from "@/ui/SortableList";
import { Switch } from "@/ui/switch";
import { showToast } from "@/ui/toast";
import { cn } from "@/ui/utils";
import { AisleSheet } from "./AisleSheet";
import { NameField } from "@/common/NameField";
import { RowButton, RowText } from "@/ui/RowButton";
import { ConfirmActions } from "@/ui/form";
import { feedback } from "@/feedback";
import { byId } from "@/domain/collections";
const t = fr.manage.store;

/** Panneau ouvert : un rayon, une catégorie à placer, ou la suppression du magasin. */
type Panel =
  | { kind: "aisle"; id: ID }
  | { kind: "place"; category: Category }
  | { kind: "delete" }
  | null;

/**
 * Un magasin (docs/03 G3, docs/04 § 2.8) : nom, apprentissage de l'ordre, rayons
 * (glisser la poignée pour l'ordre, toucher pour les catégories), catégories non
 * rattachées, exceptions par article, suppression.
 */
export function StorePage() {
  const { storeId } = useParams();
  const goBack = useGoBack(routes.manageStores);
  // Seulement ce dont l'écran a besoin (pas la liste courante ni les recettes).
  const stores = useStores();
  const store = stores?.find((s) => s.id === storeId);
  const aisles = useAisles(storeId);
  const categories = useCategories();
  const overrides = useOverrides();
  const articles = useArticles();
  const purchaseCounts = usePurchaseStats()?.purchaseCounts;
  const [panel, setPanel] = useState<Panel>(null);

  const sorted = useMemo(() => sortAisles(aisles ?? []), [aisles]);
  // Même tableau tant que les rayons ne changent pas : SortableList garde l’ordre glissé.
  const movable = useMemo(() => sorted.filter((a) => !a.isUnsorted), [sorted]);
  const unsorted = sorted.find((a) => a.isUnsorted);

  if (stores && !store)
    return (
      <>
        <PageHeader
          title={fr.manage.stores.title}
          backTo={routes.manageStores}
        />
        <EmptyState icon={<X />} title={t.missing} />
      </>
    );
  if (
    !store ||
    !aisles ||
    !categories ||
    !overrides ||
    !articles ||
    !purchaseCounts
  )
    return null;

  const aisleById = byId(aisles);
  const articleById = byId(articles);
  const categoryById = byId(categories);
  const weights = categoryWeights(articles, purchaseCounts);
  const textOf = (aisle: Aisle) => aisleText(aisle, categoryById, weights);
  const unattached = unattachedCategories(aisles, categories);
  const exceptions = overrides.filter((o) => o.storeId === store.id);

  const aisleRow = (aisle: Aisle, sortable: boolean) => (
    <AisleRow
      key={aisle.id}
      aisle={aisle}
      text={textOf(aisle)}
      sortable={sortable}
      onOpen={() => {
        setPanel({ kind: "aisle", id: aisle.id });
      }}
    />
  );
  const editing = panel?.kind === "aisle" ? aisleById.get(panel.id) : undefined;
  const placing = panel?.kind === "place" ? panel.category : undefined;

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
        <SortableList
          ariaLabel={t.aisles}
          className="py-1"
          items={movable}
          nameOf={(aisle) => aisle.name}
          onReorder={(ids) => void reorderAisles(db, ids)}
          renderItem={(aisle) => aisleRow(aisle, true)}
        />
        {unsorted && <ul className="pb-1">{aisleRow(unsorted, false)}</ul>}
        <div className="px-4 pt-4 pb-4">
          <AddButton
            label={t.addAisle}
            onClick={() => {
              void addAisle(db, store.id).then((aisle) => {
                setPanel({ kind: "aisle", id: aisle.id });
              });
            }}
          />
        </div>
      </Section>

      {unattached.length > 0 && (
        <Section title={t.unattached}>
          <p className="px-4 pt-3 pb-2 text-sm text-warning">
            {t.unattachedHint}
          </p>
          <ul className="py-1">
            {unattached.map((category) => (
              <li key={category.id}>
                <RowButton
                  icon={
                    <GroupIcon
                      name={category.icon}
                      palette={category.color}
                      className="size-5"
                    />
                  }
                  title={category.name}
                  chevron
                  onClick={() => {
                    setPanel({ kind: "place", category });
                  }}
                />
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
                  <RowText
                    title={article.name}
                    detail={`→ ${textOf(aisle).label}`}
                  />
                  <Button
                    variant="iconMuted"
                    size="icon"
                    aria-label={t.removeOverride(article.name)}
                    onClick={() => {
                      void deleteOverride(db, o.id).then(() => {
                        showToast(t.overrideRemoved(article.name), {
                          tone: "success",
                        });
                      });
                    }}
                  >
                    <X aria-hidden />
                  </Button>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <div className="px-4 pt-6 pb-8">
        <Button
          variant="dangerOutline"
          className="w-full"
          onClick={() => {
            setPanel({ kind: "delete" });
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
          categoryById={categoryById}
          weights={weights}
          onClose={() => {
            setPanel(null);
          }}
        />
      )}
      {placing && (
        <Sheet
          autoFocus={false}
          onClose={() => {
            setPanel(null);
          }}
          title={t.place(placing.name)}
          description={t.placeHint}
        >
          <ul className="-mx-2">
            {movable.map((aisle) => {
              const text = textOf(aisle);
              return (
                <li key={aisle.id}>
                  <RowButton
                    inset="sheet"
                    icon={
                      <GroupIcon
                        name={aisle.icon}
                        palette={aisle.color}
                        className="size-5 shrink-0"
                      />
                    }
                    title={text.label}
                    detail={text.contents}
                    onClick={() => {
                      void setAisleCategoryRole(
                        db,
                        store.id,
                        aisle.id,
                        placing.id,
                        "primary",
                      );
                      setPanel(null);
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </Sheet>
      )}
      {panel?.kind === "delete" && (
        <Sheet
          autoFocus={false}
          onClose={() => {
            setPanel(null);
          }}
          title={t.deleteTitle(store.name)}
          description={t.deleteText}
        >
          <ConfirmActions
            label={t.delete}
            onConfirm={() => {
              void deleteStore(db, store.id).then((result) => {
                setPanel(null);
                if (result === "deleted") {
                  feedback.remove();
                  showToast(t.deleted(store.name), { tone: "success" });
                  goBack();
                } else showToast(t.deleteShopping, { tone: "warning" });
              });
            }}
            onCancel={() => {
              setPanel(null);
            }}
          />
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
  const { isDragging, rowProps, handleProps } = useSortableRow(
    aisle.id,
    !sortable,
  );
  const color = paletteColor(aisle.color);
  return (
    <li
      {...rowProps}
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
          palette={color}
          className="size-5 shrink-0"
        />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 font-semibold">{text.title}</span>
          <span className="block truncate text-sm text-muted-foreground">
            {aisle.isUnsorted
              ? t.always
              : (text.description ?? t.categories(aisle.categories.length))}
          </span>
        </span>
      </button>
      {sortable ? (
        <DragHandle
          {...handleProps}
          aria-label={t.reorder(text.label)}
          className="size-12"
        />
      ) : (
        <span className="size-12 shrink-0" />
      )}
    </li>
  );
}
