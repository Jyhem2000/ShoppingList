import { Plus, Search } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/ui/utils";

/**
 * Barre d'ajout (docs/05 § 5.3) : fond de l'app, bordure, coins très arrondis, flottante
 * au-dessus de la barre d'onglets. Texte en 16 px pour éviter le zoom de l'iPhone.
 * Contrôlée (`value`, `onValueChange`) ou autonome.
 *
 * Chaque fois qu'elle se vide (ajout, suggestion choisie), le champ est recréé : son
 * historique de frappe disparaît, et iOS ne propose plus « Annuler la saisie » quand on
 * secoue le téléphone en le reprenant en main. Le focus est gardé.
 *
 * `onPasteLines` : un texte collé de plusieurs lignes passe par cette fonction avant
 * d'entrer dans le champ, qui n'a qu'une ligne et perdrait les retours à la ligne.
 */
export function AddBar({
  placeholder,
  addLabel,
  onSubmit,
  value,
  onValueChange,
  onPasteLines,
  className,
}: {
  placeholder: string;
  addLabel: string;
  onSubmit?: (text: string) => void;
  value?: string;
  onValueChange?: (text: string) => void;
  onPasteLines?: (pasted: string) => string;
  className?: string;
}) {
  const [own, setOwn] = useState("");
  const text = value ?? own;
  const setText = onValueChange ?? setOwn;
  const [generation, setGeneration] = useState(0);
  const element = useRef<HTMLInputElement | null>(null);
  const previous = useRef(text);
  const refocus = useRef(false);
  /** Position du curseur après un collage transformé, remise une fois le texte affiché. */
  const caret = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (previous.current !== "" && text === "") {
      refocus.current = document.activeElement === element.current;
      setGeneration((n) => n + 1);
    }
    previous.current = text;
  }, [text]);

  useLayoutEffect(() => {
    if (caret.current === undefined) return;
    element.current?.setSelectionRange(caret.current, caret.current);
    caret.current = undefined;
  }, [text]);

  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    element.current?.focus();
  }, [generation]);

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
        "flex items-center gap-2 rounded-full border-2 border-field-border bg-bg py-1 pr-1 pl-4 focus-within:border-primary",
        className,
      )}
    >
      <Search className="size-5 shrink-0 text-secondary" aria-hidden />
      <input
        key={generation}
        ref={element}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
        onPaste={(event) => {
          const pasted = event.clipboardData.getData("text/plain");
          if (!onPasteLines || !/[\r\n]/.test(pasted)) return;
          event.preventDefault();
          const input = event.currentTarget;
          const start = input.selectionStart ?? text.length;
          const end = input.selectionEnd ?? text.length;
          const inserted = onPasteLines(pasted);
          caret.current = start + inserted.length;
          setText(text.slice(0, start) + inserted + text.slice(end));
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        enterKeyHint="done"
        autoComplete="off"
        autoCorrect="off"
        className="h-11 min-w-0 flex-1 bg-transparent text-base text-ellipsis outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        aria-label={addLabel}
        disabled={!text.trim()}
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-opacity disabled:opacity-40"
      >
        <Plus className="size-5" aria-hidden />
      </button>
    </form>
  );
}
