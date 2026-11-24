import { ChevronRight } from "lucide-react";
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
 * Ligne d'un aperçu d'ajout à cocher (« Compléter une liste », « Ajouter une recette »,
 * liste reçue) : case, icône, libellé et ce qui arrivera (« à ajouter », « déjà 1 kg →
 * 1,75 kg »), et la quantité ajoutée. `onOpen` : la case se coche seule, le reste de la
 * ligne ouvre un choix (l'article d'une ligne reçue) ; `checkLabel` nomme alors la case.
 */
export function PreviewRow({
  checked,
  onCheckedChange,
  icon,
  title,
  detail,
  quantity,
  onOpen,
  checkLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  quantity: ReactNode;
  onOpen?: () => void;
  checkLabel?: string;
}) {
  if (!onOpen)
    return (
      <CheckRow checked={checked} onCheckedChange={onCheckedChange}>
        {icon}
        <RowText title={title} detail={detail} />
        <QuantityText>{quantity}</QuantityText>
      </CheckRow>
    );
  return (
    <div className="flex min-h-12 items-center">
      <label className="flex h-12 w-8 shrink-0 items-center">
        <input
          type="checkbox"
          aria-label={checkLabel}
          className="size-5 shrink-0 accent-primary"
          checked={checked}
          onChange={(event) => {
            onCheckedChange(event.target.checked);
          }}
        />
      </label>
      <button
        type="button"
        onClick={onOpen}
        className="-mr-2 flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl py-1 pr-2 text-left active:bg-raised"
      >
        {icon}
        <RowText title={title} detail={detail} />
        <QuantityText>{quantity}</QuantityText>
        <ChevronRight className="size-5 shrink-0 text-secondary" aria-hidden />
      </button>
    </div>
  );
}
