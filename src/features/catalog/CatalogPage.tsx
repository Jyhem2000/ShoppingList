import { type ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { catalogCategoryPath } from "@/app/routes";
import { groupArticlesByCategory, sortCategories } from "@/domain/categories";
import { searchArticles } from "@/domain/search";
import { fr } from "@/i18n/fr";
import { CategoryCard } from "@/ui/CategoryCard";
import { EmptyHint, Intro, PageHeader, SectionTitle } from "@/ui/Page";
import { useListData } from "@/common/useListData";
import { useRestockSuggestions } from "@/common/useRestock";
import { useFirstDefined } from "@/ui/useFirstDefined";
import { catalogOrder } from "@/common/format";
import { ArticleGrid } from "@/common/ArticleGrid";
import { CatalogSearch } from "./CatalogSearch";
import { byName } from "@/domain/slug";
import { countBy } from "@/domain/collections";
import { inSeason } from "@/domain/season";
import { Chip } from "@/ui/form";
import { SeasonBadge } from "@/ui/SeasonBadge";
import { useMonth, useNow } from "@/ui/useNow";
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
 * tête, puis la grille des catégories. Les habituels viennent de l'historique des courses :
 * ce qu'il est temps de racheter d'abord (docs/03 D1), puis les plus achetés.
 * Filtre « De saison » (docs/03 D3) : les articles de saison ce mois-ci, par catégorie.
 */
export function CatalogPage() {
  const data = useListData();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  // « Voir les N résultats » : la grille complète de la recherche.
  const [showAll, setShowAll] = useState(false);
  const [seasonOnly, setSeasonOnly] = useState(false);
  const month = useMonth();

  // À racheter, figé à l'ouverture (comme dans le tour) : un article touché reste à sa
  // place dans les habituels, avec sa pastille de quantité, au lieu de sauter.
  const due = useFirstDefined(useRestockSuggestions(data, useNow()));
  const { articles, articleById, purchaseCounts, categories } = data ?? {};
  // Ce qui ne dépend pas de la saisie : calculé une fois, pas à chaque lettre.
  const home = useMemo(() => {
    if (!articles || !articleById || !purchaseCounts || !categories)
      return undefined;
    const favorites = articles.filter((a) => a.favorite).sort(byName);
    // Ce qu'il est temps de racheter d'abord (anti-oubli, docs/03 D1), puis les plus achetés.
    const mostBought = [...purchaseCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
    const dueIds = (due ?? []).map((s) => s.articleId);
    const usual = [...new Set([...dueIds, ...mostBought])]
      .map((id) => articleById.get(id))
      .filter((a) => a !== undefined)
      .slice(0, MAX_USUAL);
    const counts = countBy(articles, (article) => article.categoryId);
    // Même ordre que la liste (docs/06 § 2) : catalogue de départ, puis les catégories
    // créées par l'utilisateur, les catégories système en dernier.
    const shown = sortCategories(
      categories.filter((c) => counts.has(c.id)),
      catalogOrder,
    );
    return { favorites, usual, categories: shown, counts };
  }, [articles, articleById, purchaseCounts, categories, due]);
  // Calculé seulement quand le filtre « De saison » est actif.
  const season = useMemo(
    () =>
      seasonOnly && articles && home
        ? groupArticlesByCategory(
            home.categories,
            articles.filter((a) => inSeason(a, month)),
            byName,
          )
        : [],
    [seasonOnly, articles, home, month],
  );
  const searching = query.trim() !== "";
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
          {!searching && (
            <div className="px-4 pt-3">
              <Chip
                selected={seasonOnly}
                className="inline-flex items-center gap-1.5"
                onClick={() => {
                  setSeasonOnly(!seasonOnly);
                }}
              >
                <SeasonBadge decorative className="fill-transparent" />
                {t.seasonFilter}
              </Chip>
            </div>
          )}
          {showAll && searching ? (
            <ArticleGrid articles={results} data={data} />
          ) : seasonOnly && !searching ? (
            <>
              <Intro className="pt-3">
                {t.seasonTitle(fr.season.monthNames[month - 1] ?? "")}
              </Intro>
              {season.length === 0 && (
                <EmptyHint inset>{t.seasonEmpty}</EmptyHint>
              )}
              {season.map(({ category, articles: inThisCategory }) => (
                <Section key={category.id} title={category.name}>
                  <ArticleGrid articles={inThisCategory} data={data} />
                </Section>
              ))}
            </>
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
