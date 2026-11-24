import { CircleCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { routes } from "@/app/routes";
import { db } from "@/db/database";
import {
  useAisles,
  useArticles,
  useCategories,
  useLatestSession,
  useListItems,
  useSession,
  useSessionPurchases,
  useStores,
} from "@/db/hooks";
import { reopenSession } from "@/db/sessions";
import { aisleOrderChanged, canReopen } from "@/domain/shopping";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { EmptyState, PageHeader, Section, SectionTitle } from "@/ui/Page";
import { InfoRow } from "@/ui/RowButton";
import { HelpTip } from "./HelpTip";
import { formatDuration } from "@/common/time";
import { ArticleIcon } from "@/ui/ArticleIcon";
import { useNow } from "@/ui/useNow";
import { byId } from "@/domain/collections";
const t = fr.shopping.recap;

/**
 * Bilan de fin de courses (docs/04 § 2.4) : articles achetés, introuvables restés dans
 * la liste, durée, ordre des rayons appris. « Retour à la liste » et « Rouvrir » (C8)
 * en haut, sous le titre.
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
  const stores = useStores();
  const now = useNow();
  const listId = session?.listId;
  const unavailable = useListItems(listId)?.filter(
    (item) => item.status === "unavailable",
  ).length;

  if (session === null)
    return (
      <>
        <PageHeader title={t.title} backTo={routes.list} />
        <EmptyState icon={<CircleCheck />} title={t.missing} />
      </>
    );
  if (!session || !purchases || !articles || !categories || !aisles)
    return null;

  const articleById = byId(articles);
  const categoryById = byId(categories);
  const snapshot = session.learningSnapshot;
  const learned =
    snapshot !== undefined &&
    aisleOrderChanged(
      snapshot.aislePositions,
      Object.fromEntries(aisles.map((a) => [a.id, a.position])),
    );
  const reopenable = canReopen(
    session,
    latest?.id,
    stores?.some((store) => store.id === session.storeId) ?? false,
    now,
  );

  return (
    <>
      <PageHeader title={t.title} />
      {/* En haut : pas d'onglets sur cet écran, on n'en sort que par ces boutons. */}
      <div className="flex flex-col gap-3 px-5 pb-2">
        <Button
          onClick={() => {
            void navigate(routes.list, { replace: true });
          }}
        >
          {t.back}
        </Button>
        {reopenable && (
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
      <div className="px-4 pt-6">
        <SectionTitle>{t.summary}</SectionTitle>
      </div>
      <div className="flex flex-col gap-1 px-5">
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
        {learned && <p className="text-primary">{t.learned}</p>}
      </div>
      {purchases.length > 0 && (
        <Section className="pt-3 pb-6">
          <ul className="divide-y divide-border">
            {purchases.map((purchase) => {
              const article = articleById.get(purchase.articleId);
              if (!article) return null;
              const category = categoryById.get(article.categoryId);
              return (
                <li key={purchase.id}>
                  <InfoRow
                    icon={
                      <ArticleIcon
                        article={article}
                        category={category}
                        size={24}
                      />
                    }
                    title={article.name}
                  />
                </li>
              );
            })}
          </ul>
        </Section>
      )}
      <HelpTip id="shopping-stored" text={fr.tips.stored} />
    </>
  );
}
