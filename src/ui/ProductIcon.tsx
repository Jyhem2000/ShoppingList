import { monogram } from "@/domain/monogram";
import { ICON_VIEWBOX, useIconPack } from "@/icons/pack";
import { palette, type PaletteColor } from "@/ui/palette";
import { cn } from "@/ui/utils";

/**
 * Icône d'un article, d'une catégorie ou d'un rayon (docs/05 § 4) : l'icône du pack
 * si elle existe, sinon le monogramme coloré. Taille en pixels (40 par défaut).
 */
export function ProductIcon({
  icon,
  label,
  color = "gris",
  size = 40,
  className,
}: {
  icon?: string;
  label: string;
  color?: PaletteColor;
  size?: number;
  className?: string;
}) {
  const pack = useIconPack();
  const style = { width: size, height: size };

  if (icon && !pack) {
    // Pack en cours de chargement : emplacement réservé, sans saut de mise en page.
    return (
      <span
        aria-hidden
        style={style}
        className={cn("shrink-0 rounded-xl bg-raised", className)}
      />
    );
  }

  const found = icon ? pack?.[icon] : undefined;
  if (found) {
    return (
      <svg
        aria-hidden
        data-icon={icon}
        viewBox={ICON_VIEWBOX}
        style={style}
        className={cn("shrink-0", className)}
        // Dessins du dépôt (src/icons/drawn), réunis au build par src/icons/packData.ts.
        dangerouslySetInnerHTML={{ __html: found.b }}
      />
    );
  }

  return (
    <span
      aria-hidden
      data-monogram
      style={{ ...style, fontSize: size * 0.4 }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl font-extrabold tracking-tight",
        palette[color].soft,
        palette[color].text,
        className,
      )}
    >
      {monogram(label)}
    </span>
  );
}
