import type { ReactNode } from "react";
import { cn } from "@/ui/utils";

/**
 * Pastille or d'un nombre ou d'une quantité (carte du catalogue, bouton « Faire le
 * tour ») : aplat or, texte gras (docs/05 § 2).
 */
export function CountBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full bg-secondary-fill px-2 py-0.5 text-xs font-extrabold text-on-secondary tabular-nums",
        className,
      )}
    >
      {children}
    </span>
  );
}
