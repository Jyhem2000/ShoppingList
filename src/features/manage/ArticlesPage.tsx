import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { manageArticlePath, routes } from "@/app/routes";
import { markNotDuplicate, mergeArticles } from "@/db/articles";
import { db } from "@/db/database";
import { findLikelyDuplicates } from "@/domain/duplicates";
import type { Article, ID } from "@/domain/model";
import { searchArticles } from "@/domain/search";
import { CreateArticleSheet } from "@/common/CreateArticleSheet";
import { useListData } from "@/common/useListData";
import { fr } from "@/i18n/fr";
import { SearchField } from "@/ui/SearchField";
import { AddButton } from "@/ui/AddButton";
import { Button } from "@/ui/button";
import { CategorySelect } from "@/ui/CategorySelect";
import { EmptyHint, PageHeader, Section } from "@/ui/Page";
import { Sheet } from "@/ui/Sheet";
import { showToast } from "@/ui/toast";
import { RowButton } from "@/ui/RowButton";
import { ArticleIcon } from "@/ui/ArticleIcon";
import { byName } from "@/domain/slug";
const t = fr.manage.articles;
/**
 * Articles (docs/03 G1) : recherche, filtre par catégorie, doublons probables en tête
 * (« Fusionner » ou « Ce ne sont pas des doublons »), création d'un article.
 */
export function ArticlesPage() {
  const data = useListData();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<ID>("");
  const [creating, setCreating] = useState(false);
  const [merging, setMerging] = useState<[Article, Article] | null>(null);

  const view = useMemo(() => {
    if (!data) return undefined;
    const inCategory = data.articles.filter(
      (a) => !categoryId || a.categoryId === categoryId,
    );
    const shown = query.trim()
      ? searchArticles(query, inCategory, data.purchaseCounts).map(
          (r) => r.article,
        )
      : [...inCategory].sort(byName);
    return { shown };
  }, [data, query, categoryId]);
  // Hors du calcul ci-dessus : ne se refait pas à chaque lettre tapée.
  const articles = data?.articles;
  const duplicates = useMemo(
    () => (articles ? findLikelyDuplicates(articles) : []),
    [articles],
  );

  return (
    <>
      <PageHeader title={t.title} backTo={routes.settings} />
      <div className="flex flex-col gap-2 px-4 pb-2">
        <SearchField label={t.search} value={query} onValueChange={setQuery} />
        <CategorySelect
          ariaLabel={t.allCategories}
          categories={data?.categories ?? []}
          value={categoryId}
          onChange={setCategoryId}
          placeholder={t.allCategories}
        />
      </div>

      {data && view && (
        <>
          {duplicates.length > 0 && !query && !categoryId && (
            <Section title={t.duplicates}>
              <p className="px-4 pt-3 text-sm text-warning">
                {t.duplicatesHint}
              </p>
              <ul className="divide-y divide-border/50">
                {duplicates.map(([a, b]) => (
                  <li
                    key={`${a.id}-${b.id}`}
                    className="flex flex-col gap-2 px-4 py-3"
                  >
                    <p className="font-semibold">
                      {a.name} · {b.name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setMerging([a, b]);
                        }}
                      >
                        {t.merge}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          void markNotDuplicate(db, a.id, b.id).then(() => {
                            showToast(t.notDuplicateDone, { tone: "success" });
                          });
                        }}
                      >
                        {t.notDuplicate}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <div className="px-4 pt-3 pb-1">
            <AddButton
              label={t.add}
              onClick={() => {
                setCreating(true);
              }}
            />
          </div>
          <Section title={t.count(view.shown.length)} className="pb-6">
            {view.shown.length === 0 ? (
              <EmptyHint inset>{t.noResult}</EmptyHint>
            ) : (
              <ul className="divide-y divide-border/50">
                {view.shown.map((article) => {
                  const category = data.categoryById.get(article.categoryId);
                  return (
                    <li key={article.id}>
                      <RowButton
                        to={manageArticlePath(article.id)}
                        icon={
                          <ArticleIcon article={article} category={category} />
                        }
                        title={article.name}
                        detail={category?.name}
                        chevron
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </>
      )}

      {creating && data && (
        <CreateArticleSheet
          entry={{ text: query.trim() }}
          data={data}
          submitLabel={t.create}
          allowOneOff={false}
          onCancel={() => {
            setCreating(false);
          }}
          onCreated={(article, existed) => {
            if (existed) showToast(t.exists(article.name), { tone: "info" });
            setCreating(false);
            void navigate(manageArticlePath(article.id));
          }}
        />
      )}
      {merging && (
        <Sheet
          autoFocus={false}
          onClose={() => {
            setMerging(null);
          }}
          title={t.merge}
          description={fr.manage.article.mergeText(
            merging[0].name,
            merging[1].name,
          )}
        >
          <div className="flex flex-col gap-3">
            {[merging, [merging[1], merging[0]] as const].map(
              ([keep, other]) => (
                <Button
                  key={keep.id}
                  variant={keep === merging[0] ? "default" : "outline"}
                  onClick={() => {
                    void mergeArticles(db, keep.id, other.id).then(() => {
                      showToast(
                        fr.manage.article.merged(other.name, keep.name),
                        {
                          tone: "success",
                        },
                      );
                    });
                    setMerging(null);
                  }}
                >
                  {fr.manage.article.keep(keep.name)}
                </Button>
              ),
            )}
          </div>
        </Sheet>
      )}
    </>
  );
}
