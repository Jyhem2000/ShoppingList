import type { PaletteColor } from "@/ui/palette";
import { ProductIcon } from "@/ui/ProductIcon";

/**
 * Carte du catalogue (docs/05 § 5.4) : grande icône, libellé sur 2 lignes au plus,
 * pastille or de quantité si l'article est déjà dans la liste.
 */
export function CatalogCard({
  label,
  icon,
  color,
  quantity,
  onClick,
}: {
  label: string;
  icon?: string;
  color?: PaletteColor;
  quantity?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex min-h-32 flex-col items-center gap-2 rounded-2xl bg-surface px-2 pt-4 pb-3 text-center transition-colors active:bg-raised"
    >
      {quantity && (
        <span className="absolute top-1.5 right-1.5 z-10 rounded-full border-2 border-surface bg-secondary px-2 py-0.5 text-xs font-extrabold text-on-secondary tabular-nums">
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
