import { useMemo, useState } from "react";
import { searchKey } from "@/domain/slug";
import { fr } from "@/i18n/fr";
import { SearchField } from "@/ui/SearchField";
import { useIconPack } from "@/icons/pack";
import { type PaletteColor } from "@/ui/palette";
import { ProductIcon } from "@/ui/ProductIcon";
import { Sheet } from "@/ui/Sheet";
import { cn } from "@/ui/utils";

const t = fr.manage.icon;

/**
 * Choix de l'icône d'un article (docs/03 G5) : la grille des icônes dessinées, avec une
 * recherche par mots-clés français, et « Aucune » (les initiales de l'article).
 */
export function IconPickerSheet({
  label,
  color,
  value,
  onPick,
  onClose,
}: {
  label: string;
  color: PaletteColor;
  value: string | undefined;
  onPick: (icon: string | undefined) => void;
  onClose: () => void;
}) {
  const pack = useIconPack();
  const [query, setQuery] = useState("");
  const names = useMemo(() => {
    if (!pack) return [];
    const key = searchKey(query);
    return Object.entries(pack)
      .filter(
        ([, icon]) =>
          !key ||
          searchKey(icon.l).includes(key) ||
          icon.k.some((word) => searchKey(word).startsWith(key)),
      )
      .sort(([, a], [, b]) => a.l.localeCompare(b.l, "fr"))
      .map(([name]) => name);
  }, [pack, query]);

  const choose = (icon: string | undefined) => {
    onPick(icon);
    onClose();
  };

  return (
    <Sheet
      open
      autoFocus={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t.title}
    >
      <SearchField
        className="mb-3"
        label={t.search}
        value={query}
        onValueChange={setQuery}
      />
      <div
        role="radiogroup"
        aria-label={t.title}
        className="grid grid-cols-5 gap-2"
      >
        <button
          type="button"
          role="radio"
          aria-checked={!value}
          aria-label={t.none}
          onClick={() => {
            choose(undefined);
          }}
          className={cn(
            "flex aspect-square items-center justify-center rounded-xl border",
            !value ? "border-primary bg-primary/10" : "border-border",
          )}
        >
          <ProductIcon label={label} color={color} size={40} />
        </button>
        {names.map((name) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={name === value}
            aria-label={pack?.[name]?.l ?? name}
            onClick={() => {
              choose(name);
            }}
            className={cn(
              "flex aspect-square items-center justify-center rounded-xl border",
              name === value
                ? "border-primary bg-primary/10"
                : "border-transparent active:bg-raised",
            )}
          >
            <ProductIcon icon={name} label={label} size={40} />
          </button>
        ))}
      </div>
      {pack && names.length === 0 && (
        <p className="pt-4 text-center text-muted-foreground">{t.noResult}</p>
      )}
    </Sheet>
  );
}
