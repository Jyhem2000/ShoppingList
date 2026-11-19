import { Check, ChevronDown, MapPin } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
} from "motion/react";
import { type ReactNode, useEffect, useRef } from "react";
import { GroupIcon } from "@/ui/GroupIcon";
import { palette, paletteColor } from "@/ui/palette";
import { cn } from "@/ui/utils";

/**
 * Bloc d'un rayon (docs/05 § 5.2) : la couleur du rayon forme la bordure gauche de
 * tout le bloc ; icône Lucide du rayon dans sa couleur ; l'en-tête teinté (icône · libellé · compteur, repliable) est plus
 * grand que les articles, indentés en dessous. `done` : rayon terminé en mode courses ;
 * `current` : rayon en cours, avec l'étiquette or « Tu es ici » (`currentLabel`) et un
 * rebond quand il le devient. Dans la liste comme en mode courses, et dans les deux
 * thèmes : pas de fond sous les articles, une bordure fine de sa couleur.
 */
export function AisleSection({
  id,
  label,
  icon,
  color: rawColor,
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
  /** Pour y faire défiler l'écran. */
  id?: string;
  label: string;
  icon?: string;
  /** Couleur de la palette, normalisée ici (inconnue → gris). */
  color?: string;
  count: number;
  expanded: boolean;
  done?: boolean;
  current?: boolean;
  /** Étiquette du rayon en cours (« Tu es ici »), aussi lue par les lecteurs d'écran. */
  currentLabel?: string;
  /** Au-dessus du nom : « Rayon 3 », pour ne pas confondre avec une catégorie. */
  kicker?: string;
  /** Repère sous le nom : « au fond du magasin ». */
  description?: string;
  onToggle: () => void;
  children: ReactNode;
}) {
  const color = paletteColor(rawColor);
  // Rebond quand le rayon devient celui en cours (pas à l'ouverture de l'écran).
  const [scope, animate] = useAnimate<HTMLElement>();
  const reduceMotion = useReducedMotion();
  const wasCurrent = useRef(current);
  useEffect(() => {
    if (current && !wasCurrent.current && !reduceMotion)
      void animate(
        scope.current,
        { scale: [1, 1.03, 1] },
        { duration: 0.45, ease: "easeOut" },
      );
    wasCurrent.current = current;
  }, [current, reduceMotion, animate, scope]);

  const badge = current && currentLabel !== undefined && (
    <span
      aria-hidden
      className="inline-flex items-center gap-1 rounded-full bg-secondary-fill px-2 py-0.5 text-xs font-extrabold tracking-wide text-on-secondary uppercase"
    >
      <MapPin className="size-3.5" strokeWidth={2.5} />
      {currentLabel}
    </span>
  );

  return (
    <section
      ref={scope}
      id={id}
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
          palette={color}
          className="size-6 shrink-0"
          strokeWidth={2}
        />
        <span className="min-w-0 flex-1">
          {(kicker !== undefined || badge !== false) && (
            <span className="flex items-center gap-2">
              {kicker && (
                <span
                  aria-hidden
                  className="text-sm leading-tight font-bold tracking-widest text-muted-foreground uppercase"
                >
                  {kicker}
                </span>
              )}
              {badge}
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
          <CountBadge count={count} />
        )}
        <FoldChevron expanded={expanded} className="size-5" />
      </button>
      <Fold expanded={expanded}>
        <div className="divide-y divide-border/50">{children}</div>
      </Fold>
    </section>
  );
}

/**
 * Sous-groupe repliable d'un bloc (une catégorie dans « À placer », docs/03 C4) :
 * intertitre (icône · nom dans sa couleur · compteur · chevron), plus discret que
 * l'en-tête du rayon ; toucher l'intertitre replie ou déplie ses articles.
 */
export function AisleSubgroup({
  label,
  icon,
  color: rawColor,
  count,
  expanded,
  onToggle,
  children,
}: {
  label: string;
  icon?: string;
  /** Couleur de la palette, normalisée ici (inconnue → gris). */
  color?: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const color = paletteColor(rawColor);
  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="flex min-h-12 w-full items-center gap-2 px-4 pt-2 pb-1 text-left text-sm font-bold transition-colors active:bg-raised"
      >
        <GroupIcon name={icon} palette={color} className="size-4 shrink-0" />
        <span className={cn("min-w-0 flex-1 truncate", palette[color].text)}>
          {label}
        </span>
        <CountBadge count={count} />
        <FoldChevron expanded={expanded} className="size-4" />
      </button>
      <Fold expanded={expanded}>{children}</Fold>
    </div>
  );
}

/** Nombre d'articles encore à prendre, en pastille (en-tête de rayon ou de catégorie). */
function CountBadge({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-raised px-2 py-0.5 text-xs font-bold text-muted-foreground tabular-nums">
      {count}
    </span>
  );
}

/** Chevron d'un groupe repliable : vers le bas déplié, vers la droite replié. */
function FoldChevron({
  expanded,
  className,
}: {
  expanded: boolean;
  className: string;
}) {
  return (
    <ChevronDown
      aria-hidden
      className={cn(
        "shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
        className,
        !expanded && "-rotate-90",
      )}
    />
  );
}

/** Contenu d'un groupe repliable : dépliage animé (docs/05 § 6), sauf si le téléphone demande de réduire les animations. */
function Fold({
  expanded,
  children,
}: {
  expanded: boolean;
  children: ReactNode;
}) {
  return (
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
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
