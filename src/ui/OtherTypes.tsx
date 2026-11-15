import { fr } from "@/i18n/fr";
import { Chip, FieldLabel } from "@/ui/form";

/**
 * Rangée « Une autre sorte » d'un article déjà dans la liste (docs/02 § 6) : toucher
 * une sorte ajoute une ligne à part pour elle. Rien quand l'article n'a pas de types.
 */
export function OtherTypes({
  types,
  onPick,
}: {
  types: readonly string[];
  onPick: (type: string) => void;
}) {
  if (types.length === 0) return null;
  return (
    <div>
      <FieldLabel>{fr.list.otherType}</FieldLabel>
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
