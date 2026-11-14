import { type ReactNode, useId, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { catalogCategoryPath } from "@/app/routes";
import type { Article } from "@/domain/model";
import { searchKey } from "@/domain/slug";
import { searchArticles } from "@/domain/search";
import { lineQuantity } from "@/features/list/format";
import type { ListData } from "@/features/list/useListData";
import { fr } from "@/i18n/fr";
import { GroupIcon } from "@/ui/GroupIcon";
import { SearchField } from "@/ui/SearchField";
import { showToast } from "@/ui/toast";
import { useCatalogPick } from "./useCatalogPick";
import { RowButton } from "@/ui/RowButton";
import { SuggestionList } from "@/ui/SuggestionList";
import { ArticleIcon } from "@/ui/ArticleIcon";
const t = fr.catalog;
const MAX_SUGGESTIONS = 8;

/** Sans accents ni majuscules, lettre par lettre (même longueur que le texte d'origine). */
function fold(text: string): string {
  // Caractère par caractère (unités UTF-16, sans le drapeau u) : les positions
  // restent celles du texte d'origine, pour mettre en gras la bonne partie.
  return text.replace(
    /[\s\S]/g,
    (char) =>
      char.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().charAt(0) ||
      char,
  );
}

/** Le libellé avec la partie tapée en gras (« **pom**mes »), s'il la contient. */
function highlight(label: string, query: string): ReactNode {
  const index = fold(label).indexOf(fold(query.trim()));
  if (index < 0 || !query.trim()) return label;
  const end = index + query.trim().length;
  return (
    <>
      {label.slice(0, index)}
      <mark className="bg-transparent font-extrabold text-primary">
        {label.slice(index, end)}
      </mark>
      {label.slice(end)}
    </>
  );
}

/**
 * Recherche du catalogue avec suggestions (docs/03 A5) : dès la première lettre, les
 * articles qui correspondent (nom, alias, sans tenir compte des accents) s'affichent
 * sous le champ ; tap ou Entrée sur le premier = ajout à la liste (ou réglage de la
 * quantité s'il y est déjà). « Voir les N résultats » ouvre la grille complète.
 */
export function CatalogSearch({
  data,
  query,
  onQueryChange,
  showAll,
  onShowAll,
}: {
  data: ListData;
  query: string;
  onQueryChange: (query: string) => void;
  showAll: boolean;
  onShowAll: () => void;
}) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const { pick, sheet } = useCatalogPick(data);
  const navigate = useNavigate();
  // Catégories dont un mot commence par la saisie (« anim » → Animaux) : tous leurs articles.
  const categories = useMemo(() => {
    const key = searchKey(query);
    if (!key) return [];
    const counts = new Map<string, number>();
    for (const a of data.articles)
      counts.set(a.categoryId, (counts.get(a.categoryId) ?? 0) + 1);
    return data.categories
      .filter(
        (c) =>
          (counts.get(c.id) ?? 0) > 0 &&
          searchKey(c.name)
            .split("-")
            .some((word) => word.startsWith(key)),
      )
      .slice(0, 3)
      .map((c) => ({ category: c, count: counts.get(c.id) ?? 0 }));
  }, [query, data]);
  const results = useMemo(
    () =>
      query.trim()
        ? searchArticles(query, data.articles, data.purchaseCounts).map(
            (r) => r.article,
          )
        : [],
    [query, data],
  );
  const inList = new Map(data.items.map((item) => [item.articleId, item]));
  const suggestions = results.slice(0, MAX_SUGGESTIONS);
  const open = query.trim() !== "" && !showAll;

  const choose = (article: Article) => {
    if (pick(article) === "added") {
      showToast(t.added(article.name), { tone: "success" });
      onQueryChange("");
      input.current?.focus();
    }
  };

  return (
    <div className="relative px-4 pb-2">
      <SearchField
        ref={input}
        label={t.search}
        value={query}
        onValueChange={onQueryChange}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        onKeyDown={(event) => {
          if (event.key === "Enter" && suggestions[0]) {
            event.preventDefault();
            choose(suggestions[0]);
          }
          if (event.key === "Escape") onQueryChange("");
        }}
      />

      {open && (
        <SuggestionList
          id={listId}
          role="listbox"
          aria-label={t.suggestions}
          className="absolute inset-x-4 top-full z-30 -mt-1 max-h-[60dvh] overflow-y-auto"
        >
          {categories.map(({ category, count }) => (
            <li key={category.id} role="option" aria-selected={false}>
              <RowButton
                inset="popover"
                className="border-b border-border/60"
                icon={
                  <span className="flex size-7 shrink-0 items-center justify-center">
                    <GroupIcon
                      name={category.icon}
                      palette={category.color}
                      className="size-6"
                    />
                  </span>
                }
                title={highlight(category.name, query)}
                detail={t.categoryResult(count)}
                chevron
                onClick={() => {
                  onQueryChange("");
                  void navigate(catalogCategoryPath(category.id));
                }}
              />
            </li>
          ))}
          {suggestions.length === 0 && categories.length === 0 && (
            <li className="px-4 py-3 text-muted-foreground">{t.noResult}</li>
          )}
          {suggestions.map((article) => {
            const category = data.categoryById.get(article.categoryId);
            const item = inList.get(article.id);
            return (
              <li key={article.id} role="option" aria-selected={false}>
                <RowButton
                  inset="popover"
                  icon={<ArticleIcon article={article} category={category} />}
                  title={highlight(article.name, query)}
                  detail={category?.name}
                  trailing={
                    item && (
                      <span className="shrink-0 text-sm font-bold text-secondary tabular-nums">
                        {lineQuantity(item, data.unitById)}
                      </span>
                    )
                  }
                  onClick={() => {
                    choose(article);
                  }}
                />
              </li>
            );
          })}
          {results.length > suggestions.length && (
            <li>
              <button
                type="button"
                onClick={onShowAll}
                className="flex min-h-12 w-full items-center justify-center px-3 font-semibold text-primary active:bg-raised"
              >
                {t.showAll(results.length)}
              </button>
            </li>
          )}
        </SuggestionList>
      )}
      {sheet}
    </div>
  );
}
