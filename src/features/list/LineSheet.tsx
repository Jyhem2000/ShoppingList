import { Pencil } from "lucide-react";
import { useState } from "react";
import { addArticleType } from "@/db/catalog";
import { manageArticlePath } from "@/app/routes";
import { db } from "@/db/database";
import { mergeIntoTwin, updateItem } from "@/db/lists";
import type { ListItem } from "@/domain/model";
import { changeUnit } from "@/domain/quantity";
import { fr } from "@/i18n/fr";
import { AmountFields } from "@/ui/AmountFields";
import { Field, RemoveDoneActions, TextInput } from "@/ui/form";
import { NavButton } from "@/ui/NavButton";
import { Sheet } from "@/ui/Sheet";
import { showToast } from "@/ui/toast";
import { TypesPicker } from "@/ui/TypesPicker";
import { recipeOrigin } from "./format";
import { KeepOneOff } from "./KeepOneOff";
import type { ListData } from "./useListData";
import { usePendingSave } from "@/ui/usePendingSave";
import { useUsualUnits } from "./useUsualUnits";

const t = fr.list.line;

/**
 * Fiche d'une ligne (docs/03 B3) : quantité (− / + selon le pas de l'unité, ou
 * saisie), unité (avec conversion), types acceptés, note, et la recette d'où elle
 * vient (« via Raclette »). Chaque changement est enregistré tout de suite.
 */
export function LineSheet({
  item,
  data,
  onRemove,
  onClose,
}: {
  item: ListItem;
  data: ListData;
  onRemove: (item: ListItem) => void;
  onClose: () => void;
}) {
  const article = data.articleById.get(item.articleId);
  const unit = data.unitById.get(item.unitId);
  const [note, setNote] = useState(item.note ?? "");
  const usualUnits = useUsualUnits(article, data, item.id);
  const { edited, commit: saveNote } = usePendingSave(async () => {
    if (note.trim() !== (item.note ?? ""))
      await updateItem(db, item.id, { note: note.trim() || undefined });
  });
  if (!article || !unit) return null;

  const setUnit = (unitId: string) => {
    const next = data.unitById.get(unitId);
    if (!next || next.id === item.unitId) return;
    const quantity = changeUnit(item.quantity, unit, next);
    void updateItem(db, item.id, { unitId: next.id, quantity });
  };
  // Types changés : la ligne rejoint l'autre ligne du même article aux mêmes types
  // (docs/02 § 6), à la fermeture seulement, pour ne pas fusionner en cours de choix.
  const close = async () => {
    await saveNote();
    if (await mergeIntoTwin(db, item.id))
      showToast(fr.list.linesJoined, { tone: "info" });
  };
  const origin = recipeOrigin(item, data.recipeById);

  return (
    <Sheet
      open
      autoFocus={false}
      onOpenChange={(open) => {
        if (!open) {
          void close();
          onClose();
        }
      }}
      title={article.name}
      description={origin}
    >
      <div className="flex flex-col gap-5 pb-1">
        <AmountFields
          units={data.units}
          quantity={item.quantity}
          unit={unit}
          usualUnits={usualUnits}
          onQuantity={(quantity) => void updateItem(db, item.id, { quantity })}
          onUnit={setUnit}
        />

        <TypesPicker
          types={article.types}
          accepted={item.acceptedTypes}
          onChange={(acceptedTypes) =>
            void updateItem(db, item.id, { acceptedTypes })
          }
          onAddType={(type) => {
            void addArticleType(db, article.id, type).then(() =>
              updateItem(db, item.id, {
                acceptedTypes: [...new Set([...item.acceptedTypes, type])],
              }),
            );
          }}
        />

        <KeepOneOff article={article} data={data} />

        <Field label={t.note}>
          <TextInput
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              edited();
            }}
            onBlur={() => void saveNote()}
            placeholder={t.notePlaceholder}
          />
        </Field>

        <NavButton
          to={manageArticlePath(article.id)}
          onClick={() => {
            void close();
            onClose();
          }}
          className="-my-1 flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-primary"
        >
          <Pencil className="size-4" aria-hidden />
          {fr.manage.article.edit}
        </NavButton>

        <RemoveDoneActions
          removeLabel={t.remove}
          doneLabel={t.done}
          onRemove={() => {
            onRemove(item);
            onClose();
          }}
          onDone={() => {
            void close();
            onClose();
          }}
        />
      </div>
    </Sheet>
  );
}
