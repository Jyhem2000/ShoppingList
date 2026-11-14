import { Plus } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { parseEntry, type ParsedEntry } from "@/domain/entry";
import type { Article } from "@/domain/model";
import { searchArticles } from "@/domain/search";
import { searchKey } from "@/domain/slug";
import { fr } from "@/i18n/fr";
import { AddBar } from "@/ui/AddBar";
import { ProductIcon } from "@/ui/ProductIcon";
import { lineQuantity, paletteColor } from "./format";
import type { ListData } from "./useListData";
import { RowButton } from "@/ui/RowButton";
import { SuggestionList } from "@/ui/SuggestionList";
const t = fr.list;
const MAX_SUGGESTIONS = 5;

/**
 * Barre d'ajout éclair (docs/03 A1, A2) et ses suggestions, affichées au-dessus
 * (donc au-dessus du clavier). Entrée : la saisie entière est analysée ; tap sur
 * une suggestion : cet article. La barre se vide et garde le clavier ouvert.
 */
export function AddArticleBar({
  data,
  onSubmit,
  onPick,
  onCreate,
  trailing,
  above,
}: {
  /** À droite de la barre (« Terminer » en mode courses). */
  trailing?: ReactNode;
  /** Au-dessus de la barre, quand il n'y a pas de suggestions (« Rayon suivant »). */
  above?: ReactNode;
  data: ListData;
  onSubmit: (text: string) => void;
  onPick: (article: Article, entry: ParsedEntry) => void;
  onCreate: (entry: ParsedEntry) => void;
}) {
  const [text, setText] = useState("");

  const { entry, suggestions, canCreate } = useMemo(() => {
    const entries = parseEntry(text, data.units);
    const [first] = entries;
    if (!first || entries.length > 1)
      return { entry: undefined, suggestions: [], canCreate: false };
    const results = searchArticles(
      first.text,
      data.articles,
      data.purchaseCounts,
    ).slice(0, MAX_SUGGESTIONS);
    const key = searchKey(first.text);
    const exact = results.some(
      (r) =>
        searchKey(r.article.name) === key ||
        r.article.aliases.some((alias) => searchKey(alias) === key),
    );
    return { entry: first, suggestions: results, canCreate: !exact };
  }, [text, data]);

  const inList = useMemo(
    () => new Map(data.items.map((item) => [item.articleId, item])),
    [data.items],
  );

  const done = () => {
    setText("");
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-bg via-bg/90 to-transparent px-3 pt-6 pb-3">
      <div className="mx-auto max-w-xl">
        {entry && (suggestions.length > 0 || canCreate) && (
          <SuggestionList aria-label={t.addPlaceholder} className="mb-2">
            {suggestions.map(({ article }) => {
              const category = data.categoryById.get(article.categoryId);
              const item = inList.get(article.id);
              return (
                <li key={article.id}>
                  <RowButton
                    inset="popover"
                    icon={
                      <ProductIcon
                        icon={article.icon}
                        label={article.name}
                        color={paletteColor(category?.color)}
                        size={28}
                      />
                    }
                    title={article.name}
                    detail={
                      item
                        ? t.inList(lineQuantity(item, data.unitById))
                        : category?.name
                    }
                    onClick={() => {
                      onPick(article, entry);
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
            placeholder={t.addPlaceholder}
            addLabel={t.addLabel}
            value={text}
            onValueChange={setText}
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
