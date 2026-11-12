import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/ui/utils";

/** Champs de formulaire des panneaux : 16 px (pas de zoom sur iPhone), 48 px de haut. */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-semibold text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

const control =
  "h-12 w-full rounded-xl border border-border bg-raised px-3 text-base outline-none focus:border-primary";

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(control, className)} />;
}

/**
 * Liste déroulante : flèche dessinée calée à droite (la flèche native de Safari ne se
 * place pas au bord du champ).
 */
export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <span className={cn("relative block", className)}>
      <select
        {...props}
        className={cn(control, "appearance-none truncate pr-9")}
      />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground"
      />
    </span>
  );
}

/** Puce sélectionnable (types acceptés, choix multiples). */
export function Chip({
  selected,
  className,
  ...props
}: ComponentProps<"button"> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      {...props}
      className={cn(
        "min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors",
        selected
          ? "border-primary bg-primary/20 text-primary"
          : "border-border text-muted-foreground active:bg-raised",
        className,
      )}
    />
  );
}

/** Ligne d'action d'un menu en panneau : icône (couleur du texte) et libellé. */
export function MenuItem({
  icon,
  danger = false,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { icon: ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left font-semibold active:bg-raised disabled:opacity-40",
        danger && "text-danger",
        className,
      )}
    >
      <span className="text-secondary [&_svg]:size-5" aria-hidden>
        {icon}
      </span>
      {children}
    </button>
  );
}
