import { useEffect, useState } from "react";
import { db } from "@/db/database";
import { applyListMerge, previewListMerge } from "@/db/lists";
import type { MergeLine } from "@/domain/listMerge";
import type { ID } from "@/domain/model";
import { feedback } from "@/feedback";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { CheckRow, FieldLabel } from "@/ui/form";
import { ProductIcon } from "@/ui/ProductIcon";
import { RowText } from "@/ui/RowButton";
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
          <FieldLabel as="legend">{t.sources}</FieldLabel>
          {others.map((list) => (
            <CheckRow
              key={list.id}
              className="font-semibold"
              checked={sources.includes(list.id)}
              onCheckedChange={(checked) => {
                setSources((current) =>
                  checked
                    ? [...current, list.id]
                    : current.filter((id) => id !== list.id),
                );
              }}
            >
              {list.name}
            </CheckRow>
          ))}
        </fieldset>

        <fieldset>
          <FieldLabel as="legend">{t.lines}</FieldLabel>
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
                <CheckRow
                  key={line.articleId}
                  checked={!excluded.has(line.articleId)}
                  onCheckedChange={(checked) => {
                    setExcluded((current) => {
                      const next = new Set(current);
                      if (checked) next.delete(line.articleId);
                      else next.add(line.articleId);
                      return next;
                    });
                  }}
                >
                  <ProductIcon
                    icon={article.icon}
                    label={article.name}
                    color={paletteColor(category?.color)}
                    size={28}
                  />
                  <RowText
                    title={article.name}
                    detail={
                      (line.kind === "new"
                        ? t.isNew
                        : t.merged(lineQuantity(line, data.unitById))) +
                      (line.note ? ` · ${line.note}` : "")
                    }
                  />
                  <span className="shrink-0 font-bold text-secondary tabular-nums">
                    {lineQuantity(line, data.unitById)}
                  </span>
                </CheckRow>
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
