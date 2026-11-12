import { Search } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { catalogCategoryPath } from "@/app/routes";
import { categoriesData } from "@/data";
import { searchArticles } from "@/domain/search";
import { fr } from "@/i18n/fr";
import { CategoryCard } from "@/ui/CategoryCard";
import { PageHeader } from "@/ui/Page";
import { paletteColor } from "@/features/list/format";
import { useListData } from "@/features/list/useListData";
import { ArticleGrid } from "./ArticleGrid";

const t = fr.catalog;
const MAX_USUAL = 9;
const collator = new Intl.Collator("fr");

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pt-4">
      <h2 className="px-5 pb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Catalogue (docs/03 A5, A6) : recherche, favoris et habituels en tête, puis la
 * grille des catégories. Les habituels viennent de l'historique des courses.
 */
export function CatalogPage() {
  const data = useListData();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const view = useMemo(() => {
    if (!data) return undefined;
    const results = query.trim()
      ? searchArticles(query, data.articles, data.purchaseCounts).map(
          (r) => r.article,
        )
      : [];
    const favorites = data.articles
      .filter((a) => a.favorite)
      .sort((a, b) => collator.compare(a.name, b.name));
    const usual = [...data.purchaseCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_USUAL)
      .map(([id]) => data.articleById.get(id))
      .filter((a) => a !== undefined);
    const counts = new Map<string, number>();
    for (const article of data.articles)
      counts.set(article.categoryId, (counts.get(article.categoryId) ?? 0) + 1);
    // Ordre du catalogue de départ (docs/06 § 2), puis les catégories créées par
    // l'utilisateur par ordre alphabétique ; « Autres » toujours en dernier.
    const rank = (key: string | undefined) => {
      const index = categoriesData.findIndex((c) => c.key === key);
      return index < 0 ? categoriesData.length - 1 : index;
    };
    const categories = data.categories
      .filter((c) => counts.has(c.id))
      .sort(
        (a, b) =>
          Number(a.isSystem) - Number(b.isSystem) ||
          rank(a.catalogKey) - rank(b.catalogKey) ||
          collator.compare(a.name, b.name),
      );
    return { results, favorites, usual, categories, counts };
  }, [data, query]);

  return (
    <>
      <PageHeader title={t.title} />
      <div className="px-4 pb-2">
        <label className="flex h-12 items-center gap-2 rounded-full border border-border bg-raised px-4">
          <Search className="size-5 shrink-0 text-secondary" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder={t.search}
            aria-label={t.search}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
        </label>
      </div>

      {data && view && (
        <>
          {query.trim() ? (
            <ArticleGrid articles={view.results} data={data} />
          ) : (
            <>
              {view.favorites.length > 0 && (
                <Section title={t.favorites}>
                  <ArticleGrid articles={view.favorites} data={data} />
                </Section>
              )}
              {view.usual.length > 0 && (
                <Section title={t.usual}>
                  <ArticleGrid articles={view.usual} data={data} />
                </Section>
              )}
              <Section title={t.categories}>
                <div className="grid grid-cols-3 gap-2 px-3">
                  {view.categories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      label={category.name}
                      icon={category.icon}
                      color={paletteColor(category.color)}
                      onClick={() => {
                        void navigate(catalogCategoryPath(category.id));
                      }}
                    />
                  ))}
                </div>
              </Section>
            </>
          )}
        </>
      )}
    </>
  );
}
