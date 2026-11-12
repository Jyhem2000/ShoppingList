import { useState } from "react";
import { Field, TextInput } from "@/ui/form";

/**
 * Nom modifiable, enregistré en quittant le champ ou par Entrée ; vide = on garde
 * l'ancien. À poser avec `key={value}` : le champ suit les changements venus d'ailleurs.
 */
export function NameField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(value);
  const save = () => {
    const clean = name.trim();
    if (clean && clean !== value) onSave(clean);
    else setName(value);
  };
  return (
    <Field label={label}>
      <TextInput
        value={name}
        onChange={(event) => {
          setName(event.target.value);
        }}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
    </Field>
  );
}
