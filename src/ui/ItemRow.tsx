import { Check } from "lucide-react";
import type { PaletteColor } from "@/ui/palette";
import { ProductIcon } from "@/ui/ProductIcon";
import { cn } from "@/ui/utils";

/**
 * Ligne d'article (docs/05 § 5.1), indentée sous l'en-tête de son rayon : icône ·
 * libellé · détails (types acceptés, note) · quantité en or à droite. Toute la ligne
 * est cliquable. Texte en 16 px, plus petit que l'en-tête du rayon (18 px).
 * `shopping` : mode courses (cible de 48 px, coche).
 */
export function ItemRow({
  label,
  icon,
  color,
  details,
  quantity,
  checked = false,
  shopping = false,
  onClick,
}: {
  label: string;
  icon?: string;
  color?: PaletteColor;
  details?: string;
  quantity?: string;
  checked?: boolean;
  shopping?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={shopping ? checked : undefined}
      className={cn(
        "flex w-full items-center gap-3 py-2 pr-4 pl-9 text-left transition-colors active:bg-raised",
        shopping ? "min-h-12" : "min-h-11",
      )}
    >
      <span className="relative">
        <ProductIcon
          icon={icon}
          label={label}
          color={color}
          size={28}
          className={cn(checked && "opacity-40 grayscale")}
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
            checked && "text-muted-foreground line-through",
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
      {quantity && (
        <span
          className={cn(
            "shrink-0 font-bold tabular-nums",
            checked ? "text-muted-foreground" : "text-secondary",
          )}
        >
          {quantity}
        </span>
      )}
    </button>
  );
}
