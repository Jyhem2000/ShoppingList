import type { ReactNode } from "react";
import { CheckRow } from "@/ui/form";
import { RowText } from "@/ui/RowButton";

/** Quantité à droite d'une ligne (aperçu, ingrédient) : en or, en gras. */
export function QuantityText({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 font-bold text-secondary tabular-nums">
      {children}
    </span>
  );
}

/**
 * Ligne d'un aperçu d'ajout à cocher (« Compléter une liste », « Ajouter une recette ») :
 * case, icône, libellé et ce qui arrivera (« à ajouter », « déjà 1 kg → 1,75 kg »), et
 * la quantité ajoutée.
 */
export function PreviewRow({
  checked,
  onCheckedChange,
  icon,
  title,
  detail,
  quantity,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  quantity: ReactNode;
}) {
  return (
    <CheckRow checked={checked} onCheckedChange={onCheckedChange}>
      {icon}
      <RowText title={title} detail={detail} />
      <QuantityText>{quantity}</QuantityText>
    </CheckRow>
  );
}
