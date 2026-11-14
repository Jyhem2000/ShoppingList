import { useEffect, useState } from "react";
import { db } from "@/db/database";
import { applyListMerge, previewListMerge } from "@/db/lists";
import type { MergeLine } from "@/domain/listMerge";
import type { ID } from "@/domain/model";
import { feedback } from "@/feedback";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { ProductIcon } from "@/ui/ProductIcon";
import { Sheet } from "@/ui/Sheet";
import { showToast } from "@/ui/toast";
import { lineQuantity, paletteColor } from "./format";
import type { ListData } from "./useListData";

const t = fr.list.merge;

/**
 * Compléter la liste courante avec le contenu d'autres listes (docs/02 § 6) :
 * choix des listes, aperçu des lignes (cases à cocher), puis fusion.
 */
export function MergeListsSheet({
  data,
  initialSources = [],
  onClose,
}: {
  data: ListData;
  initialSources?: ID[];
  onClose: () => void;
}) {
  const others = data.lists.filter((list) => list.id !== data.list.id);
  const [sources, setSources] = useState<ID[]>(
    initialSources.filter((id) => id !== data.list.id),
  );
  const [lines, setLines] = useState<MergeLine[]>([]);
  const [excluded, setExcluded] = useState<ReadonlySet<ID>>(new Set());

  useEffect(() => {
    let active = true;
    void previewListMerge(db, data.list.id, sources).then((preview) => {
      if (active) setLines(preview);
    });
    return () => {
      active = false;
    };
  }, [data.list.id, data.items, sources]);

  const chosen = lines.filter((line) => !excluded.has(line.articleId));

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t.title(data.list.name)}
      description={t.text}
    >
      <div className="flex flex-col gap-4 pb-1">
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-muted-foreground">
            {t.sources}
          </legend>
          {others.map((list) => (
            <label
              key={list.id}
              className="flex min-h-11 items-center gap-3 font-semibold"
            >
              <input
                type="checkbox"
                className="size-5 accent-primary"
                checked={sources.includes(list.id)}
                onChange={(event) => {
                  setSources((current) =>
                    event.target.checked
                      ? [...current, list.id]
                      : current.filter((id) => id !== list.id),
                  );
                }}
              />
              {list.name}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-muted-foreground">
            {t.lines}
          </legend>
          {sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.nothing}</p>
          ) : lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.empty}</p>
          ) : (
            lines.map((line) => {
              const article = data.articleById.get(line.articleId);
              if (!article) return null;
              const category = data.categoryById.get(article.categoryId);
              return (
                <label
                  key={line.articleId}
                  className="flex min-h-12 items-center gap-3"
                >
                  <input
                    type="checkbox"
                    className="size-5 accent-primary"
                    checked={!excluded.has(line.articleId)}
                    onChange={(event) => {
                      setExcluded((current) => {
                        const next = new Set(current);
                        if (event.target.checked) next.delete(line.articleId);
                        else next.add(line.articleId);
                        return next;
                      });
                    }}
                  />
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
                      {line.kind === "new"
                        ? t.isNew
                        : t.merged(lineQuantity(line, data.unitById))}
                      {line.note ? ` · ${line.note}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold text-secondary tabular-nums">
                    {lineQuantity(line, data.unitById)}
                  </span>
                </label>
              );
            })
          )}
        </fieldset>

        <Button
          disabled={chosen.length === 0}
          onClick={() => {
            void applyListMerge(db, data.list.id, chosen).then(() => {
              feedback.add();
              showToast(t.done(chosen.length), { tone: "success" });
              onClose();
            });
          }}
        >
          {t.apply(chosen.length)}
        </Button>
      </div>
    </Sheet>
  );
}
