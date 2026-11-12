import { Dialog } from "radix-ui";
import type { ReactNode } from "react";

/**
 * Panneau glissant du bas (docs/05 § 5.6) : fond --surface, poignée en haut, coins
 * supérieurs arrondis, au-dessus de la barre d'accueil de l'iPhone.
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
}: {
  autoFocus?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 motion-safe:data-[state=open]:animate-[fade-in_200ms_ease-out]" />
        <Dialog.Content
          onOpenAutoFocus={(event) => {
            if (autoFocus) return;
            event.preventDefault();
            (event.currentTarget as HTMLElement | null)?.focus();
          }}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl rounded-t-3xl border-t border-border bg-surface px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] outline-none motion-safe:data-[state=open]:animate-[sheet-in_250ms_cubic-bezier(0.2,0.9,0.3,1)]"
        >
          <div
            aria-hidden
            className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border"
          />
          <Dialog.Title className="text-lg font-extrabold">
            {title}
          </Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-1 text-muted-foreground">
              {description}
            </Dialog.Description>
          ) : (
            <Dialog.Description className="sr-only">{title}</Dialog.Description>
          )}
          <div className="mt-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
