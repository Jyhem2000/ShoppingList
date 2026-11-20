import { Leaf } from "lucide-react";
import { fr } from "@/i18n/fr";
import { cn } from "@/ui/utils";

/**
 * Pastille « de saison » (docs/05 § 5) : une feuille verte, couleur propre à la saison
 * pour ne pas la confondre avec les repères or. Lue « De saison » par le lecteur d'écran,
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
        : { role: "img", "aria-label": fr.season.badge })}
      strokeWidth={2.5}
      className={cn("size-4 shrink-0 fill-season/25 text-season", className)}
    />
  );
}
