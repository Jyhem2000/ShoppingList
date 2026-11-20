import { RotateCcw, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { routes } from "@/app/routes";
import { db } from "@/db/database";
import { useLatestSession } from "@/db/hooks";
import { deleteItems, restoreItems } from "@/db/lists";
import { reopenSession } from "@/db/sessions";
import { canReopen } from "@/domain/shopping";
import type { ID, ListItem } from "@/domain/model";
import { feedback } from "@/feedback";
import { formatClock } from "@/common/time";
import { StaleSessionPrompt } from "@/common/StaleSessionPrompt";
import { StartShoppingSheet } from "@/common/StartShoppingSheet";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { EmptyState, Loading } from "@/ui/Page";
import { showToast } from "@/ui/toast";
import { AddArticleBar } from "@/common/AddArticleBar";
import { CreateArticleSheet } from "@/common/CreateArticleSheet";
import { ExistsSheet } from "@/common/ExistsSheet";
import { LineSheet } from "./LineSheet";
import { ListHeader } from "./ListHeader";
import { ListLines } from "./ListLines";
import { ListMenuSheet } from "./ListMenuSheet";
import { ListsSheet } from "./ListsSheet";
import { MergeListsSheet } from "./MergeListsSheet";
import { useAddToList } from "@/common/useAddToList";
import { useListData } from "@/common/useListData";
import { useRestock } from "@/common/useRestock";
import { TourButton } from "./TourButton";

import { useNow } from "@/ui/useNow";
const t = fr.list;

type Panel =
  | { kind: "line"; itemId: ID }
  | { kind: "menu" }
  | { kind: "lists" }
  | { kind: "merge"; sources: ID[] }
  | { kind: "start" };

/** Écran Liste (docs/04 § 2.1) : la liste courante triée par rayon, et la barre d'ajout. */
export function ListPage() {
  const data = useListData();
  const navigate = useNavigate();
  const adding = useAddToList(data);
  const [panel, setPanel] = useState<Panel | null>(null);
  const session = useLatestSession(data?.list.id);
  const restock = useRestock(data);
  const now = useNow();
  const close = () => {
    setPanel(null);
  };

  if (!data) return <Loading>{t.loading}</Loading>;

  /** Retire des lignes, avec « Annuler » pendant 4 secondes (docs/03 B4). */
  const removeItems = (ids: ID[]) => {
    void deleteItems(db, ids).then((removed) => {
      const { items } = removed;
      if (items.length === 0) return;
      feedback.remove();
      const [first] = items;
      const name =
        items.length === 1 && first
          ? (data.articleById.get(first.articleId)?.name ?? "")
          : "";
      showToast(
        items.length === 1 ? t.removed(name) : t.removedMany(items.length),
        {
          action: {
            label: t.undo,
            run: () => {
              void restoreItems(db, removed);
            },
          },
        },
      );
    });
  };
  const removeItem = (item: ListItem) => {
    removeItems([item.id]);
  };

  const lineItem =
    panel?.kind === "line"
      ? data.items.find((item) => item.id === panel.itemId)
      : undefined;
  const pending = adding.pending;

  return (
    <>
      <ListHeader
        listName={data.list.name}
        onChooseList={() => {
          setPanel({ kind: "lists" });
        }}
        onMenu={() => {
          setPanel({ kind: "menu" });
        }}
      />

      {session?.closedAt &&
        canReopen(
          session,
          session.id,
          data.stores.some((store) => store.id === session.storeId),
          now,
        ) && (
          <div className="px-3 pb-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                void reopenSession(db, session.id).then((reopened) => {
                  if (reopened) void navigate(routes.shopping);
                });
              }}
            >
              <RotateCcw />
              {fr.shopping.reopen(formatClock(session.closedAt))}
            </Button>
          </div>
        )}

      {restock &&
        (restock.suggestions.length > 0 || restock.categories.length > 0) && (
          <TourButton count={restock.suggestions.length} />
        )}

      {data.items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart />}
          title={t.emptyTitle}
          action={
            <Button
              variant="outline"
              onClick={() => {
                void navigate(routes.catalog);
              }}
            >
              {t.openCatalog}
            </Button>
          }
        >
          {t.emptyText}
        </EmptyState>
      ) : (
        <ListLines
          data={data}
          onOpen={(item) => {
            setPanel({ kind: "line", itemId: item.id });
          }}
          onRemove={removeItem}
        />
      )}
      {session?.status === "open" ? (
        <div className="flex justify-center px-3 pt-6">
          <Button
            size="lg"
            onClick={() => {
              void navigate(routes.shopping);
            }}
          >
            <ShoppingCart />
            {fr.shopping.resume}
          </Button>
        </div>
      ) : (
        data.items.some((item) => item.status === "todo") && (
          <div className="flex justify-center px-3 pt-6">
            <Button
              size="lg"
              onClick={() => {
                setPanel({ kind: "start" });
              }}
            >
              <ShoppingCart />
              {fr.shopping.start}
            </Button>
          </div>
        )
      )}
      {/* Place pour la barre d'ajout flottante. */}
      <div aria-hidden className="h-24" />

      <AddArticleBar
        data={data}
        onSubmit={(text) => void adding.submit(text)}
        onPick={(article, entry, types) =>
          void adding.pick(article, entry, types)
        }
        onCreate={adding.create}
      />

      {pending?.kind === "exists" && (
        <ExistsSheet
          key={pending.item.id}
          pending={pending}
          data={data}
          onDone={adding.next}
          onAddType={(type) => {
            adding.next();
            void adding.addType(pending.article, type, pending.entry);
          }}
        />
      )}
      {pending?.kind === "create" && (
        <CreateArticleSheet
          key={pending.entry.text}
          entry={pending.entry}
          data={data}
          onCancel={adding.next}
          onCreated={(article) => {
            const entry = pending.entry;
            adding.next();
            void adding.pick(article, entry);
          }}
        />
      )}

      {lineItem && (
        <LineSheet
          key={lineItem.id}
          item={lineItem}
          data={data}
          onRemove={removeItem}
          onClose={close}
        />
      )}
      {panel?.kind === "menu" && (
        <ListMenuSheet
          data={data}
          onClose={close}
          onAddLists={() => {
            setPanel({ kind: "merge", sources: [] });
          }}
          onRemoveItems={removeItems}
          onPaste={(text) => {
            void navigate(routes.import, {
              state: { text, expected: "list", listId: data.list.id },
            });
          }}
        />
      )}
      {panel?.kind === "lists" && (
        <ListsSheet
          data={data}
          onClose={close}
          onCreated={(_, include) => {
            setPanel(
              include.length ? { kind: "merge", sources: include } : null,
            );
          }}
        />
      )}
      {panel?.kind === "merge" && (
        <MergeListsSheet
          data={data}
          initialSources={panel.sources}
          onClose={close}
        />
      )}
      {panel?.kind === "start" && (
        <StartShoppingSheet data={data} onClose={close} />
      )}
      {session?.status === "open" && <StaleSessionPrompt session={session} />}
    </>
  );
}
