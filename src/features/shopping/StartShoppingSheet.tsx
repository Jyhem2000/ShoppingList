import { Check } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { routes } from "@/app/routes";
import { db } from "@/db/database";
import { startSession } from "@/db/sessions";
import type { ListData } from "@/features/list/useListData";
import { reportSaveError } from "@/features/list/useAddToList";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { Sheet } from "@/ui/Sheet";
import { cn } from "@/ui/utils";

const t = fr.shopping;

/** « C'est parti » (docs/03 C1) : confirmation du magasin, puis le mode courses. */
export function StartShoppingSheet({
  data,
  onClose,
}: {
  data: ListData;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState(data.store?.id);

  return (
    <Sheet
      open
      autoFocus={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t.startTitle}
      description={t.startText}
    >
      <ul
        role="radiogroup"
        aria-label={t.startText}
        className="mb-4 flex flex-col"
      >
        {data.stores.map((store) => {
          const selected = store.id === storeId;
          return (
            <li key={store.id}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setStoreId(store.id);
                }}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left font-semibold active:bg-raised"
              >
                <span className="flex size-5 items-center justify-center text-secondary">
                  {selected && <Check className="size-5" aria-hidden />}
                </span>
                <span className={cn("truncate", selected && "text-primary")}>
                  {store.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <Button
        className="w-full"
        disabled={!storeId}
        onClick={() => {
          if (!storeId) return;
          void startSession(db, data.list.id, storeId).then(() => {
            void navigate(routes.shopping);
          }, reportSaveError);
        }}
      >
        {t.go}
      </Button>
    </Sheet>
  );
}
