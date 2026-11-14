import { Search, X } from "lucide-react";
import { type ComponentProps, useRef } from "react";
import { fr } from "@/i18n/fr";
import { cn } from "@/ui/utils";

/**
 * Champ de recherche, le même partout (catalogue, articles, fusion, icônes) : pilule
 * bordée, sans fond propre, loupe à gauche et bouton pour effacer la recherche.
 */
export function SearchField({
  value,
  onValueChange,
  label,
  className,
  ref,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: string;
  onValueChange: (value: string) => void;
  /** Texte d'exemple, et nom du champ pour les lecteurs d'écran. */
  label: string;
}) {
  const own = useRef<HTMLInputElement>(null);
  return (
    <label
      className={cn(
        "flex h-12 items-center gap-2 rounded-full border-2 border-field-border bg-transparent pr-1 pl-4 focus-within:border-primary",
        className,
      )}
    >
      <Search className="size-5 shrink-0 text-secondary" aria-hidden />
      <input
        ref={(element) => {
          own.current = element;
          if (typeof ref === "function") ref(element);
          else if (ref) ref.current = element;
        }}
        type="search"
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        placeholder={label}
        aria-label={label}
        autoComplete="off"
        autoCorrect="off"
        enterKeyHint="done"
        className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {value && (
        <button
          type="button"
          aria-label={fr.search.clear}
          onClick={() => {
            onValueChange("");
            own.current?.focus();
          }}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground active:bg-surface"
        >
          <X className="size-5" aria-hidden />
        </button>
      )}
    </label>
  );
}
