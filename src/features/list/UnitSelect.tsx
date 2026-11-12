import type { ChangeEvent } from "react";
import type { Unit } from "@/domain/model";
import { UNIT_GROUPS, unitGroup, unitOptionLabel } from "@/domain/quantity";
import { fr } from "@/i18n/fr";
import { Select } from "@/ui/form";

/**
 * Sélecteur d'unité (docs/06 § 1) : unités rangées par groupe (poids, volume,
 * contenants, à l'unité), nommées en clair (« gramme (g) », « barquette »). Les
 * unités de cuisine (cuillère, pincée) ne servent qu'aux recettes : elles n'y
 * figurent que si la ligne en utilise déjà une.
 */
export function UnitSelect({
  units,
  value,
  onChange,
  ariaLabel,
}: {
  units: readonly Unit[];
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  ariaLabel?: string;
}) {
  const current = units.find((u) => u.id === value);
  const groups = UNIT_GROUPS.filter(
    (group) =>
      group !== "kitchen" || (current && unitGroup(current) === "kitchen"),
  );
  return (
    <Select value={value} onChange={onChange} aria-label={ariaLabel}>
      {groups.map((group) => {
        const inGroup = units.filter((u) => unitGroup(u) === group);
        if (inGroup.length === 0) return null;
        return (
          <optgroup key={group} label={fr.list.unitGroups[group]}>
            {inGroup.map((u) => (
              <option key={u.id} value={u.id}>
                {unitOptionLabel(u)}
              </option>
            ))}
          </optgroup>
        );
      })}
    </Select>
  );
}
