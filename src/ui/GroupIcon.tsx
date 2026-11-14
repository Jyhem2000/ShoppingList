import type { LucideProps } from "lucide-react";
import { createElement } from "react";
import { groupIcon } from "@/icons/lucide";
import { palette as colors, paletteColor } from "@/ui/palette";
import { cn } from "@/ui/utils";

/**
 * Icône Lucide d'une catégorie ou d'un rayon, d'après son nom (docs/05 § 4). `palette` :
 * la couleur enregistrée de la catégorie ou du rayon (nom de la palette), appliquée à
 * l'icône. Distincte de `color` de Lucide, qui attend une couleur CSS.
 */
export function GroupIcon({
  name,
  palette,
  className,
  ...props
}: { name?: string; palette?: string } & LucideProps) {
  return createElement(groupIcon(name), {
    "aria-hidden": true,
    ...props,
    className: cn(
      palette !== undefined && colors[paletteColor(palette)].text,
      className,
    ),
  });
}
