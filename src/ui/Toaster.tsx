import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Info,
  type LucideIcon,
} from "lucide-react";
import { dismissToast, type ToastTone, useToast } from "@/ui/toast";
import { cn } from "@/ui/utils";

const tones: Record<ToastTone, { icon?: LucideIcon; className: string }> = {
  neutral: { className: "border-border" },
  success: { icon: CircleCheck, className: "border-success text-success" },
  info: { icon: Info, className: "border-info text-info" },
  warning: { icon: CircleAlert, className: "border-warning text-warning" },
  error: { icon: CircleX, className: "border-danger text-danger" },
};

/** Affiche le message en cours (voir toast.ts), au-dessus de la barre d'ajout. */
export function Toaster() {
  const toast = useToast();
  if (!toast) return null;
  const { icon: Icon, className } = tones[toast.tone];
  return (
    <div
      key={toast.id}
      role={toast.tone === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto absolute inset-x-3 bottom-20 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-l-4 bg-raised py-2 pr-2 pl-3 shadow-lg shadow-black/40 motion-safe:animate-[fade-in_200ms_ease-out]",
        className,
      )}
    >
      {Icon && <Icon className="size-5 shrink-0" aria-hidden />}
      <span className="min-h-11 min-w-0 flex-1 content-center text-sm font-semibold text-text">
        {toast.message}
      </span>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.run();
            dismissToast();
          }}
          className="min-h-11 shrink-0 rounded-xl px-3 font-bold text-primary active:bg-surface"
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
