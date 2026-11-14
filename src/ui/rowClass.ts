import { cn } from "@/ui/utils";

/**
 * Où se trouve la ligne : dans une section d'écran (bords à bord de la carte), dans un
 * panneau (coins arrondis), ou dans une liste de suggestions.
 */
export type RowInset = "section" | "sheet" | "popover";

const insets: Record<RowInset, string> = {
  section: "px-4",
  sheet: "rounded-xl px-2",
  popover: "px-3",
};

/** Classes d'une ligne touchable (aussi utilisées par MenuItem). */
export function rowClass(inset: RowInset): string {
  return cn(
    "flex min-h-12 w-full items-center gap-3 py-1.5 text-left active:bg-raised disabled:opacity-40",
    insets[inset],
  );
}
