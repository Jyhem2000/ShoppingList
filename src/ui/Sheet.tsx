import { ArrowLeft, X } from "lucide-react";
import { motion, useDragControls } from "motion/react";
import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { fr } from "@/i18n/fr";

/** Au-delà de ce glissement vers le bas (ou d'un geste rapide), le panneau se ferme. */
const CLOSE_DISTANCE = 90;

/**
 * Panneau glissant du bas (docs/05 § 5.6) : fond --surface, poignée en haut, coins
 * supérieurs arrondis, au-dessus de la barre d'accueil de l'iPhone.
 * Se ferme par ✕ (toujours visible, même clavier ouvert), en glissant la poignée ou
 * l'en-tête vers le bas, ou en touchant à côté. `onBack` : panneau à étapes, bouton
 * retour à l'étape précédente. Le contenu défile sous l'en-tête.
 * `autoFocus={false}` : aucun champ ne prend le focus à l'ouverture, donc le clavier
 * ne s'ouvre pas et ne cache pas le reste du panneau (fiches à consulter d'abord).
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  autoFocus = true,
  onBack,
}: {
  autoFocus?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onBack?: () => void;
}) {
  const drag = useDragControls();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay motion-safe:data-[state=open]:animate-[fade-in_200ms_ease-out]" />
        <Dialog.Content
          asChild
          onOpenAutoFocus={(event) => {
            if (autoFocus) return;
            event.preventDefault();
            (event.currentTarget as HTMLElement | null)?.focus();
          }}
        >
          <motion.div
            drag="y"
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 1 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > CLOSE_DISTANCE || info.velocity.y > 600)
                onOpenChange(false);
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-xl flex-col rounded-t-3xl border-t border-border bg-surface outline-none"
          >
            <div
              onPointerDown={(event) => {
                drag.start(event);
              }}
              className="shrink-0 touch-none px-5 pt-3"
            >
              <div
                aria-hidden
                className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border"
              />
              <div className="flex items-start gap-1">
                {onBack && (
                  <button
                    type="button"
                    aria-label={fr.sheet.back}
                    onClick={onBack}
                    className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-xl text-secondary active:bg-raised"
                  >
                    <ArrowLeft className="size-5" aria-hidden />
                  </button>
                )}
                <div className="min-w-0 flex-1 py-2">
                  <Dialog.Title className="text-lg leading-tight font-extrabold">
                    {title}
                  </Dialog.Title>
                  {description ? (
                    <Dialog.Description className="mt-1 text-muted-foreground">
                      {description}
                    </Dialog.Description>
                  ) : (
                    <Dialog.Description className="sr-only">
                      {title}
                    </Dialog.Description>
                  )}
                </div>
                <Dialog.Close
                  aria-label={fr.sheet.close}
                  className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground active:bg-raised"
                >
                  <X className="size-6" aria-hidden />
                </Dialog.Close>
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
              {children}
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
