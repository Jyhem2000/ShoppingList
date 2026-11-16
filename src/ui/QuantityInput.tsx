import { useState } from "react";
import { formatNumber } from "@/domain/quantity";
import { fr } from "@/i18n/fr";
import { TextInput } from "@/ui/form";
import { Stepper } from "@/ui/Stepper";

function parseQuantity(text: string): number | undefined {
  const value = Number(text.replace(",", ".").trim());
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/** Arrondi des pas décimaux (0,5 + 0,5 + 0,5…). */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Quantité modifiable (fiche d'une ligne, ingrédient d'une recette) : − / + selon le
 * pas de l'unité, ou saisie au clavier. Chaque valeur valide est transmise tout de
 * suite ; le champ suit aussi les changements venus d'ailleurs (changement d'unité).
 */
export function QuantityInput({
  value,
  step,
  onChange,
}: {
  value: number;
  step: number;
  onChange: (quantity: number) => void;
}) {
  const [text, setText] = useState(formatNumber(value));
  const [shown, setShown] = useState(value);
  if (value !== shown) {
    setShown(value);
    setText(formatNumber(value));
  }
  const unitStep = step > 0 ? step : 1;
  const set = (quantity: number) => {
    setShown(quantity);
    setText(formatNumber(quantity));
    onChange(quantity);
  };
  return (
    <Stepper
      lessDisabled={value <= unitStep}
      onLess={() => {
        set(round(Math.max(unitStep, value - unitStep)));
      }}
      onMore={() => {
        set(round(value + unitStep));
      }}
    >
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
