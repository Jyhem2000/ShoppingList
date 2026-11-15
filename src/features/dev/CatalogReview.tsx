import { ClipboardCopy, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { categoriesData } from "@/data";
import { catalogData } from "@/data/catalog";
import { fr } from "@/i18n/fr";
import { DISH_PREFIX } from "@/icons/pack";
import { canCopyText, copyText } from "@/platform/clipboard";
import { Button } from "@/ui/button";
import { Chip, TextArea } from "@/ui/form";
import { type PaletteColor, paletteColor } from "@/ui/palette";
import { ProductIcon } from "@/ui/ProductIcon";
import { showToast } from "@/ui/toast";
import { cn } from "@/ui/utils";

const t = fr.devUi.review;

/** Version du catalogue dont les articles sont à relire. */
const SINCE = 7;
/** Articles plus anciens redessinés sous leur vraie forme (leur ancien dessin sert ailleurs). */
const REDRAWN = new Set(["piment-d-espelette", "curcuma", "tomme"]);
const STORAGE_KEY = "shoppinglist.iconReview.7";

interface ReviewItem {
  key: string;
  icon: string;
  name: string;
  detail: string;
  color: PaletteColor;
}

/** Les articles du lot, puis les icônes de plats des recettes. */
function reviewItems(): ReviewItem[] {
  const articles = catalogData
    .filter((a) => a.since === SINCE || REDRAWN.has(a.key))
    .map((article) => {
      const category = categoriesData.find((c) => c.key === article.category);
      return {
        key: article.key,
        icon: article.icon ?? article.key,
        name: article.name.fr,
        detail: `${category?.name.fr ?? ""} · ${article.unit}${article.types ? ` · ${article.types.fr.join(", ")}` : ""}`,
        color: paletteColor(category?.color),
      };
    });
  const dishes = Object.entries(fr.recipes.dishes).map(([name, dish]) => ({
    key: `${DISH_PREFIX}${name}`,
    icon: `${DISH_PREFIX}${name}`,
    name: dish?.label ?? name,
    detail: t.dish,
    color: paletteColor(undefined),
  }));
  return [...articles, ...dishes];
}

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
 * Relecture d'un lot du catalogue (temporaire) : chaque nouvelle icône en grand et à la
 * taille d'une ligne, avec sa catégorie, son unité et la nature de son dessin. « Refaire »
 * ouvre un champ pour dire ce qui ne va pas ; « Refaire uniquement » n'affiche que les
 * icônes à revoir, pour valider leurs corrections (toucher « Refaire » à nouveau la
 * retire) ; en bas, toutes les remarques se copient dans le presse-papiers.
 */
export function CatalogReview() {
  const [batch] = useState(reviewItems);
  const [remarks, setRemarks] = useState(loadRemarks);
  // « Refaire uniquement » : seulement les icônes à revoir, pour valider leurs corrections.
  const [onlyRedo, setOnlyRedo] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remarks));
    } catch {
      // Stockage indisponible : les remarques restent le temps de la page.
    }
  }, [remarks]);

  const marked = batch.filter((item) => item.key in remarks);
  const shown = onlyRedo ? marked : batch;
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
      (item) =>
        `- ${item.name} (${item.key}) : ${remarks[item.key]?.trim() ? remarks[item.key]?.trim() : t.redo}`,
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
      <Chip
        className="mb-3"
        selected={onlyRedo}
        onClick={() => {
          setOnlyRedo((value) => !value);
        }}
      >
        {t.onlyRedo(marked.length)}
      </Chip>
      <ul className="flex flex-col gap-2">
        {shown.map((item) => {
          const open = item.key in remarks;
          return (
            <li
              key={item.key}
              className={cn(
                "rounded-2xl border-2 bg-surface p-2",
                open ? "border-danger" : "border-transparent",
              )}
            >
              <div className="flex items-center gap-3">
                <ProductIcon
                  icon={item.icon}
                  label={item.name}
                  color={item.color}
                  size={56}
                />
                <ProductIcon
                  icon={item.icon}
                  label={item.name}
                  color={item.color}
                  size={28}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{item.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {item.detail}
                  </span>
                  <span className="block text-sm text-secondary">
                    {t.notes[item.key]}
                  </span>
                  <Button
                    variant={open ? "destructive" : "outline"}
                    className="mt-1.5"
                    aria-pressed={open}
                    onClick={() => {
                      toggle(item.key);
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
                  aria-label={t.remark(item.name)}
                  placeholder={t.remarkPlaceholder}
                  value={remarks[item.key]}
                  onChange={(event) => {
                    const value = event.target.value;
                    setRemarks((current) => ({
                      ...current,
                      [item.key]: value,
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
