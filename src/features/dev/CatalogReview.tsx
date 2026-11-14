import { ClipboardCopy, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { categoriesData } from "@/data";
import { catalogData } from "@/data/catalog";
import { fr } from "@/i18n/fr";
import { canCopyText, copyText } from "@/platform/clipboard";
import { Button } from "@/ui/button";
import { TextArea } from "@/ui/form";
import { paletteColor } from "@/ui/palette";
import { ProductIcon } from "@/ui/ProductIcon";
import { showToast } from "@/ui/toast";
import { cn } from "@/ui/utils";

const t = fr.devUi.review;

/** Version du catalogue dont les articles sont à relire. */
const SINCE = 5;
const STORAGE_KEY = "shoppinglist.iconReview";

/** Remarques en cours, gardées sur ce téléphone (rien d'essentiel : vide si absent). */
function loadRemarks(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}

/**
 * Relecture d'un lot du catalogue (phase 8, temporaire) : chaque nouvel article avec son
 * icône en grand et à la taille d'une ligne, sa catégorie, son unité et la nature de son
 * dessin. « Refaire » ouvre un champ pour dire ce qui ne va pas ; en bas, toutes les
 * remarques se copient dans le presse-papiers, à coller dans la conversation.
 */
export function CatalogReview() {
  const batch = catalogData.filter((a) => a.since === SINCE);
  const [remarks, setRemarks] = useState(loadRemarks);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remarks));
    } catch {
      // Stockage indisponible : les remarques restent le temps de la page.
    }
  }, [remarks]);

  const marked = batch.filter((a) => a.key in remarks);
  const toggle = (key: string) => {
    setRemarks((current) =>
      key in current
        ? Object.fromEntries(
            Object.entries(current).filter(([other]) => other !== key),
          )
        : { ...current, [key]: "" },
    );
  };

  const copy = () => {
    const lines = marked.map(
      (a) =>
        `- ${a.name.fr} (${a.key}) : ${remarks[a.key]?.trim() ? remarks[a.key]?.trim() : t.redo}`,
    );
    void copyText(
      Promise.resolve([t.copyTitle(t.batch), ...lines].join("\n")),
    ).then((copied) => {
      showToast(copied ? t.copied(marked.length) : t.copyFailed, {
        tone: copied ? "success" : "warning",
      });
    });
  };

  return (
    <div className="px-4">
      <p className="pb-3 text-sm text-muted-foreground">{t.intro}</p>
      <p className="pb-2 font-bold">
        {t.batch} · {batch.length}
      </p>
      <ul className="flex flex-col gap-2">
        {batch.map((article) => {
          const category = categoriesData.find(
            (c) => c.key === article.category,
          );
          const color = paletteColor(category?.color);
          const open = article.key in remarks;
          return (
            <li
              key={article.key}
              className={cn(
                "rounded-2xl border-2 bg-surface p-2",
                open ? "border-danger" : "border-transparent",
              )}
            >
              <div className="flex items-center gap-3">
                <ProductIcon
                  icon={article.icon}
                  label={article.name.fr}
                  color={color}
                  size={56}
                />
                <ProductIcon
                  icon={article.icon}
                  label={article.name.fr}
                  color={color}
                  size={28}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{article.name.fr}</span>
                  <span className="block text-sm text-muted-foreground">
                    {category?.name.fr} · {article.unit}
                    {article.types ? ` · ${article.types.fr.join(", ")}` : ""}
                  </span>
                  <span className="block text-sm text-secondary">
                    {t.notes[article.key]}
                  </span>
                  <Button
                    variant={open ? "destructive" : "outline"}
                    className="mt-1.5"
                    aria-pressed={open}
                    onClick={() => {
                      toggle(article.key);
                    }}
                  >
                    <RotateCcw />
                    {t.redo}
                  </Button>
                </span>
              </div>
              {open && (
                <TextArea
                  className="mt-2 h-20 font-sans"
                  autoFocus
                  aria-label={t.remark(article.name.fr)}
                  placeholder={t.remarkPlaceholder}
                  value={remarks[article.key]}
                  onChange={(event) => {
                    const value = event.target.value;
                    setRemarks((current) => ({
                      ...current,
                      [article.key]: value,
                    }));
                  }}
                />
              )}
            </li>
          );
        })}
      </ul>
      {canCopyText() && (
        <Button
          variant="link"
          className="mt-3 w-full"
          disabled={marked.length === 0}
          onClick={copy}
        >
          <ClipboardCopy />
          {t.copy(marked.length)}
        </Button>
      )}
    </div>
  );
}
