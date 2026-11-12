import { Ban, Check, X } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { routes, shoppingRecapPath } from "@/app/routes";
import { db } from "@/db/database";
import {
  useLatestSession,
  useLists,
  useSessionPurchases,
  useSettings,
} from "@/db/hooks";
import {
  checkItem,
  closeSession,
  markUnavailable,
  uncheckItem,
} from "@/db/sessions";
import type { Article, ID, ListItem, ShoppingSession } from "@/domain/model";
import { feedback } from "@/feedback";
import { AddArticleBar } from "@/features/list/AddArticleBar";
import { CreateArticleSheet } from "@/features/list/CreateArticleSheet";
import { ExistsSheet } from "@/features/list/ExistsSheet";
import {
  lineDetails,
  lineQuantity,
  paletteColor,
} from "@/features/list/format";
import { reportSaveError, useAddToList } from "@/features/list/useAddToList";
import { type ListData, useListData } from "@/features/list/useListData";
import { fr } from "@/i18n/fr";
import { AisleSection } from "@/ui/AisleHeader";
import { Button } from "@/ui/button";
import { ItemRow } from "@/ui/ItemRow";
import { Sheet } from "@/ui/Sheet";
import { SwipeAction } from "@/ui/SwipeToDelete";
import { showToast } from "@/ui/toast";
import { AddedInStoreSheet } from "./AddedInStoreSheet";
import { MoveAisleSheet } from "./MoveAisleSheet";
import { StaleSessionPrompt } from "./StaleSessionPrompt";
import { type ShoppingView, useShoppingView } from "./useShoppingView";
import { useWakeLock } from "./useWakeLock";

const t = fr.shopping;

type Panel =
  | { kind: "added"; itemId: ID; articleId: ID }
  | { kind: "move"; articleId: ID; aisleId: ID | undefined }
  | { kind: "finish" };

/**
 * Mode courses (docs/03 C1 à C6, docs/04 § 2.3) : grandes lignes par rayon, tap =
 * dans le caddie, glisser = introuvable, appui long = changer de rayon ; le rayon
 * terminé se replie, le rayon en cours est mis en évidence. ✕ quitte sans clôturer.
 */
export function ShoppingPage() {
  const settings = useSettings();
  const lists = useLists();
  const listId = (
    lists?.find((l) => l.id === settings?.currentListId) ?? lists?.[0]
  )?.id;
  const session = useLatestSession(listId);
  const data = useListData(session?.storeId);
  const purchases = useSessionPurchases(session?.id);
  const view = useShoppingView(data, session, purchases);

  if (lists && !listId) return <Navigate to={routes.list} replace />;
  if (listId && session === null) return <Navigate to={routes.list} replace />;
  // Courses terminées (ici ou depuis la question « Tu as terminé… ? ») : le bilan.
  if (session?.status === "closed")
    return <Navigate to={shoppingRecapPath(session.id)} replace />;
  if (!session || !data || !view)
    return (
      <p className="px-5 pt-10 text-center text-muted-foreground">
        {fr.list.loading}
      </p>
    );
  return <Shopping session={session} data={data} view={view} />;
}

function Shopping({
  session,
  data,
  view,
}: {
  session: ShoppingSession;
  data: ListData;
  view: ShoppingView;
}) {
  useWakeLock();
  const navigate = useNavigate();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [expanded, setExpanded] = useState<ReadonlyMap<ID, boolean>>(new Map());
  const close = () => {
    setPanel(null);
  };
  const onAdded = useCallback((item: ListItem, article: Article) => {
    setPanel({ kind: "added", itemId: item.id, articleId: article.id });
  }, []);
  const adding = useAddToList(data, onAdded);

  const check = (item: ListItem) => {
    const aisle = view.aisleOf.get(item.id);
    if (!aisle) return;
    const lastOfAisle = !data.items.some(
      (other) =>
        other.id !== item.id &&
        other.status === "todo" &&
        view.aisleOf.get(other.id)?.id === aisle.id,
    );
    void checkItem(db, session, item, aisle.id).then(() => {
      if (lastOfAisle) feedback.aisleDone();
      else feedback.check();
    }, reportSaveError);
  };

  const tap = (item: ListItem) => {
    if (item.status === "todo") check(item);
    else void uncheckItem(db, session.id, item).catch(reportSaveError);
  };

  const unavailable = (item: ListItem) => {
    const previous = item.status;
    const name = data.articleById.get(item.articleId)?.name ?? "";
    void markUnavailable(db, session.id, item).then(() => {
      showToast(t.unavailableToast(name), {
        action: {
          label: fr.list.undo,
          run: () => {
            if (previous === "checked") check(item);
            else void uncheckItem(db, session.id, item);
          },
        },
      });
    }, reportSaveError);
  };

  const row = (item: ListItem) => {
    const article = data.articleById.get(item.articleId);
    if (!article) return null;
    const category = data.categoryById.get(article.categoryId);
    const isUnavailable = item.status === "unavailable";
    const line = (
      <ItemRow
        shopping
        label={article.name}
        icon={article.icon}
        color={paletteColor(category?.color)}
        details={
          isUnavailable
            ? [t.unavailable, lineDetails(item)].filter(Boolean).join(" · ")
            : lineDetails(item)
        }
        quantity={lineQuantity(item, data.unitById)}
        checked={item.status === "checked"}
        unavailable={isUnavailable}
        onClick={() => {
          tap(item);
        }}
        onLongPress={() => {
          setPanel({
            kind: "move",
            articleId: article.id,
            aisleId: view.aisleOf.get(item.id)?.id,
          });
        }}
      />
    );
    return (
      <motion.div
        key={item.id}
        layout="position"
        transition={{ duration: 0.25 }}
      >
        {isUnavailable ? (
          line
        ) : (
          <SwipeAction
            label={`${article.name} — ${t.swipeHint}`}
            icon={<Ban />}
            className="bg-warning/15 text-warning"
            onSwipe={() => {
              unavailable(item);
            }}
          >
            {line}
          </SwipeAction>
        )}
      </motion.div>
    );
  };

  const remaining = data.items.filter((item) => item.status === "todo").length;
  const { checked, total } = view.progress;
  const added =
    panel?.kind === "added"
      ? {
          item: data.items.find((item) => item.id === panel.itemId),
          article: data.articleById.get(panel.articleId),
        }
      : undefined;
  const moving =
    panel?.kind === "move" ? data.articleById.get(panel.articleId) : undefined;
  const pending = adding.pending;

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-bg px-2 pt-3 pb-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={t.quit}
            onClick={() => {
              void navigate(routes.list);
            }}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-secondary active:bg-raised"
          >
            <X className="size-6" aria-hidden />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-2xl font-extrabold tracking-tight text-primary">
            {data.store?.name}
          </h1>
          <span
            data-testid="shopping-progress"
            aria-label={t.progressLabel(checked, total)}
            className="shrink-0 pr-2 text-lg font-extrabold text-secondary tabular-nums"
          >
            {t.progress(checked, total)}
          </span>
        </div>
        <div
          aria-hidden
          className="mx-2 mt-2 h-1.5 overflow-hidden rounded-full bg-raised"
        >
          <motion.div
            className="h-full rounded-full bg-secondary"
            initial={false}
            animate={{ width: `${total ? (checked / total) * 100 : 0}%` }}
          />
        </div>
      </header>

      <div className="flex flex-col gap-4 px-3 pt-4">
        {view.pickUp.length > 0 && (
          <AisleSection
            label={t.pickUp}
            icon="rotate-ccw"
            color="ambre"
            count={view.pickUp.length}
            expanded
            onToggle={() => undefined}
          >
            {view.pickUp.map(row)}
          </AisleSection>
        )}
        {view.groups.map(({ aisle, items, done }) => {
          const open = expanded.get(aisle.id) ?? !done;
          return (
            <AisleSection
              key={aisle.id}
              label={aisle.name}
              icon={aisle.icon}
              color={paletteColor(aisle.color)}
              count={items.filter((i) => i.status === "todo").length}
              expanded={open}
              done={done}
              current={aisle.id === view.current}
              currentLabel={t.current}
              onToggle={() => {
                setExpanded((current) => new Map(current).set(aisle.id, !open));
              }}
            >
              {items.map(row)}
            </AisleSection>
          );
        })}
        {remaining === 0 && total > 0 && (
          <p className="flex items-center justify-center gap-2 py-4 text-lg font-bold text-success">
            <Check className="size-6" aria-hidden />
            {t.allDone}
          </p>
        )}
      </div>
      {/* Place pour la barre d'ajout flottante. */}
      <div aria-hidden className="h-24" />

      <AddArticleBar
        data={data}
        onSubmit={(text) => void adding.submit(text)}
        onPick={(article, entry) => void adding.pick(article, entry)}
        onCreate={adding.create}
        trailing={
          <Button
            variant="gold"
            className="h-12 rounded-full px-4"
            aria-label={t.finishLong}
            onClick={() => {
              setPanel({ kind: "finish" });
            }}
          >
            <Check />
            {t.finish}
          </Button>
        }
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

      {added?.item && added.article && (
        <AddedInStoreSheet
          article={added.article}
          aisle={view.aisleOf.get(added.item.id)}
          passed={view.pickUp.some((item) => item.id === added.item?.id)}
          onTaken={() => {
            if (added.item) check(added.item);
            close();
          }}
          onOtherAisle={() => {
            if (!added.item || !added.article) return;
            setPanel({
              kind: "move",
              articleId: added.article.id,
              aisleId: view.aisleOf.get(added.item.id)?.id,
            });
          }}
          onClose={close}
        />
      )}
      {panel?.kind === "move" && moving && (
        <MoveAisleSheet
          data={data}
          article={moving}
          currentAisleId={panel.aisleId}
          sessionId={session.id}
          onClose={close}
        />
      )}
      {panel?.kind === "finish" && (
        <Sheet
          open
          autoFocus={false}
          onOpenChange={(open) => {
            if (!open) close();
          }}
          title={t.finishTitle}
          description={t.finishText(remaining)}
        >
          <div className="flex flex-col gap-3">
            <Button
              variant="gold"
              onClick={() => {
                void closeSession(db, session.id).then(() => {
                  feedback.done();
                  void navigate(shoppingRecapPath(session.id), {
                    replace: true,
                  });
                }, reportSaveError);
              }}
            >
              {t.finishConfirm}
            </Button>
            <Button variant="outline" onClick={close}>
              {t.cancel}
            </Button>
          </div>
        </Sheet>
      )}
      <StaleSessionPrompt session={session} />
    </>
  );
}
