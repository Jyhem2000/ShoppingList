import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { GroupIcon } from "@/ui/GroupIcon";
import { palette, type PaletteColor } from "@/ui/palette";
import { cn } from "@/ui/utils";

/**
 * Bloc d'un rayon (docs/05 § 5.2) : la couleur du rayon forme la bordure gauche de
 * tout le bloc ; icône Lucide du rayon dans sa couleur ; l'en-tête teinté (icône · libellé · compteur, repliable) est plus
 * grand que les articles, indentés en dessous. `done` : rayon terminé en mode courses ;
 * `current` : rayon en cours (mis en évidence).
 */
export function AisleSection({
  label,
  icon,
  color,
  count,
  expanded,
  done = false,
  current = false,
  currentLabel,
  onToggle,
  children,
}: {
  label: string;
  icon?: string;
  color: PaletteColor;
  count: number;
  expanded: boolean;
  done?: boolean;
  current?: boolean;
  /** Mention lue par les lecteurs d'écran sur le rayon en cours. */
  currentLabel?: string;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={
        current && currentLabel ? `${label} — ${currentLabel}` : label
      }
      aria-current={current || undefined}
      className={cn(
        "overflow-hidden rounded-2xl border-l-4 bg-surface transition-shadow",
        palette[color].border,
        current && "ring-2 ring-primary",
      )}
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className={cn(
          "flex min-h-13 w-full items-center gap-2.5 px-3 py-2 text-left transition-colors active:brightness-125",
          palette[color].tint,
        )}
      >
        <GroupIcon
          name={icon}
          className={cn("size-6 shrink-0", palette[color].text)}
          strokeWidth={2}
        />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-lg font-extrabold",
            done ? "text-success" : palette[color].text,
          )}
        >
          {label}
        </span>
        {done ? (
          <Check className="size-5 text-success" strokeWidth={3} aria-hidden />
        ) : (
          <span className="rounded-full bg-bg/60 px-2 py-0.5 text-xs font-bold text-muted-foreground tabular-nums">
            {count}
          </span>
        )}
        <ChevronDown
          aria-hidden
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            !expanded && "-rotate-90",
          )}
        />
      </button>
      {expanded && <div className="divide-y divide-border/50">{children}</div>}
    </section>
  );
}
