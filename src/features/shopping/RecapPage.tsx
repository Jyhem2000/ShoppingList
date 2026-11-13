import { CircleCheck } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate, useParams } from "react-router";
import { routes } from "@/app/routes";
import { db } from "@/db/database";
import {
  useAisles,
  useArticles,
  useCategories,
  useLatestSession,
  useSession,
  useSessionPurchases,
} from "@/db/hooks";
import { reopenSession } from "@/db/sessions";
import { aisleOrderChanged } from "@/domain/shopping";
import { paletteColor } from "@/features/list/format";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { EmptyState, PageHeader } from "@/ui/Page";
import { ProductIcon } from "@/ui/ProductIcon";
import { Tip } from "@/ui/Tip";
import { formatDuration } from "./format";

const t = fr.shopping.recap;

/**
 * Bilan de fin de courses (docs/04 § 2.4) : articles achetés, introuvables restés dans
 * la liste, durée, ordre des rayons appris ; « Retour à la liste » et « Rouvrir » (C8).
 */
export function RecapPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const session = useSession(sessionId);
  const purchases = useSessionPurchases(sessionId);
  const articles = useArticles();
  const categories = useCategories();
  const aisles = useAisles(session?.storeId);
  const latest = useLatestSession(session?.listId);
  const unavailable = useLiveQuery(
    () =>
      session
        ? db.items
            .where("listId")
            .equals(session.listId)
            .filter(
              (item) =>
                item.status === "unavailable" && !item.closedInSessionId,
            )
            .count()
        : 0,
    [session],
  );

  if (session === null)
    return (
      <>
        <PageHeader title={t.title} backTo={routes.list} />
        <EmptyState
          icon={<CircleCheck className="size-10" />}
          title={t.missing}
        />
      </>
    );
  if (!session || !purchases || !articles || !categories || !aisles)
    return null;

  const articleById = new Map(articles.map((a) => [a.id, a]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const snapshot = session.learningSnapshot;
  const learned =
    snapshot !== undefined &&
    aisleOrderChanged(
      snapshot.aislePositions,
      Object.fromEntries(aisles.map((a) => [a.id, a.position])),
    );
  const canReopen = session.status === "closed" && latest?.id === session.id;

  return (
    <>
      <PageHeader title={t.title} />
      <div className="flex flex-col gap-1 px-5 pb-4">
        <p className="flex items-center gap-2 text-lg font-bold text-success">
          <CircleCheck className="size-6" aria-hidden />
          {t.bought(purchases.length)}
        </p>
        {unavailable ? (
          <p className="text-muted-foreground">{t.unavailable(unavailable)}</p>
        ) : null}
        {session.closedAt && (
          <p className="text-muted-foreground">
            {t.duration(formatDuration(session.closedAt - session.startedAt))}
          </p>
        )}
        {learned && <p className="text-secondary">{t.learned}</p>}
      </div>
      {purchases.length > 0 && (
        <ul className="mx-3 divide-y divide-border/50 overflow-hidden rounded-2xl bg-surface">
          {purchases.map((purchase) => {
            const article = articleById.get(purchase.articleId);
            if (!article) return null;
            const category = categoryById.get(article.categoryId);
            return (
              <li
                key={purchase.id}
                className="flex min-h-11 items-center gap-3 px-4 py-1.5"
              >
                <ProductIcon
                  icon={article.icon}
                  label={article.name}
                  color={paletteColor(category?.color)}
                  size={24}
                />
                <span className="truncate font-semibold">{article.name}</span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-col gap-3 px-5 pt-6">
        <Button
          onClick={() => {
            void navigate(routes.list, { replace: true });
          }}
        >
          {t.back}
        </Button>
        {canReopen && (
          <Button
            variant="outline"
            onClick={() => {
              void reopenSession(db, session.id).then((reopened) => {
                if (reopened) void navigate(routes.shopping, { replace: true });
              });
            }}
          >
            {t.reopen}
          </Button>
        )}
      </div>
      <Tip id="shopping-stored" text={fr.tips.stored} />
    </>
  );
}
