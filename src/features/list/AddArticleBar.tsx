import { Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { parseEntry, type ParsedEntry } from "@/domain/entry";
import type { Article } from "@/domain/model";
import { searchArticles } from "@/domain/search";
import { searchKey } from "@/domain/slug";
import { fr } from "@/i18n/fr";
import { AddBar } from "@/ui/AddBar";
import { ProductIcon } from "@/ui/ProductIcon";
import { lineQuantity, paletteColor } from "./format";
import type { ListData } from "./useListData";

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
}: {
  data: ListData;
  onSubmit: (text: string) => void;
  onPick: (article: Article, entry: ParsedEntry) => void;
  onCreate: (entry: ParsedEntry) => void;
}) {
  const [text, setText] = useState("");
  const input = useRef<HTMLInputElement>(null);

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
    input.current?.focus();
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-bg via-bg/90 to-transparent px-3 pt-6 pb-3">
      <div className="mx-auto max-w-xl">
        {entry && (suggestions.length > 0 || canCreate) && (
          <ul
            aria-label={t.addPlaceholder}
            // Garde le clavier ouvert : le tap ne retire pas le focus du champ.
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            className="mb-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg shadow-black/40"
          >
            {suggestions.map(({ article }) => {
              const category = data.categoryById.get(article.categoryId);
              const item = inList.get(article.id);
              return (
                <li key={article.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(article, entry);
                      done();
                    }}
                    className="flex min-h-12 w-full items-center gap-3 px-3 py-1.5 text-left active:bg-raised"
                  >
                    <ProductIcon
                      icon={article.icon}
                      label={article.name}
                      color={paletteColor(category?.color)}
                      size={28}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {article.name}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {item
                          ? t.inList(lineQuantity(item, data.unitById))
                          : category?.name}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
            {canCreate && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onCreate(entry);
                    setText("");
                  }}
                  className="flex min-h-12 w-full items-center gap-3 px-3 py-1.5 text-left font-semibold text-primary active:bg-raised"
                >
                  <span className="flex size-7 items-center justify-center rounded-lg bg-raised">
                    <Plus className="size-4" aria-hidden />
                  </span>
                  {t.create(entry.text)}
                </button>
              </li>
            )}
          </ul>
        )}
        <AddBar
          placeholder={t.addPlaceholder}
          addLabel={t.addLabel}
          value={text}
          onValueChange={setText}
          inputRef={input}
          onSubmit={(value) => {
            onSubmit(value);
            input.current?.focus();
          }}
        />
      </div>
    </div>
  );
}
