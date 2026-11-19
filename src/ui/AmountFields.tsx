import type { Unit } from "@/domain/model";
import { changeUnit, type StepOptions, stepAmount } from "@/domain/quantity";
import { fr } from "@/i18n/fr";
import { Chip, Field } from "@/ui/form";
import { QuantityInput } from "@/ui/QuantityInput";
import { UnitSelect } from "@/ui/UnitSelect";

const t = fr.list.line;

/**
 * Quantité et unité d'une ligne ou d'un ingrédient, côte à côte (la quantité, un nombre
 * court, au plus juste ; l'unité, au nom parfois long, prend le reste), puis les unités
 * habituelles de l'article en puces (s'il y en a plusieurs). `kitchen` : propose aussi
 * les unités de cuisine (recettes). − / + suivent le pas de l'unité et en changent au
 * besoin (950 g → 1 kg, 1 kg → 950 g, docs/02 § 5). Le pas lui-même se calcule en base
 * (`onStep` : `stepItem`, `stepIngredient`, pour ne perdre aucun appui) ; `stepping`,
 * les mêmes options de `stepAmount`, sert ici à savoir si − est possible.
 * `onUnit` : une autre unité choisie, avec la quantité convertie (1,2 kg → 1200 g).
 */
export function AmountFields({
  units,
  quantity,
  unit,
  usualUnits = [],
  kitchen = false,
  stepping,
  onQuantity,
  onStep,
  onUnit,
}: {
  units: readonly Unit[];
  quantity: number;
  unit: Unit;
  usualUnits?: readonly Unit[];
  kitchen?: boolean;
  stepping?: StepOptions<Unit>;
  onQuantity: (quantity: number) => void;
  onStep: (direction: 1 | -1) => void;
  onUnit: (amount: { unitId: string; quantity: number }) => void;
}) {
  const pickUnit = (unitId: string) => {
    const next = units.find((u) => u.id === unitId);
    if (!next || next.id === unit.id) return;
    onUnit({ unitId: next.id, quantity: changeUnit(quantity, unit, next) });
  };
  const canLess = !!stepAmount({ quantity, unit }, -1, units, stepping);
  return (
    <>
      <div className="flex gap-3">
        <Field label={t.quantity} className="w-40 shrink-0">
          <QuantityInput
            value={quantity}
            onChange={onQuantity}
            onLess={
              canLess
                ? () => {
                    onStep(-1);
                  }
                : undefined
            }
            onMore={() => {
              onStep(1);
            }}
          />
        </Field>
        <Field label={t.unit} className="min-w-0 flex-1">
          <UnitSelect
            units={units}
            value={unit.id}
            kitchen={kitchen}
            onChange={(event) => {
              pickUnit(event.target.value);
            }}
          />
        </Field>
      </div>
      {usualUnits.length > 1 && (
        <div className="-mt-2 flex flex-wrap gap-2">
          {usualUnits.map((u) => (
            <Chip
              key={u.id}
              selected={u.id === unit.id}
              onClick={() => {
                pickUnit(u.id);
              }}
            >
              {u.singular}
            </Chip>
          ))}
        </div>
      )}
    </>
  );
}
