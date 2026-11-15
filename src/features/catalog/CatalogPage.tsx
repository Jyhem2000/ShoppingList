import { type ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { catalogCategoryPath } from "@/app/routes";
import { categoriesData } from "@/data";
import { sortCategories } from "@/domain/categories";
import { searchArticles } from "@/domain/search";
import { fr } from "@/i18n/fr";
import { CategoryCard } from "@/ui/CategoryCard";
import { PageHeader, SectionTitle } from "@/ui/Page";
import { useListData } from "@/features/list/useListData";
import { ArticleGrid } from "./ArticleGrid";
import { CatalogSearch } from "./CatalogSearch";
import { paletteColor } from "@/ui/palette";
const t = fr.catalog;
const MAX_USUAL = 9;
const collator = new Intl.Collator("fr");

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pt-6">
      <div className="px-4">
        <SectionTitle>{title}</SectionTitle>
      </div>
      {children}
    </section>
  );
}

/**
 * Catalogue (docs/03 A5, A6) : recherche avec suggestions, favoris et habituels en
 * tête, puis la grille des catégories. Les habituels viennent de l'historique des courses.
 */
export function CatalogPage() {
  const data = useListData();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  // « Voir les N résultats » : la grille complète de la recherche.
  const [showAll, setShowAll] = useState(false);

  const view = useMemo(() => {
    if (!data) return undefined;
    const results =
      showAll && query.trim()
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
    // Même ordre que la liste (docs/06 § 2) : catalogue de départ, puis les catégories
    // créées par l'utilisateur, les catégories système en dernier.
    const categories = sortCategories(
      data.categories.filter((c) => counts.has(c.id)),
      categoriesData.map((c) => c.key),
    );
    return { results, favorites, usual, categories, counts };
  }, [data, query, showAll]);

  return (
    <>
      <PageHeader title={t.title} />
      {data && (
        <CatalogSearch
          data={data}
          query={query}
          onQueryChange={(text) => {
            setQuery(text);
            setShowAll(false);
          }}
          showAll={showAll}
          onShowAll={() => {
            setShowAll(true);
          }}
        />
      )}

      {data && view && (
        <>
          {showAll && query.trim() ? (
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
              {/* Titre seulement s'il y a des favoris ou des habituels au-dessus : il les
                  sépare de la grille ; seule, la grille se suffit à elle-même. */}
              <section className="pt-4">
                {(view.favorites.length > 0 || view.usual.length > 0) && (
                  <div className="px-4 pt-2">
                    <SectionTitle>{t.categories}</SectionTitle>
                  </div>
                )}
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
              </section>
            </>
          )}
        </>
      )}
    </>
  );
}
