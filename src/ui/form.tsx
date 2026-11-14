import { Check, ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { rowClass } from "@/ui/rowClass";
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
      <FieldLabel as="span">{label}</FieldLabel>
      {children}
    </label>
  );
}

/**
 * Intitulé d'un champ ou d'un groupe de choix (`legend` d'un `fieldset`, ou `p`
 * au-dessus d'un sélecteur).
 */
export function FieldLabel({
  as: Tag = "p",
  children,
}: {
  as?: "p" | "span" | "legend";
  children: ReactNode;
}) {
  return (
    <Tag className="mb-1.5 block text-sm font-semibold text-muted-foreground">
      {children}
    </Tag>
  );
}

// En thème clair, champ blanc bordé : le violet clair (--raised) reste aux éléments surélevés.
const control =
  "h-12 w-full rounded-xl border border-border bg-raised px-3 text-base outline-none focus:border-primary light:bg-bg";

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(control, className)} />;
}

/** Texte sur plusieurs lignes (coller une sauvegarde…). */
export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={cn(control, "h-32 py-2 font-mono text-sm", className)}
    />
  );
}

/** Ligne avec une case à cocher : toute la ligne la coche. */
export function CheckRow({
  checked,
  onCheckedChange,
  className,
  children,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("flex min-h-12 items-center gap-3", className)}>
      <input
        type="checkbox"
        className="size-5 shrink-0 accent-primary"
        checked={checked}
        onChange={(event) => {
          onCheckedChange(event.target.checked);
        }}
      />
      {children}
    </label>
  );
}

/** Repère d'un choix dans une liste : une coche s'il est choisi, sinon son icône. */
export function ChoiceMark({
  selected,
  icon,
}: {
  selected: boolean;
  icon?: ReactNode;
}) {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center text-secondary [&_svg]:size-5">
      {selected ? <Check aria-hidden /> : icon}
    </span>
  );
}

/**
 * Boutons d'une action destructrice à confirmer (supprimer, vider, remplacer) : l'action
 * en rouge, puis « Annuler » s'il y a de quoi revenir en arrière.
 */
export function ConfirmActions({
  label,
  onConfirm,
  onCancel,
  disabled,
}: {
  label: ReactNode;
  onConfirm: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Button variant="destructive" disabled={disabled} onClick={onConfirm}>
        {label}
      </Button>
      {onCancel && (
        <Button variant="outline" onClick={onCancel}>
          {fr.manage.confirmCancel}
        </Button>
      )}
    </div>
  );
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
        rowClass("sheet"),
        "font-semibold",
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
