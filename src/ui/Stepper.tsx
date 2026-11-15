import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { cn } from "@/ui/utils";

/**
 * Réglage d'une quantité par − et + (ligne de liste, réglage rapide du catalogue,
 * ingrédient, nombre de personnes d'une recette) : au milieu, la valeur
 * (`StepperValue`) ou un champ de saisie.
 */
export function Stepper({
  onLess,
  onMore,
  lessDisabled = false,
  lessLabel = fr.list.line.less,
  moreLabel = fr.list.line.more,
  className,
  children,
}: {
  onLess: () => void;
  onMore: () => void;
  lessDisabled?: boolean;
  lessLabel?: string;
  moreLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="iconOutline"
        size="icon"
        aria-label={lessLabel}
        disabled={lessDisabled}
        onClick={onLess}
      >
        <Minus />
      </Button>
      {children}
      <Button
        type="button"
        variant="iconOutline"
        size="icon"
        aria-label={moreLabel}
        onClick={onMore}
      >
        <Plus />
      </Button>
    </div>
  );
}

/** Valeur affichée entre − et + : en or, en gras (« 750 g », « 6 personnes »). */
export function StepperValue({
  size = "md",
  children,
}: {
  size?: "md" | "lg";
  children: ReactNode;
}) {
  return (
    <span
      aria-live="polite"
      className={cn(
        "text-center font-extrabold text-secondary tabular-nums",
        size === "lg" ? "min-w-28 text-2xl" : "min-w-16 text-lg",
      )}
    >
      {children}
    </span>
  );
}
