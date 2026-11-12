import { Check } from "lucide-react";
import { fr } from "@/i18n/fr";
import { groupIcons } from "@/icons/lucide";
import { GroupIcon } from "@/ui/GroupIcon";
import { palette, type PaletteColor, paletteColors } from "@/ui/palette";
import { cn } from "@/ui/utils";

const t = fr.manage.style;

/**
 * Icône Lucide et couleur d'un rayon ou d'une catégorie (docs/03 G5, docs/05 § 4) :
 * une grille d'icônes dans la couleur choisie, puis les couleurs de la palette.
 */
export function StylePicker({
  icon,
  color,
  onIconChange,
  onColorChange,
}: {
  icon: string | undefined;
  color: PaletteColor;
  onIconChange: (icon: string) => void;
  onColorChange: (color: PaletteColor) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1.5 text-sm font-semibold text-muted-foreground">
          {t.color}
        </p>
        <div
          role="radiogroup"
          aria-label={t.color}
          className="flex flex-wrap gap-2"
        >
          {paletteColors.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={c === color}
              aria-label={c}
              onClick={() => {
                onColorChange(c);
              }}
              className={cn(
                "flex size-10 items-center justify-center rounded-full",
                palette[c].solid,
                c === color &&
                  "ring-2 ring-primary ring-offset-2 ring-offset-surface",
              )}
            >
              {c === color && <Check className="size-5 text-bg" aria-hidden />}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-semibold text-muted-foreground">
          {t.icon}
        </p>
        <div
          role="radiogroup"
          aria-label={t.icon}
          className="grid grid-cols-6 gap-2"
        >
          {Object.keys(groupIcons).map((name) => (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={name === icon}
              aria-label={name}
              onClick={() => {
                onIconChange(name);
              }}
              className={cn(
                "flex aspect-square items-center justify-center rounded-xl border",
                name === icon
                  ? cn("border-primary", palette[color].soft)
                  : "border-transparent active:bg-raised",
              )}
            >
              <GroupIcon
                name={name}
                className={cn("size-6", palette[color].text)}
                strokeWidth={1.75}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
