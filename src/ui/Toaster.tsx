import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Info,
  type LucideIcon,
  Undo2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { dismissToast, type ToastTone, useToast } from "@/ui/toast";
import { cn } from "@/ui/utils";

const tones: Record<ToastTone, { icon: LucideIcon; className: string }> = {
  neutral: { icon: Undo2, className: "border-primary text-primary" },
  success: { icon: CircleCheck, className: "border-success text-success" },
  info: { icon: Info, className: "border-info text-info" },
  warning: { icon: CircleAlert, className: "border-warning text-warning" },
  error: { icon: CircleX, className: "border-danger text-danger" },
};

/**
 * Affiche le message en cours (voir toast.ts) en haut de l'écran, au-dessus de tout
 * (panneaux compris) et jamais caché par le clavier : il descend, puis remonte tout seul.
 * Posé sous le flou qu'iOS 26 met sous la barre d'état (même marge que les titres d'écran).
 * Bordure épaisse et icône de la couleur du ton, sur un fond plus clair que l'interface.
 * Se ferme aussi d'un ✕ ou en le poussant vers le haut. Un nouveau message prend la
 * place de l'ancien, posé au même endroit, par-dessus : l'ancien s'en va dessous, au
 * lieu de pousser le nouveau plus bas le temps de sortir.
 */
export function Toaster() {
  const toast = useToast();
  return (
    // Zone annoncée par le lecteur d'écran, toujours présente : un message qui apparaît
    // en même temps que sa zone n'est pas toujours lu (VoiceOver). Une seule zone, pour
    // qu'un message ne soit jamais lu deux fois.
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+2rem)] z-[60] mx-auto grid max-w-xl"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: -90, opacity: 0, zIndex: 1 }}
            animate={{ y: 0, opacity: 1, zIndex: 1 }}
            exit={{ y: -90, opacity: 0, zIndex: 0 }}
            // L'ordre d'empilement change d'un coup, sans ressort : le nouveau au-dessus.
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 34,
              zIndex: { duration: 0 },
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.8, bottom: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.y < -30 || info.velocity.y < -300) dismissToast();
            }}
            className={cn(
              "pointer-events-auto relative col-start-1 row-start-1 flex touch-none items-center gap-2 self-start rounded-2xl border-2 bg-raised py-1 pr-1 pl-3 shadow-xl shadow-overlay",
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
            <Button
              variant="iconMuted"
              size="icon"
              aria-label={fr.toast.close}
              onClick={dismissToast}
              // Sur le fond du message (--raised), l'appui se voit en --surface.
              className="hover:bg-surface active:bg-surface"
            >
              <X aria-hidden />
            </Button>
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
