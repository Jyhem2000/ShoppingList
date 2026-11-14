import type { LucideProps } from "lucide-react";
import { createElement } from "react";
import { groupIcon } from "@/icons/lucide";
import { palette, paletteColor } from "@/ui/palette";
import { cn } from "@/ui/utils";

/**
 * Icône Lucide d'une catégorie ou d'un rayon, d'après son nom (docs/05 § 4). `color` :
 * la couleur enregistrée de la catégorie ou du rayon, appliquée à l'icône.
 */
export function GroupIcon({
  name,
  color,
  className,
  ...props
}: { name?: string; color?: string } & LucideProps) {
  return createElement(groupIcon(name), {
    "aria-hidden": true,
    ...props,
    className: cn(
      color !== undefined && palette[paletteColor(color)].text,
      className,
    ),
  });
}
