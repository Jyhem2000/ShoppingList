import { useState } from "react";
import { db } from "@/db/database";
import { moveArticle, type MoveScope } from "@/db/sessions";
import type { Aisle, Article, ID } from "@/domain/model";
import { paletteColor } from "@/features/list/format";
import type { ListData } from "@/features/list/useListData";
import { fr } from "@/i18n/fr";
import { GroupIcon } from "@/ui/GroupIcon";
import { palette } from "@/ui/palette";
import { Sheet } from "@/ui/Sheet";
import { showToast } from "@/ui/toast";
import { cn } from "@/ui/utils";

const t = fr.shopping.move;

/**
 * Changer un article de rayon dans ce magasin (docs/03 C5, docs/02 § 4), en deux étapes :
 * le rayon (d'abord celui où l'on est, puis ceux où l'on trouve sa catégorie, puis les
 * autres), puis « seulement cet article » ou « toute la catégorie », avec retour possible.
 * `currentAisleId` : rayon actuel de l'article ; `hereAisleId` : rayon de la dernière coche.
 */
export function MoveAisleSheet({
  data,
  article,
  currentAisleId,
  hereAisleId,
  sessionId,
  onMoved,
  onClose,
}: {
  data: ListData;
  article: Article;
  currentAisleId: ID | undefined;
  hereAisleId?: ID;
  sessionId?: ID;
  /** Appelé une fois l'article rangé (pour le cocher dans ce rayon, par exemple). */
  onMoved?: (aisleId: ID) => void;
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
  const here =
    hereAisleId !== currentAisleId
      ? sorted.find((aisle) => aisle.id === hereAisleId)
      : undefined;
  const rest = sorted.filter((aisle) => aisle.id !== here?.id);
  const withCategory = rest.filter(hasCategory);
  const others = rest.filter((aisle) => !hasCategory(aisle));

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
    onMoved?.(aisle.id);
    onClose();
  };

  const pick = (aisle: Aisle) => {
    if (aisle.id === currentAisleId) {
      onMoved?.(aisle.id);
      onClose();
      return;
    }
    // Catégorie système (« Autres », « Achats ponctuels ») : l'article seul.
    if (category?.isSystem) move(aisle, "article");
    else setTarget(aisle);
  };

  const row = (aisle: Aisle) => {
    const color = paletteColor(aisle.color);
    const isCurrent = aisle.id === currentAisleId;
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
          {isCurrent && (
            <span className="shrink-0 text-sm text-muted-foreground">
              {t.current}
            </span>
          )}
        </button>
      </li>
    );
  };

  const option = (scope: MoveScope, label: string, hint: string) =>
    target && (
      <button
        type="button"
        onClick={() => {
          move(target, scope);
        }}
        className="flex min-h-16 w-full flex-col justify-center rounded-2xl border border-primary/50 px-4 py-3 text-left active:bg-primary/15"
      >
        <span className="font-bold text-primary">{label}</span>
        <span className="text-sm text-muted-foreground">{hint}</span>
      </button>
    );
  const section = (title: string, aisles: Aisle[]) =>
    aisles.length > 0 && (
      <>
        <p className="px-2 pb-1 text-sm font-semibold text-muted-foreground">
          {title}
        </p>
        <ul className="mb-3">{aisles.map(row)}</ul>
      </>
    );

  return (
    <Sheet
      open
      autoFocus={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onBack={
        target
          ? () => {
              setTarget(undefined);
            }
          : undefined
      }
      title={target ? t.scopeTitle(target.name) : t.title(article.name)}
      description={target ? t.scopeText(target.name) : t.text}
    >
      {target ? (
        <div className="flex flex-col gap-3">
          {option(
            "article",
            t.onlyArticle(article.name),
            t.onlyArticleHint(category?.name ?? ""),
          )}
          {option(
            "category",
            t.wholeCategory(category?.name ?? ""),
            t.wholeCategoryHint(target.name),
          )}
        </div>
      ) : (
        <div className="-mx-2">
          {here && section(t.hereSection, [here])}
          {section(t.withCategory, withCategory)}
          {section(withCategory.length || here ? t.others : t.all, others)}
        </div>
      )}
    </Sheet>
  );
}
