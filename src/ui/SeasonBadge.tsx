import { Leaf } from "lucide-react";
import type { ReactNode } from "react";
import { texts } from "@/i18n";
import { cn } from "@/ui/utils";

/**
 * Pastille « de saison » (docs/05 § 5) : une feuille verte, couleur propre à la saison
 * pour ne pas la confondre avec l'or des aplats. Lue « De saison » par le lecteur d'écran,
 * sauf `decorative` : à côté d'un texte qui le dit déjà (filtre « De saison »).
 */
export function SeasonBadge({
  className,
  decorative = false,
}: {
  className?: string;
  decorative?: boolean;
}) {
  return (
    <Leaf
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": texts.season.badge })}
      strokeWidth={2.5}
      className={cn("size-4 shrink-0 fill-season/25 text-season", className)}
    />
  );
}

/**
 * Libellé suivi de la feuille « de saison » quand `inSeason` : le libellé (`children`)
 * se tronque, la feuille reste visible.
 */
export function SeasonLabel({
  children,
  inSeason,
  className,
}: {
  children: ReactNode;
  inSeason: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5", className)}>
      {children}
      {inSeason && <SeasonBadge />}
    </span>
  );
}
