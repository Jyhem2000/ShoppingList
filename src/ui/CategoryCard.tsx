import { GroupIcon } from "@/ui/GroupIcon";
import { palette, type PaletteColor } from "@/ui/palette";

/**
 * Carte d'une catégorie dans le catalogue (docs/05 § 5.4) : icône Lucide dans la
 * couleur de la catégorie, sur un fond atténué de la même couleur. Fond 2, sans bordure,
 * dans les deux thèmes.
 */
export function CategoryCard({
  label,
  icon,
  color,
  onClick,
}: {
  label: string;
  icon?: string;
  color: PaletteColor;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-32 flex-col items-center gap-2 rounded-2xl bg-surface px-2 pt-4 pb-3 text-center transition-colors active:bg-raised"
    >
      <span
        className={`flex size-14 items-center justify-center rounded-2xl ${palette[color].soft} ${palette[color].text}`}
      >
        <GroupIcon name={icon} className="size-8" strokeWidth={1.75} />
      </span>
      <span className="line-clamp-2 text-sm leading-tight font-semibold">
        {label}
      </span>
    </button>
  );
}
