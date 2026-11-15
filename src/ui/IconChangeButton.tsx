import { fr } from "@/i18n/fr";
import type { PaletteColor } from "@/ui/palette";
import { ProductIcon } from "@/ui/ProductIcon";

/**
 * Grande icône en tête d'une fiche (article, recette), touchable pour la changer,
 * avec « Changer l'icône » dessous.
 */
export function IconChangeButton({
  icon,
  label,
  color,
  onClick,
}: {
  icon: string | undefined;
  label: string;
  color: PaletteColor;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        aria-label={fr.manage.icon.change}
        className="rounded-3xl border border-border p-3 active:bg-raised"
      >
        <ProductIcon icon={icon} label={label} color={color} size={72} />
      </button>
      <span className="text-sm font-semibold text-primary">
        {fr.manage.icon.change}
      </span>
    </div>
  );
}
