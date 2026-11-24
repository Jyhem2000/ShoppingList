import { texts } from "@/i18n";
import { cn } from "@/ui/utils";

/**
 * Calendrier des 12 mois (fiche article, docs/03 D3) : un bouton par mois, en vert
 * quand il est choisi ; le mois en cours est souligné.
 */
export function MonthCalendar({
  months,
  current,
  onToggle,
}: {
  months: readonly number[];
  /** Mois en cours (1 à 12). */
  current: number;
  onToggle: (month: number) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {texts.season.months.map((label, index) => {
        const month = index + 1;
        const selected = months.includes(month);
        return (
          <button
            key={month}
            type="button"
            aria-pressed={selected}
            aria-label={texts.season.monthNames[index]}
            onClick={() => {
              onToggle(month);
            }}
            className={cn(
              "min-h-11 rounded-xl border text-sm font-semibold transition-colors",
              selected
                ? "border-season bg-season/15 text-season"
                : "border-border text-muted-foreground active:bg-raised",
              month === current && "underline decoration-2 underline-offset-4",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
