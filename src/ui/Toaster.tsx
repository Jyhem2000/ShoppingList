import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Info,
  type LucideIcon,
  Undo2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { dismissToast, type ToastTone, useToast } from "@/ui/toast";
import { cn } from "@/ui/utils";

const tones: Record<ToastTone, { icon: LucideIcon; className: string }> = {
  neutral: { icon: Undo2, className: "border-secondary text-secondary" },
  success: { icon: CircleCheck, className: "border-success text-success" },
  info: { icon: Info, className: "border-info text-info" },
  warning: { icon: CircleAlert, className: "border-warning text-warning" },
  error: { icon: CircleX, className: "border-danger text-danger" },
};

/**
 * Affiche le message en cours (voir toast.ts) en haut de l'écran, au-dessus de tout
 * (panneaux compris) et jamais caché par le clavier : il descend, puis remonte tout seul.
 * Bordure épaisse et icône de la couleur du ton, sur un fond plus clair que l'interface.
 */
export function Toaster() {
  const toast = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[60] mx-auto max-w-xl">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            initial={{ y: -90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded-2xl border-2 bg-raised py-2 pr-2 pl-3 shadow-xl shadow-black/60",
              tones[toast.tone].className,
            )}
          >
            <ToastIcon tone={toast.tone} />
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToastIcon({ tone }: { tone: ToastTone }) {
  const Icon = tones[tone].icon;
  return <Icon className="size-5 shrink-0" aria-hidden />;
}
