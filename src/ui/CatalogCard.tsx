import type { PaletteColor } from "@/ui/palette";
import { ProductIcon } from "@/ui/ProductIcon";
import { useLongPress } from "@/ui/useLongPress";

/**
 * Carte du catalogue (docs/05 § 5.4) : grande icône, libellé sur 2 lignes au plus,
 * pastille or de quantité si l'article est déjà dans la liste. Sans bordure ; fond 2 en
 * sombre, pas de fond en clair.
 */
export function CatalogCard({
  label,
  icon,
  color,
  quantity,
  onClick,
  onLongPress,
}: {
  label: string;
  icon?: string;
  color?: PaletteColor;
  quantity?: string;
  onClick?: () => void;
  /** Appui long : la fiche de l'article (docs/04 § 2.5). */
  onLongPress?: () => void;
}) {
  const { handlers, wrapClick } = useLongPress(onLongPress);
  return (
    <button
      type="button"
      onClick={wrapClick(onClick)}
      {...handlers}
      className="relative flex min-h-32 flex-col items-center gap-2 rounded-2xl bg-surface px-2 pt-4 pb-3 text-center transition-colors select-none [-webkit-touch-callout:none] active:bg-raised light:bg-transparent light:[--row-bg:var(--bg)] light:active:bg-surface"
    >
      {quantity && (
        <span className="absolute top-1.5 right-1.5 z-10 rounded-full border-2 border-surface bg-secondary-fill px-2 py-0.5 text-xs font-extrabold text-on-secondary tabular-nums light:border-bg">
          {quantity}
        </span>
      )}
      <ProductIcon icon={icon} label={label} color={color} size={56} />
      <span className="line-clamp-2 text-sm leading-tight font-semibold">
        {label}
      </span>
    </button>
  );
}
