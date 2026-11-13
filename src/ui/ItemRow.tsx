import { Check } from "lucide-react";
import type { PaletteColor } from "@/ui/palette";
import { ProductIcon } from "@/ui/ProductIcon";
import { useLongPress } from "@/ui/useLongPress";
import { cn } from "@/ui/utils";

/**
 * Ligne d'article (docs/05 § 5.1), indentée sous l'en-tête de son rayon : icône ·
 * libellé · détails (types acceptés, note) · quantité en or à droite. Toute la ligne
 * est cliquable. Texte en 16 px, plus petit que l'en-tête du rayon (18 px).
 * `shopping` : mode courses (cible de 48 px, texte de 18 px, coche).
 * `unavailable` : pas pris (grisée). `onLongPress` : appui long (changer de rayon).
 * `onQuantityClick` : la quantité devient un bouton à part (la changer en magasin).
 */
export function ItemRow({
  label,
  icon,
  color,
  details,
  quantity,
  checked = false,
  unavailable = false,
  shopping = false,
  onClick,
  onLongPress,
  onQuantityClick,
  quantityLabel,
}: {
  label: string;
  icon?: string;
  color?: PaletteColor;
  details?: string;
  quantity?: string;
  checked?: boolean;
  unavailable?: boolean;
  shopping?: boolean;
  onClick?: () => void;
  onLongPress?: () => void;
  onQuantityClick?: () => void;
  /** Nom accessible du bouton de quantité (« Changer la quantité de Lait »). */
  quantityLabel?: string;
}) {
  const { handlers, wrapClick } = useLongPress(onLongPress);
  const muted = checked || unavailable;

  const quantityClass = cn(
    "shrink-0 font-bold tabular-nums",
    shopping && "text-lg",
    muted ? "text-muted-foreground" : "text-secondary",
  );
  const separate = quantity !== undefined && onQuantityClick !== undefined;

  const row = (
    <button
      type="button"
      onClick={wrapClick(onClick)}
      {...handlers}
      aria-pressed={shopping ? checked : undefined}
      className={cn(
        "flex w-full min-w-0 items-center gap-3 py-2 pl-9 text-left transition-colors select-none [-webkit-touch-callout:none] active:bg-raised",
        separate ? "pr-1" : "pr-4",
        shopping ? "min-h-12" : "min-h-11",
      )}
    >
      <span className="relative">
        <ProductIcon
          icon={icon}
          label={label}
          color={color}
          size={shopping ? 32 : 28}
          className={cn(muted && "opacity-40 grayscale")}
        />
        {checked && (
          <span className="absolute -right-1.5 -bottom-1 flex size-4 items-center justify-center rounded-full bg-success text-bg">
            <Check className="size-3" strokeWidth={3.5} aria-hidden />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate font-semibold",
            shopping && "text-lg",
            muted && "text-muted-foreground",
            checked && "line-through",
          )}
        >
          {label}
        </span>
        {details && (
          <span className="block truncate text-sm text-muted-foreground">
            {details}
          </span>
        )}
      </span>
      {quantity && !separate && (
        <span className={quantityClass}>{quantity}</span>
      )}
    </button>
  );
  if (!separate) return row;
  return (
    <div className="flex items-stretch">
      {row}
      <button
        type="button"
        aria-label={quantityLabel}
        onClick={onQuantityClick}
        className={cn(
          "flex min-w-14 shrink-0 items-center justify-end pr-4 pl-2 underline decoration-dotted underline-offset-4 active:bg-raised",
          quantityClass,
        )}
      >
        {quantity}
      </button>
    </div>
  );
}
