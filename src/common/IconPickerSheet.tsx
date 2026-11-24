import { useMemo, useState } from "react";
import { searchKey } from "@/domain/slug";
import { fr } from "@/i18n/fr";
import { SearchField } from "@/ui/SearchField";
import { useIconPack } from "@/icons/pack";
import { type PaletteColor } from "@/ui/palette";
import { ProductIcon } from "@/ui/ProductIcon";
import { Sheet } from "@/ui/Sheet";
import { cn } from "@/ui/utils";
import { EmptyHint, SectionTitle } from "@/ui/Page";

const t = fr.manage.icon;

/**
 * Choix de l'icône d'un article ou d'une recette (docs/03 G5) : la grille des icônes
 * dessinées, avec une recherche par mots-clés français, et « Aucune » (les initiales).
 * `featuredCategories` : catégories dont les icônes passent en tête, dans cet ordre et
 * sous leur propre titre (plats puis desserts pour une recette).
 */
export function IconPickerSheet({
  label,
  color,
  value,
  featuredCategories,
  onPick,
  onClose,
}: {
  label: string;
  color: PaletteColor;
  value: string | undefined;
  featuredCategories?: ReadonlySet<string>;
  onPick: (icon: string | undefined) => void;
  onClose: () => void;
}) {
  const pack = useIconPack();
  const [query, setQuery] = useState("");
  const [featured, others] = useMemo(() => {
    if (!pack) return [[], []];
    const key = searchKey(query);
    // Le pack est déjà rangé par libellé, avec ses clés de recherche.
    const names = Object.entries(pack).filter(
      ([, icon]) =>
        !key ||
        icon.s.includes(key) ||
        icon.k.some((word) => word.startsWith(key)),
    );
    // En tête, les catégories dans l'ordre donné (les plats avant les desserts).
    const order = [...(featuredCategories ?? [])];
    return [
      names
        .filter(([, icon]) => order.includes(icon.c))
        .sort(([, a], [, b]) => order.indexOf(a.c) - order.indexOf(b.c))
        .map(([name]) => name),
      names.filter(([, icon]) => !order.includes(icon.c)).map(([name]) => name),
    ];
  }, [pack, query, featuredCategories]);

  const choose = (icon: string | undefined) => {
    onPick(icon);
    onClose();
  };

  const iconButton = (name: string) => (
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
  );
  const grid = "grid grid-cols-5 gap-2";
  // Deux groupes seulement s'il y a des icônes à mettre en tête.
  const grouped = featured.length > 0;

  return (
    <Sheet
      autoFocus={false}
      tall
      onClose={() => {
        onClose();
      }}
      title={t.title}
    >
      <SearchField
        className="mb-3"
        label={t.search}
        value={query}
        onValueChange={setQuery}
      />
      <div role="radiogroup" aria-label={t.title}>
        <div className={grid}>
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
          {!grouped && others.map(iconButton)}
        </div>
        {grouped && (
          <>
            <div className="mt-4">
              <SectionTitle>{t.featured}</SectionTitle>
            </div>
            <div className={grid}>{featured.map(iconButton)}</div>
            {others.length > 0 && (
              <>
                <div className="mt-4">
                  <SectionTitle>{t.others}</SectionTitle>
                </div>
                <div className={grid}>{others.map(iconButton)}</div>
              </>
            )}
          </>
        )}
      </div>
      {pack && featured.length + others.length === 0 && (
        <EmptyHint>{t.noResult}</EmptyHint>
      )}
    </Sheet>
  );
}
