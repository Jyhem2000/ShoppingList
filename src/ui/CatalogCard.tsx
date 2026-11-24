import { CountBadge } from "@/ui/CountBadge";
import { ProductIcon } from "@/ui/ProductIcon";
import { SeasonBadge } from "@/ui/SeasonBadge";
import { useLongPress } from "@/ui/useLongPress";

/**
 * Carte du catalogue (docs/05 § 5.4) : grande icône, libellé sur 2 lignes au plus,
 * pastille or de quantité si l'article est déjà dans la liste, feuille verte en haut à
 * gauche s'il est de saison (docs/03 D3). Sans bordure ni fond,
 * dans les deux thèmes.
 */
export function CatalogCard({
  label,
  icon,
  color,
  quantity,
  inSeason = false,
  onClick,
  onLongPress,
}: {
  label: string;
  icon?: string;
  color?: string;
  quantity?: string;
  inSeason?: boolean;
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
      className="relative flex min-h-32 flex-col items-center gap-2 rounded-2xl px-2 pt-4 pb-3 text-center transition-colors select-none [--row-bg:var(--bg)] [-webkit-touch-callout:none] active:bg-surface"
    >
      {quantity && (
        <CountBadge className="absolute top-1.5 right-1.5 z-10 border-2 border-bg">
          {quantity}
        </CountBadge>
      )}
      {inSeason && <SeasonBadge className="absolute top-2.5 left-2.5" />}
      <ProductIcon icon={icon} label={label} color={color} size={56} />
      <span className="line-clamp-2 text-sm leading-tight font-semibold">
        {label}
      </span>
    </button>
  );
}
