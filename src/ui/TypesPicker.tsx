import { Plus } from "lucide-react";
import { useState } from "react";
import { texts } from "@/i18n";
import { Button } from "@/ui/button";
import { Chip, FieldLabel, TextInput } from "@/ui/form";

const t = texts.list.line;

/**
 * Sortes acceptées (docs/02 § 6) d'une ligne ou d'un ingrédient : « Peu importe » ou
 * une ou plusieurs sortes de l'article, et l'ajout d'une nouvelle sorte (`onAddType` :
 * l'enregistre dans l'article et l'accepte).
 */
export function TypesPicker({
  types,
  accepted,
  onChange,
  onAddType,
}: {
  types: readonly string[];
  accepted: readonly string[];
  onChange: (accepted: string[]) => void;
  onAddType: (type: string) => void;
}) {
  const [newType, setNewType] = useState("");
  return (
    <div>
      <FieldLabel>{t.types}</FieldLabel>
      <div className="flex flex-wrap gap-2">
        <Chip
          selected={accepted.length === 0}
          onClick={() => {
            onChange([]);
          }}
        >
          {t.anyType}
        </Chip>
        {types.map((type) => (
          <Chip
            key={type}
            selected={accepted.includes(type)}
            onClick={() => {
              onChange(
                accepted.includes(type)
                  ? accepted.filter((other) => other !== type)
                  : [...accepted, type],
              );
            }}
          >
            {type}
          </Chip>
        ))}
      </div>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const type = newType.trim();
          if (!type) return;
          onAddType(type);
          setNewType("");
        }}
      >
        <TextInput
          value={newType}
          onChange={(event) => {
            setNewType(event.target.value);
          }}
          placeholder={t.newType}
          aria-label={t.newType}
        />
        <Button
          type="submit"
          variant="outline"
          size="icon"
          aria-label={t.addType}
          disabled={!newType.trim()}
        >
          <Plus />
        </Button>
      </form>
    </div>
  );
}
