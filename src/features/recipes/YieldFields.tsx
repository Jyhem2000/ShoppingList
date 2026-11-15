import type { Recipe } from "@/domain/model";
import { searchKey } from "@/domain/slug";
import { fr } from "@/i18n/fr";
import { Chip, Field, TextInput } from "@/ui/form";
import { QuantityInput } from "@/ui/QuantityInput";

const t = fr.recipes;

/**
 * Rendement d'une recette (docs/04 § 2.6) : un nombre (− / +) et une unité, choisie
 * parmi les propositions ou saisie librement (« 24 cookies »).
 */
export function YieldFields({
  value,
  onChange,
}: {
  value: Recipe["yield"];
  onChange: (value: Recipe["yield"]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <Field label={t.yield} className="w-44 shrink-0">
          <QuantityInput
            value={value.quantity}
            step={1}
            onChange={(quantity) => {
              onChange({ ...value, quantity });
            }}
          />
        </Field>
        <Field label={t.yieldUnit} className="min-w-0 flex-1">
          <TextInput
            value={value.unit}
            onChange={(event) => {
              onChange({ ...value, unit: event.target.value });
            }}
          />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        {t.yieldUnits.map((unit) => (
          <Chip
            key={unit}
            selected={searchKey(unit) === searchKey(value.unit)}
            onClick={() => {
              onChange({ ...value, unit });
            }}
          >
            {unit}
          </Chip>
        ))}
      </div>
    </div>
  );
}
