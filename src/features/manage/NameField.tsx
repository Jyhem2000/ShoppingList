import { useState } from "react";
import { Field, TextInput } from "@/ui/form";
import { usePendingSave } from "@/ui/usePendingSave";

/**
 * Nom modifiable, enregistré en quittant le champ (même sans `blur` : `usePendingSave`)
 * ou par Entrée ; vide = on garde
 * l'ancien, sauf si le champ est `optional` (vide = pas de nom). À poser avec
 * `key={value}` : le champ suit les changements venus d'ailleurs.
 */
export function NameField({
  label,
  value,
  optional = false,
  placeholder,
  hint,
  onSave,
}: {
  label: string;
  value: string;
  optional?: boolean;
  placeholder?: string;
  hint?: string;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(value);
  const save = () => {
    const clean = name.trim();
    if ((clean || optional) && clean !== value) onSave(clean);
    else setName(value);
  };
  const { edited, commit } = usePendingSave(save);
  return (
    <div>
      <Field label={label}>
        <TextInput
          value={name}
          placeholder={placeholder}
          onChange={(event) => {
            setName(event.target.value);
            edited();
          }}
          onBlur={() => void commit()}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
      </Field>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
