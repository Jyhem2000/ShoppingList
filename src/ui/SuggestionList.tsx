import type { ComponentProps } from "react";
import { cn } from "@/ui/utils";

/**
 * Liste de suggestions au-dessus ou sous un champ (barre d'ajout, recherche du
 * catalogue) : carte flottante bordée. Le toucher ne retire pas le focus du champ, pour
 * que le clavier reste ouvert. Ses lignes : `RowButton inset="popover"`.
 */
export function SuggestionList({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      {...props}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-surface shadow-lg shadow-black/40",
        className,
      )}
    />
  );
}
