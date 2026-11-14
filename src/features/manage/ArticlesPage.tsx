import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { manageArticlePath, routes } from "@/app/routes";
import { markNotDuplicate, mergeArticles } from "@/db/articles";
import { createArticle } from "@/db/catalog";
import { db } from "@/db/database";
import { findLikelyDuplicates } from "@/domain/duplicates";
import type { Article, ID } from "@/domain/model";
import { searchArticles } from "@/domain/search";
import { UnitSelect } from "@/features/list/UnitSelect";
import { type ListData, useListData } from "@/features/list/useListData";
import { fr } from "@/i18n/fr";
import { SearchField } from "@/ui/SearchField";
import { Button } from "@/ui/button";
import { Field, Select, TextInput } from "@/ui/form";
import { PageHeader, Section } from "@/ui/Page";
import { Sheet } from "@/ui/Sheet";
import { showToast } from "@/ui/toast";
import { RowButton } from "@/ui/RowButton";
import { ArticleIcon } from "@/ui/ArticleIcon";
const t = fr.manage.articles;
const collator = new Intl.Collator("fr");

/**
 * Articles (docs/03 G1) : recherche, filtre par catégorie, doublons probables en tête
 * (« Fusionner » ou « Ce ne sont pas des doublons »), création d'un article.
 */
export function ArticlesPage() {
  const data = useListData();
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
      : [...inCategory].sort((a, b) => collator.compare(a.name, b.name));
    return { shown, duplicates: findLikelyDuplicates(data.articles) };
  }, [data, query, categoryId]);

  return (
    <>
      <PageHeader title={t.title} backTo={routes.settings} />
      <div className="flex flex-col gap-2 px-4 pb-2">
        <SearchField label={t.search} value={query} onValueChange={setQuery} />
        <Select
          aria-label={t.allCategories}
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
          }}
        >
          <option value="">{t.allCategories}</option>
          {[...(data?.categories ?? [])]
            .sort((a, b) => collator.compare(a.name, b.name))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </Select>
      </div>

      {data && view && (
        <>
          {view.duplicates.length > 0 && !query && !categoryId && (
            <Section title={t.duplicates}>
              <p className="px-4 pt-3 text-sm text-warning">
                {t.duplicatesHint}
              </p>
              <ul className="divide-y divide-border/50">
                {view.duplicates.map(([a, b]) => (
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
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setCreating(true);
              }}
            >
              <Plus />
              {t.add}
            </Button>
          </div>
          <Section title={t.count(view.shown.length)} className="pb-6">
            {view.shown.length === 0 ? (
              <p className="px-4 py-4 text-muted-foreground">{t.noResult}</p>
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
        <NewArticleSheet
          data={data}
          initialName={query}
          onClose={() => {
            setCreating(false);
          }}
        />
      )}
      {merging && (
        <Sheet
          open
          autoFocus={false}
          onOpenChange={(open) => {
            if (!open) setMerging(null);
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

function NewArticleSheet({
  data,
  initialName,
  onClose,
}: {
  data: ListData;
  initialName: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const others = data.categories.find((c) => c.catalogKey === "autres");
  const [name, setName] = useState(initialName.trim());
  const [categoryId, setCategoryId] = useState(
    others?.id ?? data.categories[0]?.id ?? "",
  );
  const piece = data.units.find((u) => u.slug === "piece");
  const [unitId, setUnitId] = useState(piece?.id ?? data.units[0]?.id ?? "");

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t.newTitle}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || !categoryId || !unitId) return;
          void createArticle(db, {
            name: name.trim(),
            categoryId,
            defaultUnitId: unitId,
          }).then((result) => {
            if (result.kind === "exists")
              showToast(t.exists(result.article.name), { tone: "info" });
            onClose();
            void navigate(manageArticlePath(result.article.id));
          });
        }}
      >
        <Field label={t.name}>
          <TextInput
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        </Field>
        <Field label={t.category}>
          <Select
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
            }}
          >
            {[...data.categories]
              .sort((a, b) => collator.compare(a.name, b.name))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </Select>
        </Field>
        <Field label={t.unit}>
          <UnitSelect
            units={data.units}
            value={unitId}
            onChange={(event) => {
              setUnitId(event.target.value);
            }}
          />
        </Field>
        <Button type="submit" disabled={!name.trim()}>
          {t.create}
        </Button>
      </form>
    </Sheet>
  );
}
