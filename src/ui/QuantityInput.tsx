import { useState } from "react";
import { formatNumber, parseNumber } from "@/domain/quantity";
import { fr } from "@/i18n/fr";
import { TextInput } from "@/ui/form";
import { Stepper } from "@/ui/Stepper";

function parseQuantity(text: string): number | undefined {
  const value = parseNumber(text);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * Quantité modifiable (fiche d'une ligne, ingrédient, rendement d'une recette) : − / +
 * (calculés par l'appelant, qui peut changer d'unité : 950 g → 1 kg), ou saisie au
 * clavier. Chaque valeur valide est transmise tout de suite ; le champ suit aussi les
 * changements venus d'ailleurs. `onLess` absent : − désactivé.
 */
export function QuantityInput({
  value,
  onChange,
  onLess,
  onMore,
}: {
  value: number;
  onChange: (quantity: number) => void;
  onLess?: () => void;
  onMore: () => void;
}) {
  const [text, setText] = useState(formatNumber(value));
  const [shown, setShown] = useState(value);
  if (value !== shown) {
    setShown(value);
    setText(formatNumber(value));
  }
  return (
    <Stepper lessDisabled={!onLess} onLess={() => onLess?.()} onMore={onMore}>
      <TextInput
        inputMode="decimal"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          const parsed = parseQuantity(event.target.value);
          if (parsed !== undefined) {
            setShown(parsed);
            onChange(parsed);
          }
        }}
        onBlur={() => {
          setText(formatNumber(value));
        }}
        className="min-w-0 px-1 text-center font-bold tabular-nums"
        aria-label={fr.list.line.quantity}
      />
    </Stepper>
  );
}
