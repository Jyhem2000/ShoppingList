import { Check, Plus } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useNavigate } from "react-router";
import { routes } from "@/app/routes";
import { db } from "@/db/database";
import { startSession } from "@/db/sessions";
import { createEmptyStore } from "@/db/stores";
import type { ID } from "@/domain/model";
import type { ListData } from "@/features/list/useListData";
import { reportSaveError } from "@/features/list/useAddToList";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { Field, TextInput } from "@/ui/form";
import { Sheet } from "@/ui/Sheet";
import { cn } from "@/ui/utils";

const t = fr.shopping;

/** Choix « un autre magasin » : on le crée en partant. */
const NEW = "new";

/**
 * « C'est parti » (docs/03 B5, C1) : le magasin, puis le mode courses. Sans magasin
 * (premier lancement), ou en choisissant « Un autre magasin », on en crée un vide : ses
 * rayons se rangent pendant les courses (C4).
 */
export function StartShoppingSheet({
  data,
  onClose,
}: {
  data: ListData;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [choice, setChoice] = useState<ID>(data.store?.id ?? NEW);
  const [name, setName] = useState("");
  const creating = choice === NEW;

  const go = async () => {
    const storeId = creating
      ? (await createEmptyStore(db, name.trim())).id
      : choice;
    await startSession(db, data.list.id, storeId);
    void navigate(routes.shopping);
  };

  const option = (id: ID, label: string, icon?: ReactNode) => {
    const selected = id === choice;
    return (
      <li key={id}>
        <button
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={() => {
            setChoice(id);
          }}
          className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left font-semibold active:bg-raised"
        >
          <span className="flex size-5 items-center justify-center text-secondary">
            {selected ? <Check className="size-5" aria-hidden /> : icon}
          </span>
          <span className={cn("truncate", selected && "text-primary")}>
            {label}
          </span>
        </button>
      </li>
    );
  };

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
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void go().catch(reportSaveError);
        }}
      >
        {data.stores.length > 0 && (
          <ul
            role="radiogroup"
            aria-label={t.startText}
            className="mb-4 flex flex-col"
          >
            {data.stores.map((store) => option(store.id, store.name))}
            {option(
              NEW,
              t.newStore,
              <Plus className="size-5 text-muted-foreground" aria-hidden />,
            )}
          </ul>
        )}
        {creating && (
          <div className="mb-4">
            <Field label={t.newStoreName}>
              <TextInput
                value={name}
                placeholder={t.newStorePlaceholder}
                onChange={(event) => {
                  setName(event.target.value);
                }}
              />
            </Field>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.newStoreHint}
            </p>
          </div>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={creating && !name.trim()}
        >
          {t.go}
        </Button>
      </form>
    </Sheet>
  );
}
