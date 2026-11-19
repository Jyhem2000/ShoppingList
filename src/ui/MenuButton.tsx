import { Ellipsis } from "lucide-react";
import { Button } from "@/ui/button";

/**
 * Bouton « ⋯ » d'un en-tête d'écran (docs/05 § 5) : ouvre le menu des actions sur ce
 * que l'écran affiche (la liste, les recettes). Pas de menu « burger » : il désigne
 * d'habitude la navigation, que porte ici la barre d'onglets.
 */
export function MenuButton({
  label,
  onClick,
}: {
  /** Nom du bouton pour les lecteurs d'écran : « Actions sur la liste ». */
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="icon"
      size="icon"
      onClick={onClick}
      aria-label={label}
      className="-mr-2"
    >
      <Ellipsis className="size-6" aria-hidden />
    </Button>
  );
}
