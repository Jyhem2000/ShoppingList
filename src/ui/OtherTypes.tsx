import { fr } from "@/i18n/fr";
import { Chip, FieldLabel } from "@/ui/form";

/**
 * Rangée « Une autre sorte » d'un article déjà dans la liste (docs/02 § 6) : toucher
 * une sorte ajoute une ligne à part pour elle. Rien quand l'article n'a pas de types.
 */
export function OtherTypes({
  types,
  onPick,
  label = fr.list.otherType,
}: {
  types: readonly string[];
  onPick: (type: string) => void;
  /** Ce que fait le toucher (« Ou ajouter 1 litre d'une autre sorte… »). */
  label?: string;
}) {
  if (types.length === 0) return null;
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <Chip
            key={type}
            selected={false}
            onClick={() => {
              onPick(type);
            }}
          >
            {type}
          </Chip>
        ))}
      </div>
    </div>
  );
}
