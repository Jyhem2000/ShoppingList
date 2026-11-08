import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/ui/utils";

/** En-tête d'écran, avec retour optionnel. */
export function PageHeader({ title, backTo }: { title: string; backTo?: string }) {
  return (
    <header className="flex items-center gap-2 px-4 pt-4 pb-2">
      {backTo && (
        <Link
          to={backTo}
          aria-label="Retour"
          className="-ml-2 flex size-11 items-center justify-center rounded-xl text-primary hover:bg-surface-2"
        >
          <ChevronLeft className="size-6" />
        </Link>
      )}
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
    </header>
  );
}

/** État vide illustré. */
export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-8 pt-16 text-center">
      <div className="mb-5 flex size-20 items-center justify-center rounded-3xl bg-surface-2 text-primary">
        {icon}
      </div>
      <h2 className="mb-2 text-xl font-bold">{title}</h2>
      {children && <p className="max-w-xs text-muted-foreground">{children}</p>}
    </div>
  );
}

/** Groupe de lignes de réglages. */
export function Section({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("px-4 pt-4", className)}>
      {title && (
        <h2 className="px-1 pb-2 text-xs font-extrabold uppercase tracking-widest text-primary">
          {title}
        </h2>
      )}
      <div className="divide-y divide-border overflow-hidden rounded-2xl bg-surface">
        {children}
      </div>
    </section>
  );
}

/** Ligne d'information ou d'action dans une section, grisée si indisponible. */
export function Row({
  label,
  hint,
  icon,
  disabled,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      aria-disabled={disabled || undefined}
      className={cn("flex min-h-14 items-center gap-3 px-4 py-3", disabled && "opacity-45")}
    >
      {icon && <span className="shrink-0 text-primary [&_svg]:size-5">{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{label}</div>
        {hint && <div className="text-sm text-muted-foreground">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

/** Ligne qui mène à un autre écran. */
export function LinkRow({
  to,
  icon,
  label,
  hint,
}: {
  to: string;
  icon?: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <Link to={to} className="flex min-h-14 items-center gap-3 px-4 py-3 active:bg-surface-2">
      {icon && <span className="shrink-0 text-primary [&_svg]:size-5">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
      </span>
      <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
    </Link>
  );
}
