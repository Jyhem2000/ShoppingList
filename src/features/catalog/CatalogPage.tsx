import { type ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { catalogCategoryPath } from "@/app/routes";
import { sortCategories } from "@/domain/categories";
import { searchArticles } from "@/domain/search";
import { fr } from "@/i18n/fr";
import { CategoryCard } from "@/ui/CategoryCard";
import { PageHeader, SectionTitle } from "@/ui/Page";
import { useListData } from "@/common/useListData";
import { catalogOrder } from "@/common/format";
import { ArticleGrid } from "./ArticleGrid";
import { CatalogSearch } from "./CatalogSearch";
import { byName } from "@/domain/slug";
import { countBy } from "@/domain/collections";
const t = fr.catalog;
const MAX_USUAL = 9;
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

  const { articles, articleById, purchaseCounts, categories } = data ?? {};
  // Ce qui ne dépend pas de la saisie : calculé une fois, pas à chaque lettre.
  const home = useMemo(() => {
    if (!articles || !articleById || !purchaseCounts || !categories)
      return undefined;
    const favorites = articles.filter((a) => a.favorite).sort(byName);
    const usual = [...purchaseCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_USUAL)
      .map(([id]) => articleById.get(id))
      .filter((a) => a !== undefined);
    const counts = countBy(articles, (article) => article.categoryId);
    // Même ordre que la liste (docs/06 § 2) : catalogue de départ, puis les catégories
    // créées par l'utilisateur, les catégories système en dernier.
    const shown = sortCategories(
      categories.filter((c) => counts.has(c.id)),
      catalogOrder,
    );
    return { favorites, usual, categories: shown, counts };
  }, [articles, articleById, purchaseCounts, categories]);
  // Une seule recherche, pour les suggestions et pour « Voir les N résultats ».
  const results = useMemo(
    () =>
      articles && purchaseCounts && query.trim()
        ? searchArticles(query, articles, purchaseCounts).map((r) => r.article)
        : [],
    [query, articles, purchaseCounts],
  );

  return (
    <>
      <PageHeader title={t.title} />
      {data && (
        <CatalogSearch
          data={data}
          counts={home?.counts}
          results={results}
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

      {data && home && (
        <>
          {showAll && query.trim() ? (
            <ArticleGrid articles={results} data={data} />
          ) : (
            <>
              {home.favorites.length > 0 && (
                <Section title={t.favorites}>
                  <ArticleGrid articles={home.favorites} data={data} />
                </Section>
              )}
              {home.usual.length > 0 && (
                <Section title={t.usual}>
                  <ArticleGrid articles={home.usual} data={data} />
                </Section>
              )}
              {/* Titre seulement s'il y a des favoris ou des habituels au-dessus : il les
                  sépare de la grille ; seule, la grille se suffit à elle-même. */}
              <section className="pt-4">
                {(home.favorites.length > 0 || home.usual.length > 0) && (
                  <div className="px-4 pt-2">
                    <SectionTitle>{t.categories}</SectionTitle>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 px-3">
                  {home.categories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      label={category.name}
                      icon={category.icon}
                      color={category.color}
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
