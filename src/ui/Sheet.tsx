import { ArrowLeft, X } from "lucide-react";
import { motion, useDragControls } from "motion/react";
import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { texts } from "@/i18n";
import { Button } from "@/ui/button";
import { buttonVariants } from "@/ui/buttonVariants";
import { cn } from "@/ui/utils";

/** Au-delà de ce glissement vers le bas (ou d'un geste rapide), le panneau se ferme. */
const CLOSE_DISTANCE = 90;

/**
 * Toujours ouvert : on l’affiche ou non ; `onClose` à la fermeture.
 * Panneau glissant du bas (docs/05 § 5.6) : fond --surface, poignée en haut, coins
 * supérieurs arrondis, au-dessus de la barre d'accueil de l'iPhone.
 * Se ferme par ✕ (toujours visible, même clavier ouvert), en glissant la poignée ou
 * l'en-tête vers le bas, ou en touchant à côté. `onBack` : panneau à étapes, bouton
 * retour à l'étape précédente. Le contenu défile sous l'en-tête.
 * `autoFocus={false}` : aucun champ ne prend le focus à l'ouverture, donc le clavier
 * ne s'ouvre pas et ne cache pas le reste du panneau (fiches à consulter d'abord).
 * `tall` : toujours à sa hauteur maximale, pour un panneau de recherche. Sinon, avec peu
 * de résultats, il rapetisse et ses résultats passent sous le clavier ; ainsi, ils
 * restent juste sous le champ, en haut de l'écran.
 * Posé dans le cadre de l'app, pas dans la page : au lancement sur iPhone, le cadre est
 * à la hauteur de l'écran alors que la zone d'affichage est trop courte. Un panneau fixe
 * suivrait cette zone, et bougerait quand le premier clavier la corrige, en laissant le
 * curseur à l'ancienne place, hors du champ (src/platform/viewport.ts).
 */
export function Sheet({
  onClose,
  title,
  description,
  children,
  autoFocus = true,
  tall = false,
  onBack,
}: {
  autoFocus?: boolean;
  tall?: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  onBack?: () => void;
}) {
  const drag = useDragControls();

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal container={appFrame()}>
        <Dialog.Overlay className="absolute inset-0 z-50 bg-overlay motion-safe:data-[state=open]:animate-[fade-in_200ms_ease-out]" />
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
                onClose();
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className={cn(
              "absolute inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-xl flex-col rounded-t-3xl border-t border-border bg-surface outline-none",
              tall && "h-[92dvh]",
            )}
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
                  <Button
                    variant="icon"
                    size="icon"
                    aria-label={texts.sheet.back}
                    onClick={onBack}
                    className="-ml-2"
                  >
                    <ArrowLeft aria-hidden />
                  </Button>
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
                  aria-label={texts.sheet.close}
                  className={buttonVariants({
                    variant: "iconMuted",
                    size: "icon",
                    className: "-mr-2",
                  })}
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

/** Le cadre de l'app (`App`) ; à défaut (maquette, tests), la page. */
function appFrame(): HTMLElement | undefined {
  return document.querySelector<HTMLElement>("[data-app-frame]") ?? undefined;
}
