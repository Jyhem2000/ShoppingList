import { Plus } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import {
  knownLabel,
  parseEntry,
  pastedEntry,
  typeSuggestions,
  type ParsedEntry,
} from "@/domain/entry";
import type { Article } from "@/domain/model";
import { searchArticles } from "@/domain/search";
import { searchKey } from "@/domain/slug";
import { texts } from "@/i18n";
import { AddBar } from "@/ui/AddBar";
import { quantitiesInList } from "./format";
import type { ListData } from "./useListData";
import { RowButton } from "@/ui/RowButton";
import { SuggestionList } from "@/ui/SuggestionList";
import { ArticleIcon } from "@/ui/ArticleIcon";
const t = texts.list;
const MAX_SUGGESTIONS = 5;

/**
 * Barre d'ajout éclair (docs/03 A1, A2) et ses suggestions, affichées au-dessus
 * (donc au-dessus du clavier). Entrée : la saisie entière est analysée ; tap sur
 * une suggestion : cet article, avec son type pour une suggestion par type
 * (« Pommes · Golden », quand on tape `pommes g`). La barre se vide et garde le clavier ouvert.
 * Sert aussi aux ingrédients d'une recette (docs/03 E1).
 */
export function AddArticleBar({
  data,
  onSubmit,
  onPick,
  onCreate,
  trailing,
  above,
  placeholder = t.addPlaceholder,
  addLabel = t.addLabel,
  showInList = true,
  recipe = false,
}: {
  /** Texte du champ vide (« Ajouter un ingrédient… » dans une recette). */
  placeholder?: string;
  addLabel?: string;
  /** Indique ce que la liste courante contient déjà (pas dans une recette). */
  showInList?: boolean;
  /** Ingrédients d'une recette : les unités de cuisine se lisent (docs/03 A2). */
  recipe?: boolean;
  /** À droite de la barre (« Terminer » en mode courses). */
  trailing?: ReactNode;
  /** Au-dessus de la barre, quand il n'y a pas de suggestions (« Rayon suivant »). */
  above?: ReactNode;
  data: ListData;
  onSubmit: (text: string) => void;
  onPick: (
    article: Article,
    entry: ParsedEntry,
    acceptedTypes: string[],
  ) => void;
  onCreate: (entry: ParsedEntry) => void;
}) {
  const [text, setText] = useState("");

  const { entry, suggestions, canCreate } = useMemo(() => {
    const entries = parseEntry(text, data.units, {
      recipe,
      known: knownLabel(data.articles),
    });
    const [first] = entries;
    if (!first || entries.length > 1)
      return { entry: undefined, suggestions: [], canCreate: false };
    const byType = typeSuggestions(first.text, data.articles);
    const results = [
      ...byType,
      ...searchArticles(first.text, data.articles, data.purchaseCounts).map(
        ({ article }) => ({ article, type: undefined }),
      ),
    ].slice(0, MAX_SUGGESTIONS);
    const key = searchKey(first.text);
    const exact = results.some(
      (r) =>
        searchKey(r.article.name) === key ||
        r.article.aliases.some((alias) => searchKey(alias) === key),
    );
    return {
      entry: first,
      suggestions: results,
      canCreate: !exact && byType.length === 0,
    };
  }, [text, data, recipe]);

  const inList = useMemo(
    () => quantitiesInList(data.items, data.unitById),
    [data.items, data.unitById],
  );

  const done = () => {
    setText("");
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-bg via-bg/90 to-transparent px-3 pt-6 pb-3">
      <div className="mx-auto max-w-xl">
        {entry && (suggestions.length > 0 || canCreate) && (
          <SuggestionList aria-label={placeholder} className="mb-2">
            {suggestions.map(({ article, type }) => {
              const category = data.categoryById.get(article.categoryId);
              const quantity = inList.get(article.id);
              return (
                <li key={`${article.id}#${type ?? ""}`}>
                  <RowButton
                    inset="popover"
                    icon={<ArticleIcon article={article} category={category} />}
                    title={type ? t.withType(article.name, type) : article.name}
                    detail={
                      type
                        ? t.typesOne(type)
                        : quantity && showInList
                          ? t.inList(quantity)
                          : category?.name
                    }
                    onClick={() => {
                      onPick(article, entry, type ? [type] : []);
                      done();
                    }}
                  />
                </li>
              );
            })}
            {canCreate && (
              <li>
                <RowButton
                  inset="popover"
                  className="font-semibold text-primary"
                  icon={
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-raised">
                      <Plus className="size-4" aria-hidden />
                    </span>
                  }
                  onClick={() => {
                    onCreate(entry);
                    setText("");
                  }}
                >
                  {t.create(entry.text)}
                </RowButton>
              </li>
            )}
          </SuggestionList>
        )}
        {!(entry && (suggestions.length > 0 || canCreate)) && above}
        <div className="flex items-center gap-2">
          <AddBar
            className="min-w-0 flex-1"
            placeholder={placeholder}
            addLabel={addLabel}
            value={text}
            onValueChange={setText}
            onPasteLines={pastedEntry}
            onSubmit={(value) => {
              onSubmit(value);
            }}
          />
          {trailing}
        </div>
      </div>
    </div>
  );
}
