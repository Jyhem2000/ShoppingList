import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { GroupIcon } from "@/ui/GroupIcon";
import { palette, type PaletteColor } from "@/ui/palette";
import { cn } from "@/ui/utils";

/**
 * Bloc d'un rayon (docs/05 § 5.2) : la couleur du rayon forme la bordure gauche de
 * tout le bloc ; icône Lucide du rayon dans sa couleur ; l'en-tête teinté (icône · libellé · compteur, repliable) est plus
 * grand que les articles, indentés en dessous. `done` : rayon terminé en mode courses ;
 * `current` : rayon en cours (mis en évidence). Dans la liste comme en mode courses, et
 * dans les deux thèmes : pas de fond sous les articles, une bordure fine de sa couleur.
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
  kicker,
  description,
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
  /** Au-dessus du nom : « Rayon 3 », pour ne pas confondre avec une catégorie. */
  kicker?: string;
  /** Repère sous le nom : « au fond du magasin ». */
  description?: string;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={[
        kicker ? `${kicker} : ${label}` : label,
        current && currentLabel,
      ]
        .filter(Boolean)
        .join(" — ")}
      aria-current={current || undefined}
      className={cn(
        "overflow-hidden rounded-2xl border-l-4 transition-shadow",
        palette[color].border,
        current && "ring-2 ring-primary",
        // Liste comme courses, dans les deux thèmes : pas de fond sous les articles.
        "border border-l-4 [--row-bg:var(--bg)]",
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
        <span className="min-w-0 flex-1">
          {kicker && (
            <span
              aria-hidden
              className="block text-sm leading-tight font-bold tracking-widest text-muted-foreground uppercase"
            >
              {kicker}
            </span>
          )}
          <span
            className={cn(
              "line-clamp-2 text-lg leading-snug font-extrabold",
              done ? "text-success" : palette[color].text,
            )}
          >
            {label}
          </span>
          {description && (
            <span className="block truncate text-sm text-muted-foreground">
              {description}
            </span>
          )}
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
            "size-5 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
            !expanded && "-rotate-90",
          )}
        />
      </button>
      {/* Dépliage animé (docs/05 § 6), selon le réglage « Animations ». */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="lines"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.9, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-border/50">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
