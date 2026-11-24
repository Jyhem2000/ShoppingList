import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { fr } from "@/i18n/fr";
import { buttonVariants } from "@/ui/buttonVariants";
import { NavButton } from "@/ui/NavButton";
import { useGoBack } from "@/ui/navigation";
import { cn } from "@/ui/utils";

/**
 * En-tête d'écran, avec retour optionnel. Il reste en haut quand le contenu défile,
 * avec sa marge haute : le titre ne passe jamais sous le flou qu'iOS 26 pose sous la
 * barre d'état. Une bordure le sépare toujours du contenu.
 * `title` : un texte (titre d'écran) ou un élément qui le contient (nom de la liste à
 * toucher). `leading` : un bouton à gauche du titre (quitter les courses), `action`
 * un bouton à droite, `below` une ligne en dessous (barre de progression).
 * `backTo` : la flèche revient à l'écran précédent ; cet écran-ci seulement si
 * l'on n'en a pas (docs/04 § 1).
 */
export function PageHeader({
  title,
  backTo,
  leading,
  action,
  below,
}: {
  title: ReactNode;
  backTo?: string;
  leading?: ReactNode;
  /** À droite du titre (« Modifier » d'une recette). */
  action?: ReactNode;
  below?: ReactNode;
}) {
  const goBack = useGoBack(backTo ?? "/");
  return (
    <header className="sticky top-0 z-20 mb-2 border-b border-border bg-bg px-4 pt-7 pb-2">
      <div className="flex items-center gap-2">
        {backTo && (
          <NavButton
            to={backTo}
            back
            aria-label={fr.sheet.back}
            onClick={(event) => {
              event.preventDefault();
              goBack();
            }}
            // Cible de 44 px, mais occupe la hauteur d'une ligne de titre (32 px) :
            // le titre reste au même niveau, avec ou sans bouton de retour.
            className={buttonVariants({
              variant: "icon",
              size: "icon",
              className: "-my-1.5 -ml-2",
            })}
          >
            <ChevronLeft className="size-6" />
          </NavButton>
        )}
        {leading && <div className="-my-1.5 -ml-2 shrink-0">{leading}</div>}
        {typeof title === "string" ? (
          <PageTitle className="min-w-0 flex-1">{title}</PageTitle>
        ) : (
          <div className="min-w-0 flex-1">{title}</div>
        )}
        {action && <div className="-my-1.5 shrink-0">{action}</div>}
      </div>
      {below}
    </header>
  );
}

/** Attente du chargement des données (rarement visible : la base est locale). */
export function Loading({ children }: { children: ReactNode }) {
  return (
    <p className="px-5 pt-10 text-center text-muted-foreground">{children}</p>
  );
}

/**
 * Écran vide illustré : icône en or, titre, une phrase qui dit quoi
 * faire, et au besoin le bouton qui le fait. Apparaît en fondu.
 */
export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col items-center px-8 pt-16 text-center"
    >
      <div
        aria-hidden
        className="mb-5 flex size-20 items-center justify-center rounded-3xl bg-raised text-secondary [&_svg]:size-10"
      >
        {icon}
      </div>
      <h2 className="mb-2 text-xl font-bold">{title}</h2>
      {children && <p className="max-w-xs text-muted-foreground">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

/**
 * Rien à montrer dans une partie d'écran ou un panneau (recherche sans résultat,
 * section vide) : une phrase discrète, centrée. `inset` : dans une section (marges
 * latérales) plutôt que dans un panneau (qui a les siennes).
 */
/**
 * Phrase d'introduction discrète, en tête d'un écran ou d'une section. `className` :
 * son espacement vertical.
 */
export function Intro({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("px-4 text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export function EmptyHint({
  children,
  inset = false,
}: {
  children: ReactNode;
  inset?: boolean;
}) {
  return (
    <p
      className={cn(
        "py-4 text-center text-sm text-muted-foreground",
        inset && "px-4",
      )}
    >
      {children}
    </p>
  );
}

/** Groupe de lignes de réglages. */
export function Section({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  /** Action sur toute la section, à droite du titre (« Tout décocher »). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("px-4", title ? "pt-6" : "pt-4", className)}>
      {title && <SectionTitle action={action}>{title}</SectionTitle>}
      <div className="divide-y divide-border overflow-hidden rounded-2xl bg-surface">
        {children}
      </div>
    </section>
  );
}

/**
 * Titre d'écran (Liste, Catalogue, Réglages, magasin en mode courses…) : le même partout,
 * en violet (docs/05 § 2).
 */
export function PageTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "truncate text-2xl font-extrabold tracking-tight text-primary",
        className,
      )}
    >
      {children}
    </h1>
  );
}

/**
 * Sous-titre d'une partie d'écran (Mes données, Application, Favoris…) : le même partout.
 * Un trait or le signale, dans les deux thèmes (aplat `--secondary-fill` : l'or marque les repères, docs/05 § 2) ; le texte reste sobre.
 */
export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  const title = (
    <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-text">
      <span
        aria-hidden
        className="h-6 w-1 shrink-0 rounded-full bg-secondary-fill"
      />
      {children}
    </h2>
  );
  return (
    <div className="flex items-center justify-between gap-2 px-1 pb-2.5">
      {title}
      {action}
    </div>
  );
}

/**
 * Ligne d'information ou d'action dans une section, grisée si indisponible. Son icône
 * est violette, comme celle d'une ligne de menu (LinkRow) : la ligne porte un réglage.
 */
export function Row({
  label,
  hint,
  icon,
  disabled,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      aria-disabled={disabled ? true : undefined}
      className={cn(
        "flex min-h-14 items-center gap-3 px-4 py-3",
        disabled && "opacity-45",
      )}
    >
      {icon && (
        <span className="shrink-0 text-primary [&_svg]:size-5">{icon}</span>
      )}
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{label}</div>
        {hint && <div className="text-sm text-muted-foreground">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

/** Ligne qui mène à un autre écran (un bouton, voir NavButton). */
export function LinkRow({
  to,
  icon,
  label,
  hint,
}: {
  to: string;
  icon?: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <NavButton
      to={to}
      className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left active:bg-raised"
    >
      {icon && (
        <span className="shrink-0 text-primary [&_svg]:size-5">{icon}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        {hint && (
          <span className="block text-sm text-muted-foreground">{hint}</span>
        )}
      </span>
      <ChevronRight className="size-5 text-secondary" aria-hidden />
    </NavButton>
  );
}
