import { ChevronRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { NavButton } from "@/ui/NavButton";
import { type RowInset, rowClass } from "@/ui/rowClass";
import { cn } from "@/ui/utils";

/**
 * Ligne touchable, la même partout (articles, catégories, rayons, suggestions,
 * choix dans un panneau) : icône, titre et détail sur une ligne chacun, élément à
 * droite, chevron si elle mène à un autre écran. `to` : mène à un autre écran.
 */
export function RowButton({
  to,
  inset = "section",
  icon,
  title,
  detail,
  trailing,
  chevron = false,
  className,
  children,
  ...props
}: Omit<ComponentProps<"button">, "title"> & {
  to?: string;
  inset?: RowInset;
  icon?: ReactNode;
  title?: ReactNode;
  detail?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
}) {
  const content = (
    <>
      {icon}
      {title !== undefined ? <RowText title={title} detail={detail} /> : null}
      {children}
      {trailing}
      {chevron && (
        <ChevronRight className="size-5 shrink-0 text-primary" aria-hidden />
      )}
    </>
  );
  const classes = cn(rowClass(inset), className);
  return to ? (
    <NavButton to={to} {...props} className={classes}>
      {content}
    </NavButton>
  ) : (
    <button type="button" {...props} className={classes}>
      {content}
    </button>
  );
}

/**
 * Titre (en gras) et détail (plus petit, atténué) d'une ligne, coupés s'ils sont trop
 * longs ; `wrap` : le détail passe à la ligne (explication d'une case à cocher).
 */
export function RowText({
  title,
  detail,
  wrap = false,
}: {
  title: ReactNode;
  detail?: ReactNode;
  wrap?: boolean;
}) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate font-semibold">{title}</span>
      {detail ? (
        <span
          className={cn(
            "block text-sm text-muted-foreground",
            !wrap && "truncate",
          )}
        >
          {detail}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Ligne d'information, mêmes marges que RowButton mais sans action (ingrédient d'une
 * recette en lecture) : icône, titre et détail, élément à droite.
 */
export function InfoRow({
  icon,
  title,
  detail,
  trailing,
}: {
  icon?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className={cn(rowClass("section"), "active:bg-transparent")}>
      {icon}
      <RowText title={title} detail={detail} />
      {trailing}
    </div>
  );
}
