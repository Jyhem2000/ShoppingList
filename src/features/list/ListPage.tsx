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
import { formatClock } from "@/features/shopping/format";
import { StaleSessionPrompt } from "@/features/shopping/StaleSessionPrompt";
import { StartShoppingSheet } from "@/features/shopping/StartShoppingSheet";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { EmptyState } from "@/ui/Page";
import { showToast } from "@/ui/toast";
import { AddArticleBar } from "./AddArticleBar";
import { CreateArticleSheet } from "./CreateArticleSheet";
import { ExistsSheet } from "./ExistsSheet";
import { LineSheet } from "./LineSheet";
import { ListHeader } from "./ListHeader";
import { ListLines } from "./ListLines";
import { ListMenuSheet } from "./ListMenuSheet";
import { ListsSheet } from "./ListsSheet";
import { MergeListsSheet } from "./MergeListsSheet";
import { useAddToList } from "./useAddToList";
import { useListData } from "./useListData";

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
  const [now] = useState(() => Date.now());
  const close = () => {
    setPanel(null);
  };

  if (!data)
    return (
      <p className="px-5 pt-10 text-center text-muted-foreground">
        {t.loading}
      </p>
    );

  /** Retire des lignes, avec « Annuler » pendant 5 secondes (docs/03 B4). */
  const removeItems = (ids: ID[]) => {
    void deleteItems(db, ids).then((removed) => {
      if (removed.length === 0) return;
      feedback.remove();
      const [first] = removed;
      const name =
        removed.length === 1 && first
          ? (data.articleById.get(first.articleId)?.name ?? "")
          : "";
      showToast(
        removed.length === 1 ? t.removed(name) : t.removedMany(removed.length),
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

      {data.items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="size-10" />}
          title={t.emptyTitle}
        >
          {t.emptyText}
          <span className="mt-5 block">
            <Button
              variant="outline"
              onClick={() => {
                void navigate(routes.catalog);
              }}
            >
              {t.openCatalog}
            </Button>
          </span>
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
        onPick={(article, entry) => void adding.pick(article, entry)}
        onCreate={adding.create}
      />

      {pending?.kind === "exists" && (
        <ExistsSheet
          key={pending.item.id}
          pending={pending}
          data={data}
          onDone={adding.next}
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
          onManageLists={() => {
            setPanel({ kind: "lists" });
          }}
          onRemoveItems={removeItems}
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
