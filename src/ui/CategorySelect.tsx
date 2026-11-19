import type { Category, ID } from "@/domain/model";
import { byName } from "@/domain/slug";
import { Select } from "@/ui/form";

/**
 * Sélecteur de catégorie, triées par nom. `exclude` : catégories à ne pas proposer.
 * `placeholder` : première option, de valeur vide (« Toutes les catégories »,
 * « Choisir… ») ; `required` : on ne peut pas y revenir.
 */
export function CategorySelect({
  categories,
  value,
  onChange,
  exclude,
  placeholder,
  required = false,
  ariaLabel,
}: {
  categories: readonly Category[];
  value: string;
  onChange: (id: ID) => void;
  exclude?: (category: Category) => boolean;
  placeholder?: string;
  required?: boolean;
  ariaLabel?: string;
}) {
  const options = categories.filter((c) => !exclude?.(c)).sort(byName);
  return (
    <Select
      value={value}
      aria-label={ariaLabel}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    >
      {placeholder !== undefined && (
        <option value="" disabled={required}>
          {placeholder}
        </option>
      )}
      {options.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </Select>
  );
}
