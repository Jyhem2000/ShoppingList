import { Plus, Store as StoreIcon } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { useNavigate } from "react-router";
import { manageStorePath, routes } from "@/app/routes";
import { storeTemplatesData } from "@/data";
import { createStoreFromTemplate } from "@/db/catalog";
import { db } from "@/db/database";
import { useStores } from "@/db/hooks";
import { copyStore, createEmptyStore } from "@/db/stores";
import type { ID } from "@/domain/model";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { Chip, Field, TextInput } from "@/ui/form";
import { LinkRow, PageHeader, Section } from "@/ui/Page";
import { Sheet } from "@/ui/Sheet";

const t = fr.manage.stores;

type Source = "template" | "copy" | "empty";

/** Magasins (docs/03 G3) : la liste, et la création d'un magasin. */
export function StoresPage() {
  const stores = useStores();
  const [creating, setCreating] = useState(false);
  const counts = useLiveQuery(async () => {
    const map = new Map<ID, number>();
    await db.aisles.each((a) => {
      if (!a.isUnsorted) map.set(a.storeId, (map.get(a.storeId) ?? 0) + 1);
    });
    return map;
  });

  return (
    <>
      <PageHeader title={t.title} backTo={routes.settings} />
      <Section>
        {stores?.map((store) => (
          <LinkRow
            key={store.id}
            to={manageStorePath(store.id)}
            icon={<StoreIcon />}
            label={store.name}
            hint={t.aisles(counts?.get(store.id) ?? 0)}
          />
        ))}
      </Section>
      <div className="px-4 pt-4 pb-6">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setCreating(true);
          }}
        >
          <Plus />
          {t.add}
        </Button>
      </div>
      {creating && (
        <NewStoreSheet
          onClose={() => {
            setCreating(false);
          }}
        />
      )}
    </>
  );
}

function NewStoreSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const stores = useStores();
  const [source, setSource] = useState<Source>("template");
  const [template, setTemplate] = useState(storeTemplatesData[0]?.key ?? "");
  const [copyFrom, setCopyFrom] = useState<ID>();
  const [name, setName] = useState(storeTemplatesData[0]?.name.fr ?? "");
  const from = copyFrom ?? stores?.[0]?.id;

  const create = async () => {
    const clean = name.trim();
    if (!clean) return;
    const store =
      source === "template"
        ? await createStoreFromTemplate(db, template, clean)
        : source === "copy" && from
          ? await copyStore(db, from, clean)
          : await createEmptyStore(db, clean);
    onClose();
    if (store) void navigate(manageStorePath(store.id));
  };

  return (
    <Sheet
      open
      autoFocus={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t.newTitle}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void create();
        }}
      >
        <div>
          <p className="mb-1.5 text-sm font-semibold text-muted-foreground">
            {t.from}
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["template", t.fromTemplate],
                ["copy", t.fromCopy],
                ["empty", t.fromEmpty],
              ] as const
            ).map(([key, label]) => (
              <Chip
                key={key}
                selected={source === key}
                onClick={() => {
                  setSource(key);
                }}
              >
                {label}
              </Chip>
            ))}
          </div>
        </div>
        {source === "template" && (
          <div className="flex flex-wrap gap-2">
            {storeTemplatesData.map((tpl) => (
              <Chip
                key={tpl.key}
                selected={tpl.key === template}
                onClick={() => {
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
        )}
        {source === "copy" && (
          <div>
            <p className="mb-1.5 text-sm font-semibold text-muted-foreground">
              {t.copyOf}
            </p>
            <div className="flex flex-wrap gap-2">
              {stores?.map((store) => (
                <Chip
                  key={store.id}
                  selected={store.id === from}
                  onClick={() => {
                    setCopyFrom(store.id);
                  }}
                >
                  {store.name}
                </Chip>
              ))}
            </div>
          </div>
        )}
        {source === "empty" && (
          <p className="text-sm text-muted-foreground">{t.emptyHint}</p>
        )}
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
    </Sheet>
  );
}
