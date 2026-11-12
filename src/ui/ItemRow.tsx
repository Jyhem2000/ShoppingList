import { Check } from "lucide-react";
import { useRef } from "react";
import type { PaletteColor } from "@/ui/palette";
import { ProductIcon } from "@/ui/ProductIcon";
import { cn } from "@/ui/utils";

const LONG_PRESS_MS = 500;
/** Au-delà de ce déplacement du doigt, ce n'est plus un appui long (défilement, glissement). */
const LONG_PRESS_SLOP = 10;

/**
 * Ligne d'article (docs/05 § 5.1), indentée sous l'en-tête de son rayon : icône ·
 * libellé · détails (types acceptés, note) · quantité en or à droite. Toute la ligne
 * est cliquable. Texte en 16 px, plus petit que l'en-tête du rayon (18 px).
 * `shopping` : mode courses (cible de 48 px, texte de 18 px, coche).
 * `unavailable` : introuvable (grisée). `onLongPress` : appui long (changer de rayon).
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
}) {
  const press = useRef<{
    timer: ReturnType<typeof setTimeout>;
    x: number;
    y: number;
  } | null>(null);
  const longPressed = useRef(false);
  const cancel = () => {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  };
  const muted = checked || unavailable;

  return (
    <button
      type="button"
      onClick={() => {
        if (longPressed.current) {
          longPressed.current = false;
          return;
        }
        onClick?.();
      }}
      onPointerDown={
        onLongPress &&
        ((event) => {
          longPressed.current = false;
          const { clientX: x, clientY: y } = event;
          cancel();
          press.current = {
            x,
            y,
            timer: setTimeout(() => {
              press.current = null;
              longPressed.current = true;
              onLongPress();
            }, LONG_PRESS_MS),
          };
        })
      }
      onPointerMove={
        onLongPress &&
        ((event) => {
          const start = press.current;
          if (
            start &&
            Math.hypot(event.clientX - start.x, event.clientY - start.y) >
              LONG_PRESS_SLOP
          )
            cancel();
        })
      }
      onPointerUp={onLongPress && cancel}
      onPointerCancel={onLongPress && cancel}
      onPointerLeave={onLongPress && cancel}
      onContextMenu={
        onLongPress &&
        ((event) => {
          event.preventDefault();
        })
      }
      aria-pressed={shopping ? checked : undefined}
      className={cn(
        "flex w-full items-center gap-3 py-2 pr-4 pl-9 text-left transition-colors select-none [-webkit-touch-callout:none] active:bg-raised",
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
      {quantity && (
        <span
          className={cn(
            "shrink-0 font-bold tabular-nums",
            shopping && "text-lg",
            muted ? "text-muted-foreground" : "text-secondary",
          )}
        >
          {quantity}
        </span>
      )}
    </button>
  );
}
