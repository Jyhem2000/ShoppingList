import { Check, ChevronDown, MapPin } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
} from "motion/react";
import { type ReactNode, useEffect, useRef } from "react";
import { GroupIcon } from "@/ui/GroupIcon";
import { palette, paletteColor, type PaletteColor } from "@/ui/palette";
import { cn } from "@/ui/utils";

/**
 * Bloc d'un rayon (docs/05 § 5.2) : la couleur du rayon forme la bordure gauche de
 * tout le bloc et colore son icône. L'en-tête (icône · libellé · compteur, repliable) est
 * plus grand que les articles, indentés en dessous. Sobre en sombre (l'écran a déjà les
 * couleurs des icônes d'articles) : en-tête sur le fond 2, nom dans la couleur du rayon ;
 * en clair : en-tête teinté de sa couleur, nom de la couleur du texte. Nom sur une ligne,
 * deux avec `wrap` (titre d'un rayon tiré de ses catégories en mode courses). `done` : rayon terminé en mode courses ; `current` : rayon en cours, avec
 * l'étiquette or « Tu es ici » (`currentLabel`) et un rebond quand il le devient. Pas de
 * fond sous les articles ; en clair, un trait fin de sa couleur fait le tour du bloc, en
 * sombre seule la bordure gauche reste (moins de couleurs à l'écran).
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
  wrap = false,
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
  /** Nom sur deux lignes au plus (sinon une, tronquée). */
  wrap?: boolean;
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
      className="inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-xs font-extrabold tracking-wide text-on-gold uppercase"
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
        // Pas de fond sous les articles ; cadre complet en clair seulement.
        "[--row-bg:var(--bg)] light:border-y light:border-r",
      )}
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className={cn(
          "flex min-h-13 w-full items-center gap-2.5 px-3 py-2 text-left transition-colors active:brightness-125",
          "bg-surface",
          palette[color].tintLight,
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
              "text-lg leading-snug font-extrabold",
              wrap ? "line-clamp-2" : "block truncate",
              done ? "text-success" : labelColor(color),
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
          <CountBadge count={count} color={color} />
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
 * intertitre (icône · nom · compteur · chevron) de la taille des articles, moins appuyé
 * que l'en-tête du rayon ; nom sur une ligne, dans la couleur de la catégorie en sombre ;
 * toucher l'intertitre replie ou déplie ses articles.
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
        className="flex min-h-12 w-full items-center gap-2 px-4 pt-2 pb-1 text-left text-lg font-bold transition-colors active:bg-raised"
      >
        <GroupIcon name={icon} palette={color} className="size-5 shrink-0" />
        <span className={cn("min-w-0 flex-1 truncate", labelColor(color))}>
          {label}
        </span>
        <CountBadge count={count} color={color} />
        <FoldChevron expanded={expanded} className="size-4" />
      </button>
      <Fold expanded={expanded}>{children}</Fold>
    </div>
  );
}

/** Nom d'un rayon ou d'une catégorie : de sa couleur en sombre, du texte en clair. */
function labelColor(color: PaletteColor): string {
  return cn(palette[color].text, "light:text-foreground");
}

/**
 * Nombre d'articles encore à prendre, en pastille de la couleur du rayon ou de la
 * catégorie (teintée en sombre, pleine en clair).
 */
function CountBadge({ count, color }: { count: number; color: PaletteColor }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
        palette[color].badge,
      )}
    >
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
