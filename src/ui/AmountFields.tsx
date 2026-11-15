import type { Unit } from "@/domain/model";
import { fr } from "@/i18n/fr";
import { Chip, Field } from "@/ui/form";
import { QuantityInput } from "@/ui/QuantityInput";
import { UnitSelect } from "@/ui/UnitSelect";

const t = fr.list.line;

/**
 * Quantité et unité d'une ligne ou d'un ingrédient, côte à côte, puis les unités
 * habituelles de l'article en puces (s'il y en a plusieurs). `kitchen` : propose aussi
 * les unités de cuisine (recettes).
 */
export function AmountFields({
  units,
  quantity,
  unit,
  usualUnits = [],
  kitchen = false,
  onQuantity,
  onUnit,
}: {
  units: readonly Unit[];
  quantity: number;
  unit: Unit;
  usualUnits?: readonly Unit[];
  kitchen?: boolean;
  onQuantity: (quantity: number) => void;
  onUnit: (unitId: string) => void;
}) {
  return (
    <>
      <div className="flex gap-3">
        <Field label={t.quantity} className="flex-1">
          <QuantityInput
            value={quantity}
            step={unit.step}
            onChange={onQuantity}
          />
        </Field>
        <Field label={t.unit} className="w-40">
          <UnitSelect
            units={units}
            value={unit.id}
            kitchen={kitchen}
            onChange={(event) => {
              onUnit(event.target.value);
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
                onUnit(u.id);
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
