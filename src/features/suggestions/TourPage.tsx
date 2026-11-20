import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { motion, type PanInfo } from "motion/react";
import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { catalogCategoryPath, routes } from "@/app/routes";
import { db } from "@/db/database";
import { dismissRestock } from "@/db/settings";
import type { Suggestion } from "@/domain/suggestions";
import { isDismissed } from "@/domain/suggestions";
import { fr } from "@/i18n/fr";
import { ArticleGrid } from "@/common/ArticleGrid";
import { useListData } from "@/common/useListData";
import { useRestock } from "@/common/useRestock";
import { Button } from "@/ui/button";
import { EmptyState, Loading, PageHeader } from "@/ui/Page";
import { RestockRows } from "./RestockRows";

const t = fr.tour;
/** Étape « À racheter » ; les autres étapes sont désignées par leur catégorie. */
const RESTOCK = "racheter";
/** Glisser d'au moins 80 px (ou d'un geste vif) : étape suivante ou précédente. */
const SWIPE_DISTANCE = 80;
const SWIPE_SPEED = 500;

/**
 * Faire le tour (docs/03 D1, D2) : d'abord « À racheter », ce qu'il est temps de
 * reprendre d'après le rythme des achats, puis un écran par catégorie avec ses articles
 * habituels. Un toucher ajoute ; on passe d'un écran à l'autre par les boutons du bas ou
 * en glissant. L'étape est dans l'adresse (`?etape=`) : retrouvée au retour d'une
 * catégorie du catalogue.
 */
export function TourPage() {
  const data = useListData();
  const restock = useRestock(data);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  // Suggestions figées à l'ouverture : un article ajouté reste affiché, avec sa quantité.
  const [shown, setShown] = useState<Suggestion[] | undefined>(undefined);
  if (restock && shown === undefined) setShown(restock.suggestions);
  const [direction, setDirection] = useState(1);
  // Un glissement ne doit pas compter comme un toucher sur la carte où il a commencé.
  const swiped = useRef(false);

  if (!data || !restock || !shown) return <Loading>{fr.list.loading}</Loading>;

  const steps = [
    ...(shown.length > 0 ? [{ key: RESTOCK, title: t.restock }] : []),
    ...restock.categories.map(({ category }) => ({
      key: category.id,
      title: category.name,
    })),
  ];
  const back = () => {
    void navigate(routes.list);
  };

  if (steps.length === 0)
    return (
      <>
        <PageHeader title={t.title} backTo={routes.list} />
        <EmptyState
          icon={<Lightbulb />}
          title={t.emptyTitle}
          action={
            <Button variant="outline" onClick={back}>
              {t.backToList}
            </Button>
          }
        >
          {t.emptyText}
        </EmptyState>
      </>
    );

  const requested = steps.findIndex((s) => s.key === params.get("etape"));
  const index = Math.max(requested, 0);
  const step = steps[index] ?? steps[0];
  const previous = steps[index - 1];
  const next = steps[index + 1];
  const go = (target: typeof step | undefined, dir: number) => {
    if (!target) return;
    setDirection(dir);
    setParams({ etape: target.key }, { replace: true });
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_SPEED)
      go(next, 1);
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_SPEED)
      go(previous, -1);
    // Le clic qui suit le relâchement (souris) arrive avant : il est encore ignoré.
    setTimeout(() => {
      swiped.current = false;
    }, 50);
  };
  const group = restock.categories.find((g) => g.category.id === step?.key);
  const visible = shown.filter(
    (s) =>
      data.articleById.has(s.articleId) &&
      !isDismissed(
        s.articleId,
        data.settings.dismissedSuggestions,
        data.lastClosedAt,
      ),
  );

  return (
    <>
      <PageHeader
        title={step?.title ?? t.title}
        backTo={routes.list}
        action={
          <span className="text-sm font-semibold text-muted-foreground tabular-nums">
            {t.step(index + 1, steps.length)}
          </span>
        }
      />
      {/* Le nouvel écran arrive du côté où l'on va. Pas d'animation de sortie : l'écran
          suivant l'attendrait, et elle ne se termine pas toujours sous le WebKit des
          tests (docs/08 § 3). */}
      <motion.div
        key={step?.key}
        initial={{ x: direction * 48, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.35}
        dragSnapToOrigin
        onDragStart={() => {
          swiped.current = true;
        }}
        onDragEnd={onDragEnd}
        onClickCapture={(event) => {
          if (!swiped.current) return;
          event.stopPropagation();
          event.preventDefault();
        }}
        // Assez haut pour glisser même sous une catégorie de deux articles.
        className="min-h-[50vh]"
      >
        {step?.key === RESTOCK ? (
          <>
            <p className="px-4 pb-3 text-sm text-muted-foreground">
              {visible.length > 0 ? t.restockIntro : t.restockDone}
            </p>
            <RestockRows
              suggestions={visible}
              data={data}
              now={restock.now}
              onDismiss={(articleId) => {
                void dismissRestock(db, articleId, data.lastClosedAt);
              }}
            />
          </>
        ) : (
          group && (
            <>
              <p className="px-4 pb-3 text-sm text-muted-foreground">
                {t.categoryIntro}
              </p>
              <ArticleGrid articles={group.articles} data={data} />
              <div className="px-3 pt-3">
                <Button
                  variant="link"
                  className="w-full"
                  onClick={() => {
                    void navigate(catalogCategoryPath(group.category.id));
                  }}
                >
                  {t.wholeCategory(group.category.name)}
                  <ChevronRight />
                </Button>
              </div>
            </>
          )
        )}
      </motion.div>

      {/* Place pour la barre du bas, posée sur le bas de l'écran comme la barre d'ajout. */}
      <div aria-hidden className="h-20" />
      <div className="absolute inset-x-0 bottom-0 z-30 mx-auto flex max-w-xl gap-2 border-t border-border bg-bg px-3 py-3">
        {previous && (
          <Button
            variant="outline"
            aria-label={t.previous}
            className="px-3"
            onClick={() => {
              go(previous, -1);
            }}
          >
            <ChevronLeft />
          </Button>
        )}
        {next ? (
          <Button
            className="min-w-0 flex-1"
            onClick={() => {
              go(next, 1);
            }}
          >
            <span className="truncate">{t.nextTo(next.title)}</span>
            <ChevronRight />
          </Button>
        ) : (
          <Button className="flex-1" onClick={back}>
            {t.finish}
          </Button>
        )}
      </div>
    </>
  );
}
