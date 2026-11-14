import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { NavButton } from "@/ui/NavButton";
import { cn } from "@/ui/utils";

/**
 * En-tête d'écran, avec retour optionnel. Il reste en haut quand le contenu défile,
 * avec sa marge haute : le titre ne passe jamais sous le flou qu'iOS 26 pose sous la
 * barre d'état. Une bordure le sépare du contenu quand celui-ci défile (Layout pose
 * `data-scrollable` sur la zone qui défile).
 */
export function PageHeader({
  title,
  backTo,
}: {
  title: string;
  backTo?: string;
}) {
  return (
    <header className="sticky top-0 z-20 mb-2 flex items-center gap-2 border-b border-transparent bg-bg px-4 pt-7 pb-2 group-data-[scrollable]/main:border-border">
      {backTo && (
        <NavButton
          to={backTo}
          back
          aria-label="Retour"
          // Cible de 44 px, mais occupe la hauteur d'une ligne de titre (32 px) :
          // le titre reste au même niveau, avec ou sans bouton de retour.
          className="-my-1.5 -ml-2 flex size-11 items-center justify-center rounded-xl text-primary hover:bg-raised"
        >
          <ChevronLeft className="size-6" />
        </NavButton>
      )}
      <PageTitle>{title}</PageTitle>
    </header>
  );
}

/** Attente du chargement des données (rarement visible : la base est locale). */
export function Loading({ children }: { children: ReactNode }) {
  return (
    <p className="px-5 pt-10 text-center text-muted-foreground">{children}</p>
  );
}

/** État vide illustré. */
export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-8 pt-16 text-center">
      <div className="mb-5 flex size-20 items-center justify-center rounded-3xl bg-raised text-secondary">
        {icon}
      </div>
      <h2 className="mb-2 text-xl font-bold">{title}</h2>
      {children && <p className="max-w-xs text-muted-foreground">{children}</p>}
    </div>
  );
}

/** Groupe de lignes de réglages. */
export function Section({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("px-4", title ? "pt-6" : "pt-4", className)}>
      {title && <SectionTitle>{title}</SectionTitle>}
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
 * Un trait or le signale (l'or marque les repères, docs/05 § 2), le texte reste sobre.
 */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 px-1 pb-2.5 text-base font-bold tracking-tight text-text">
      <span
        aria-hidden
        className="h-4 w-1 shrink-0 rounded-full bg-secondary"
      />
      {children}
    </h2>
  );
}

/** Ligne d'information ou d'action dans une section, grisée si indisponible. */
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
        <span className="shrink-0 text-secondary [&_svg]:size-5">{icon}</span>
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
        <span className="shrink-0 text-secondary [&_svg]:size-5">{icon}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        {hint && (
          <span className="block text-sm text-muted-foreground">{hint}</span>
        )}
      </span>
      <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
    </NavButton>
  );
}
