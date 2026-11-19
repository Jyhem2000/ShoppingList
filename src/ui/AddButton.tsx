import { Plus } from "lucide-react";
import { Button } from "@/ui/button";

/** Bouton « Ajouter » pleine largeur, en contour, avec un + (listes, articles, rayons…). */
export function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button variant="outline" className="w-full" onClick={onClick}>
      <Plus />
      {label}
    </Button>
  );
}
