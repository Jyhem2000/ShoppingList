import { Plus, Search } from "lucide-react";
import { type Ref, useState } from "react";
import { cn } from "@/ui/utils";

/**
 * Barre d'ajout (docs/05 § 5.3) : fond surélevé, coins très arrondis, flottante
 * au-dessus de la barre d'onglets. Texte en 16 px pour éviter le zoom de l'iPhone.
 * Contrôlée (`value`, `onValueChange`) ou autonome.
 */
export function AddBar({
  placeholder,
  addLabel,
  onSubmit,
  value,
  onValueChange,
  inputRef,
  className,
}: {
  placeholder: string;
  addLabel: string;
  onSubmit?: (text: string) => void;
  value?: string;
  onValueChange?: (text: string) => void;
  inputRef?: Ref<HTMLInputElement>;
  className?: string;
}) {
  const [own, setOwn] = useState("");
  const text = value ?? own;
  const setText = onValueChange ?? setOwn;

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        if (!text.trim()) return;
        onSubmit?.(text.trim());
        setText("");
      }}
      className={cn(
        "flex items-center gap-2 rounded-full border border-border bg-raised py-1.5 pr-1.5 pl-4 shadow-lg shadow-black/40",
        className,
      )}
    >
      <Search className="size-5 shrink-0 text-secondary" aria-hidden />
      <input
        ref={inputRef}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        enterKeyHint="done"
        autoComplete="off"
        autoCorrect="off"
        className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        aria-label={addLabel}
        disabled={!text.trim()}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-opacity disabled:opacity-40"
      >
        <Plus className="size-5" aria-hidden />
      </button>
    </form>
  );
}
