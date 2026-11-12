import { useState } from "react";
import { db } from "@/db/database";
import { moveArticle, type MoveScope } from "@/db/sessions";
import type { Aisle, Article, ID } from "@/domain/model";
import { paletteColor } from "@/features/list/format";
import type { ListData } from "@/features/list/useListData";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { GroupIcon } from "@/ui/GroupIcon";
import { palette } from "@/ui/palette";
import { Sheet } from "@/ui/Sheet";
import { showToast } from "@/ui/toast";
import { cn } from "@/ui/utils";

const t = fr.shopping.move;

/**
 * Changer un article de rayon dans ce magasin (docs/03 C5, docs/02 § 4) : d'abord les
 * rayons où l'on trouve sa catégorie, puis les autres ; puis « seulement cet article »
 * ou « toute la catégorie ».
 */
export function MoveAisleSheet({
  data,
  article,
  currentAisleId,
  sessionId,
  onClose,
}: {
  data: ListData;
  article: Article;
  currentAisleId: ID | undefined;
  sessionId?: ID;
  onClose: () => void;
}) {
  const [target, setTarget] = useState<Aisle>();
  const storeId = data.store?.id;
  const category = data.categoryById.get(article.categoryId);
  const sorted = [...data.aisles].sort(
    (a, b) =>
      Number(a.isUnsorted) - Number(b.isUnsorted) || a.position - b.position,
  );
  const hasCategory = (aisle: Aisle) =>
    aisle.categories.some((c) => c.categoryId === article.categoryId);
  const withCategory = sorted.filter(hasCategory);
  const others = sorted.filter((aisle) => !hasCategory(aisle));

  const move = (aisle: Aisle, scope: MoveScope) => {
    if (!storeId) return;
    void moveArticle(db, {
      storeId,
      article,
      aisleId: aisle.id,
      scope,
      sessionId,
    }).then(() => {
      showToast(t.done(article.name, aisle.name), { tone: "success" });
    });
    onClose();
  };

  const pick = (aisle: Aisle) => {
    if (aisle.id === currentAisleId) {
      onClose();
      return;
    }
    // Catégorie système (« Autres », « Achats ponctuels ») : l'article seul.
    if (category?.isSystem) move(aisle, "article");
    else setTarget(aisle);
  };

  const row = (aisle: Aisle) => {
    const color = paletteColor(aisle.color);
    const here = aisle.id === currentAisleId;
    return (
      <li key={aisle.id}>
        <button
          type="button"
          onClick={() => {
            pick(aisle);
          }}
          className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left font-semibold active:bg-raised"
        >
          <GroupIcon
            name={aisle.icon}
            className={cn("size-5 shrink-0", palette[color].text)}
          />
          <span className="min-w-0 flex-1 truncate">{aisle.name}</span>
          {here && (
            <span className="shrink-0 text-sm text-muted-foreground">
              {t.here}
            </span>
          )}
        </button>
      </li>
    );
  };

  return (
    <Sheet
      open
      autoFocus={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={target ? t.scopeTitle(target.name) : t.title(article.name)}
      description={target ? t.scopeText : t.text}
    >
      {target ? (
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => {
              move(target, "article");
            }}
          >
            {t.onlyArticle(article.name)}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              move(target, "category");
            }}
          >
            {t.wholeCategory(category?.name ?? "")}
          </Button>
        </div>
      ) : (
        <div className="-mx-2 max-h-[55dvh] overflow-y-auto">
          {withCategory.length > 0 && (
            <>
              <p className="px-2 pb-1 text-sm font-semibold text-muted-foreground">
                {t.withCategory}
              </p>
              <ul className="mb-3">{withCategory.map(row)}</ul>
              <p className="px-2 pb-1 text-sm font-semibold text-muted-foreground">
                {t.others}
              </p>
            </>
          )}
          <ul>{others.map(row)}</ul>
        </div>
      )}
    </Sheet>
  );
}
