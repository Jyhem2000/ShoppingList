import { ArrowDown, Ban, Check, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
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
  moveArticle,
  openNextAisle,
  placeAndCheck,
  uncheckItem,
} from "@/db/sessions";
import { categoriesData } from "@/data";
import { sortCategories } from "@/domain/categories";
import type {
  Aisle,
  Article,
  ID,
  ListItem,
  ShoppingSession,
} from "@/domain/model";
import { feedback } from "@/feedback";
import { QuantitySheet } from "@/features/catalog/QuantitySheet";
import { AddArticleBar } from "@/features/list/AddArticleBar";
import { CreateArticleSheet } from "@/features/list/CreateArticleSheet";
import { ExistsSheet } from "@/features/list/ExistsSheet";
import { aisleText, lineDetails, lineQuantity } from "@/features/list/format";
import { reportSaveError, useAddToList } from "@/features/list/useAddToList";
import { type ListData, useListData } from "@/features/list/useListData";
import { fr } from "@/i18n/fr";
import { AisleSection, AisleSubgroup } from "@/ui/AisleHeader";
import { Button } from "@/ui/button";
import { ItemRow } from "@/ui/ItemRow";
import { EmptyHint, Loading, PageTitle } from "@/ui/Page";
import { useOnPulse } from "@/ui/pulse";
import { PulseLine } from "@/ui/PulseLine";
import { paletteColor } from "@/ui/palette";
import { Sheet } from "@/ui/Sheet";
import { SwipeAction } from "@/ui/SwipeToDelete";
import { Tip } from "@/ui/Tip";
import { showToast } from "@/ui/toast";
import { AddedInStoreSheet } from "./AddedInStoreSheet";
import { MoveAisleSheet } from "./MoveAisleSheet";
import { StaleSessionPrompt } from "./StaleSessionPrompt";
import { type ShoppingView, useShoppingView } from "./useShoppingView";
import { useWakeLock } from "@/app/useWakeLock";

const t = fr.shopping;
/** Identifiant du bloc d'un rayon dans la page, pour y faire défiler l'écran. */
const aisleElementId = (id: ID) => `aisle-${id}`;

type Panel =
  | { kind: "added"; itemId: ID; articleId: ID }
  | {
      kind: "move";
      articleId: ID;
      aisleId: ID | undefined;
      /** Ligne à cocher dans le rayon choisi (déjà dans le caddie). */
      checkItemId?: ID;
    }
  | { kind: "finish" }
  | { kind: "quantity"; itemId: ID };

/**
 * Mode courses (docs/03 C1 à C6, docs/04 § 2.3) : grandes lignes par rayon, tap =
 * dans le caddie, glisser = pas pris, appui long = changer de rayon, tap sur la
 * quantité = la changer ; le rayon
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
  if (!session || !data || !view) return <Loading>{fr.list.loading}</Loading>;
  return <Shopping session={session} data={data} view={view} />;
}

/** Clés des blocs repliables qui ne sont pas des rayons. */
const UNPLACED = "unplaced";
const PICK_UP = "pick-up";

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
  // Catégories repliées dans « À placer » (toutes dépliées au départ).
  const [foldedCategories, setFoldedCategories] = useState<ReadonlySet<ID>>(
    new Set(),
  );
  /** Déplie (ou replie) un bloc : rayon, « À récupérer » ou « À placer ». */
  const setOpen = (key: string, open: boolean) => {
    setExpanded((current) => new Map(current).set(key, open));
  };

  // Une ligne qui doit se montrer (article déjà dans la liste, docs/05 § 6) : son bloc
  // et sa catégorie de « À placer » se déplient.
  useOnPulse((id) => {
    const item = data.items.find((i) => i.id === id);
    if (!item) return;
    if (view.unplaced.some((i) => i.id === id)) {
      setOpen(UNPLACED, true);
      const categoryId = data.articleById.get(item.articleId)?.categoryId;
      setFoldedCategories((current) => {
        if (!categoryId || !current.has(categoryId)) return current;
        const next = new Set(current);
        next.delete(categoryId);
        return next;
      });
    } else if (view.pickUp.some((i) => i.id === id)) setOpen(PICK_UP, true);
    else {
      const aisle = view.aisleOf.get(id);
      if (aisle) setOpen(aisle.id, true);
    }
  });
  // Après « Rayon suivant », l'écran va au rayon en cours dès qu'il est affiché, déplié.
  const scrollToAisle = useRef<ID | undefined>(undefined);
  const reduceMotion = useReducedMotion();
  const revealAisle = (id: ID) => {
    setOpen(id, true);
  };
  useEffect(() => {
    const id = scrollToAisle.current;
    if (!id || id !== view.current) return;
    scrollToAisle.current = undefined;
    document.getElementById(aisleElementId(id))?.scrollIntoView({
      block: "center",
      behavior: reduceMotion ? "auto" : "smooth",
    });
  });
  const textOf = (aisle: Aisle) =>
    aisleText(aisle, data.categoryById, data.categoryWeights);
  const close = () => {
    setPanel(null);
  };
  const onAdded = useCallback((item: ListItem, article: Article) => {
    setPanel({ kind: "added", itemId: item.id, articleId: article.id });
  }, []);
  const adding = useAddToList(data, onAdded);

  /** Cocher un article de « À placer » : il est rangé dans le rayon en cours (C4). */
  const place = (item: ListItem) => {
    const article = data.articleById.get(item.articleId);
    if (!article) return;
    void placeAndCheck(db, session, item, article, view.placing?.id).then(
      () => {
        feedback.check();
      },
      reportSaveError,
    );
  };

  /** Cocher, dans son rayon ou dans celui où l'article a été pris (`aisleId`). */
  const check = (item: ListItem, aisleId?: ID) => {
    const own = view.aisleOf.get(item.id);
    const unplaced = view.unplaced.some((other) => other.id === item.id);
    if (!aisleId && (unplaced || !own || own.isUnsorted)) {
      place(item);
      return;
    }
    const target = aisleId ?? own?.id;
    if (!target) return;
    const lastOfAisle = !data.items.some(
      (other) =>
        other.id !== item.id &&
        other.status === "todo" &&
        view.aisleOf.get(other.id)?.id === target,
    );
    void checkItem(db, session, item, target).then(() => {
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
        quantityLabel={t.changeQuantity(article.name)}
        onQuantityClick={() => {
          setPanel({ kind: "quantity", itemId: item.id });
        }}
      />
    );
    return (
      <motion.div
        key={item.id}
        layout="position"
        transition={{ duration: 0.25 }}
      >
        <PulseLine id={item.id}>
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
        </PulseLine>
      </motion.div>
    );
  };

  // « À placer » : rangé par catégorie (ordre du catalogue), un intertitre par
  // catégorie pour s'y retrouver ; dans une catégorie, à prendre d'abord, puis par nom.
  const categoryOf = (item: ListItem) =>
    data.categoryById.get(
      data.articleById.get(item.articleId)?.categoryId ?? "",
    );
  const unplacedGroups = sortCategories(
    data.categories,
    categoriesData.map((c) => c.key),
  ).flatMap((category) => {
    const items = view.unplaced
      .filter((item) => categoryOf(item)?.id === category.id)
      .sort(
        (a, b) =>
          Number(a.status !== "todo") - Number(b.status !== "todo") ||
          (data.articleById.get(a.articleId)?.name ?? "").localeCompare(
            data.articleById.get(b.articleId)?.name ?? "",
            "fr",
          ),
      );
    return items.length ? [{ category, items }] : [];
  });
  const toPlace = view.unplaced.filter((item) => item.status === "todo").length;
  const firstUnplaced = unplacedGroups[0]?.items[0]?.id;
  const unplacedOpen = expanded.get(UNPLACED) ?? true;
  const pickUpOpen = expanded.get(PICK_UP) ?? true;
  const unplacedBlock = unplacedGroups.length > 0 && (
    <AisleSection
      label={fr.aisles.unplaced}
      icon="shopping-basket"
      color="gris"
      count={toPlace}
      expanded={unplacedOpen}
      onToggle={() => {
        setOpen(UNPLACED, !unplacedOpen);
      }}
    >
      {unplacedGroups.map(({ category, items }) => {
        const folded = foldedCategories.has(category.id);
        return (
          <AisleSubgroup
            key={category.id}
            label={category.name}
            icon={category.icon}
            color={paletteColor(category.color)}
            count={items.filter((item) => item.status === "todo").length}
            expanded={!folded}
            onToggle={() => {
              setFoldedCategories((current) => {
                const next = new Set(current);
                if (folded) next.delete(category.id);
                else next.add(category.id);
                return next;
              });
            }}
          >
            {items.map((item) =>
              item.id === firstUnplaced ? (
                <div key={item.id} data-tip="first-unplaced">
                  {row(item)}
                </div>
              ) : (
                row(item)
              ),
            )}
          </AisleSubgroup>
        );
      })}
    </AisleSection>
  );

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
  const quantityItem =
    panel?.kind === "quantity"
      ? data.items.find((item) => item.id === panel.itemId)
      : undefined;
  const quantityArticle =
    quantityItem && data.articleById.get(quantityItem.articleId);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-bg px-2 pt-7 pb-3">
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
          <PageTitle className="min-w-0 flex-1">{data.store?.name}</PageTitle>
          {/* « 3/7 » à l'écran, une phrase entière pour le lecteur d'écran. */}
          <span
            data-testid="shopping-progress"
            aria-hidden
            className="shrink-0 pr-2 text-lg font-extrabold text-secondary tabular-nums"
          >
            {t.progress(checked, total)}
          </span>
          <span className="sr-only">{t.progressLabel(checked, total)}</span>
        </div>
        <div
          aria-hidden
          className="mx-2 mt-2 h-1.5 overflow-hidden rounded-full bg-raised"
        >
          <motion.div
            className="h-full rounded-full bg-secondary-fill"
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
            expanded={pickUpOpen}
            onToggle={() => {
              setOpen(PICK_UP, !pickUpOpen);
            }}
          >
            {view.pickUp.map(row)}
          </AisleSection>
        )}
        {view.unplacedAfter === undefined && unplacedBlock}
        {view.groups.map(({ aisle, items, done }) => {
          const open = expanded.get(aisle.id) ?? !done;
          const text = textOf(aisle);
          return (
            <Fragment key={aisle.id}>
              <AisleSection
                label={text.title}
                description={text.description}
                icon={aisle.icon}
                color={paletteColor(aisle.color)}
                count={items.filter((i) => i.status === "todo").length}
                expanded={open}
                done={done}
                id={aisleElementId(aisle.id)}
                current={aisle.id === view.current}
                currentLabel={t.current}
                kicker={text.kicker}
                onToggle={() => {
                  setOpen(aisle.id, !open);
                }}
              >
                {items.length > 0 ? (
                  items.map(row)
                ) : (
                  <EmptyHint inset>{t.emptyAisle}</EmptyHint>
                )}
              </AisleSection>
              {aisle.id === view.unplacedAfter && unplacedBlock}
            </Fragment>
          );
        })}
        {remaining === 0 && total > 0 && (
          <p className="flex items-center justify-center gap-2 py-4 text-lg font-bold text-success">
            <Check className="size-6" aria-hidden />
            {t.allDone}
          </p>
        )}
      </div>
      {/* Place pour la barre d'ajout flottante, et « Rayon suivant » au-dessus. */}
      <div aria-hidden className={toPlace > 0 ? "h-40" : "h-24"} />

      <AddArticleBar
        data={data}
        onSubmit={(text) => void adding.submit(text)}
        onPick={(article, entry, types) =>
          void adding.pick(article, entry, types)
        }
        onCreate={adding.create}
        above={
          toPlace > 0 && (
            <Button
              data-tip="next-aisle"
              className="mb-2 h-12 w-full shadow-lg shadow-overlay"
              aria-description={t.nextAisleHint}
              onClick={() => {
                const before = view.placing?.id;
                void openNextAisle(db, session, before)
                  .then((aisle) => {
                    // Que le changement se voie : message, et l'écran va au rayon.
                    feedback.add();
                    showToast(
                      aisle.id === before ? t.aisleStillEmpty : t.aisleOpened,
                      { tone: "info" },
                    );
                    scrollToAisle.current = aisle.id;
                    revealAisle(aisle.id);
                  })
                  .catch(reportSaveError);
              }}
            >
              <ArrowDown />
              {t.nextAisle}
            </Button>
          )
        }
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

      {/* Bulles d'aide de la première course (docs/03 H12), une à la fois. */}
      <Tip
        id="shopping-place"
        text={fr.tips.place}
        target='[data-tip="first-unplaced"]'
        show={!panel && toPlace > 0 && !view.placing}
      />
      <Tip
        id="shopping-next"
        text={fr.tips.next}
        target='[data-tip="next-aisle"]'
        show={!panel && toPlace > 0 && view.placing !== undefined}
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

      {added?.item && added.article && (
        <AddedInStoreSheet
          article={added.article}
          aisle={
            view.aisleOf.get(added.item.id)?.isUnsorted
              ? undefined
              : view.aisleOf.get(added.item.id)
          }
          here={
            view.here ? data.aisles.find((a) => a.id === view.here) : undefined
          }
          passed={view.pickUp.some((item) => item.id === added.item?.id)}
          textOf={textOf}
          onTakenIn={(target, remember) => {
            const item = added.item;
            const article = added.article;
            close();
            if (!item || !article) return;
            // Pas encore de rayon : rangé dans le rayon en cours, comme dans « À placer ».
            if (!target) {
              place(item);
              return;
            }
            const done = () => {
              check(item, target.id);
            };
            if (remember && data.store)
              void moveArticle(db, {
                storeId: data.store.id,
                article,
                aisleId: target.id,
                scope: "article",
                sessionId: session.id,
              }).then(done);
            else done();
          }}
          onOtherAisle={(taken) => {
            if (!added.item || !added.article) return;
            setPanel({
              kind: "move",
              articleId: added.article.id,
              aisleId: view.aisleOf.get(added.item.id)?.id,
              checkItemId: taken ? added.item.id : undefined,
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
          hereAisleId={view.here}
          sessionId={session.id}
          onMoved={(aisleId) => {
            const item =
              panel.checkItemId &&
              data.items.find((i) => i.id === panel.checkItemId);
            if (item) check(item, aisleId);
          }}
          onClose={close}
        />
      )}
      {panel?.kind === "quantity" && quantityItem && quantityArticle && (
        <QuantitySheet
          key={quantityItem.id}
          article={quantityArticle}
          data={data}
          onClose={close}
          onAddType={(type) => {
            void adding.addType(quantityArticle, type);
          }}
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
