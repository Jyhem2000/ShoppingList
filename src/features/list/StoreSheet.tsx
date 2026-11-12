import { Check, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { manageStorePath } from "@/app/routes";
import { storeTemplatesData } from "@/data";
import { createStoreFromTemplate } from "@/db/catalog";
import { db } from "@/db/database";
import { updateList } from "@/db/lists";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { Chip, Field, TextInput } from "@/ui/form";
import { Sheet } from "@/ui/Sheet";
import { cn } from "@/ui/utils";
import type { ListData } from "./useListData";

const t = fr.list.stores;

/**
 * Magasin d'affichage de la liste (docs/03 B5), mémorisé pour cette liste ; création
 * d'un magasin à partir d'un modèle (l'édition des rayons arrive en phase 6).
 */
export function StoreSheet({
  data,
  onClose,
}: {
  data: ListData;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [template, setTemplate] = useState(
    storeTemplatesData[0]?.key ?? "supermarche",
  );
  const [name, setName] = useState(storeTemplatesData[0]?.name.fr ?? "");
  const choose = (storeId: string) => {
    void updateList(db, data.list.id, { lastStoreId: storeId });
    onClose();
  };

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={creating ? t.newTitle : t.title}
    >
      {creating ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            void createStoreFromTemplate(db, template, name.trim()).then(
              (store) => {
                choose(store.id);
              },
            );
          }}
        >
          <div>
            <p className="mb-1.5 text-sm font-semibold text-muted-foreground">
              {t.template}
            </p>
            <div className="flex flex-wrap gap-2">
              {storeTemplatesData.map((tpl) => (
                <Chip
                  key={tpl.key}
                  selected={tpl.key === template}
                  onClick={() => {
                    // Le nom suit le modèle tant qu'il n'a pas été modifié.
                    const previous = storeTemplatesData.find(
                      (x) => x.key === template,
                    );
                    if (!name.trim() || name === previous?.name.fr)
                      setName(tpl.name.fr);
                    setTemplate(tpl.key);
                  }}
                >
                  {tpl.name.fr}
                </Chip>
              ))}
            </div>
          </div>
          <Field label={t.name}>
            <TextInput
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
          </Field>
          <Button type="submit" disabled={!name.trim()}>
            {t.create}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col">
            {data.stores.map((store) => {
              const current = store.id === data.store?.id;
              return (
                <li key={store.id}>
                  <button
                    type="button"
                    onClick={() => {
                      choose(store.id);
                    }}
                    aria-current={current || undefined}
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left font-semibold active:bg-raised"
                  >
                    <span className="flex size-5 items-center justify-center text-secondary">
                      {current && <Check className="size-5" aria-hidden />}
                    </span>
                    <span className={cn("truncate", current && "text-primary")}>
                      {store.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <Button
            variant="outline"
            onClick={() => {
              setCreating(true);
            }}
          >
            <Plus />
            {t.newStore}
          </Button>
          {data.store && (
            <Button
              variant="outline"
              onClick={() => {
                if (!data.store) return;
                onClose();
                void navigate(manageStorePath(data.store.id));
              }}
            >
              <Pencil />
              {fr.manage.store.edit}
            </Button>
          )}
        </div>
      )}
    </Sheet>
  );
}
