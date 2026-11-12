import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { addArticleType } from "@/db/catalog";
import { Link } from "react-router";
import { manageArticlePath } from "@/app/routes";
import { db } from "@/db/database";
import { updateItem } from "@/db/lists";
import type { ListItem } from "@/domain/model";
import { changeUnit, formatNumber } from "@/domain/quantity";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { Chip, Field, TextInput } from "@/ui/form";
import { Sheet } from "@/ui/Sheet";
import { KeepOneOff } from "./KeepOneOff";
import { UnitSelect } from "./UnitSelect";
import type { ListData } from "./useListData";
import { useUsualUnits } from "./useUsualUnits";

const t = fr.list.line;

function parseQuantity(text: string): number | undefined {
  const value = Number(text.replace(",", ".").trim());
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/** Arrondi d'affichage des pas décimaux (0,5 + 0,5 + 0,5…). */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Fiche d'une ligne (docs/03 B3) : quantité (− / + selon le pas de l'unité, ou
 * saisie), unité (avec conversion), types acceptés, note. Chaque changement est
 * enregistré tout de suite.
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
  const [quantityText, setQuantityText] = useState(formatNumber(item.quantity));
  const [note, setNote] = useState(item.note ?? "");
  const [newType, setNewType] = useState("");
  const usualUnits = useUsualUnits(article, data, item.id);
  if (!article || !unit) return null;

  const step = unit.step > 0 ? unit.step : 1;
  const setQuantity = (quantity: number) => {
    setQuantityText(formatNumber(quantity));
    void updateItem(db, item.id, { quantity });
  };
  const setUnit = (unitId: string) => {
    const next = data.unitById.get(unitId);
    if (!next || next.id === item.unitId) return;
    const quantity = changeUnit(item.quantity, unit, next);
    setQuantityText(formatNumber(quantity));
    void updateItem(db, item.id, { unitId: next.id, quantity });
  };
  const toggleType = (type: string) => {
    const acceptedTypes = item.acceptedTypes.includes(type)
      ? item.acceptedTypes.filter((t) => t !== type)
      : [...item.acceptedTypes, type];
    void updateItem(db, item.id, { acceptedTypes });
  };
  const saveNote = () => {
    if (note.trim() !== (item.note ?? ""))
      void updateItem(db, item.id, { note: note.trim() || undefined });
  };

  return (
    <Sheet
      open
      autoFocus={false}
      onOpenChange={(open) => {
        if (!open) {
          saveNote();
          onClose();
        }
      }}
      title={article.name}
    >
      <div className="flex flex-col gap-5 pb-1">
        <div className="flex gap-3">
          <Field label={t.quantity} className="flex-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="iconOutline"
                size="icon"
                aria-label={t.less}
                disabled={item.quantity <= step}
                onClick={() => {
                  setQuantity(round(Math.max(step, item.quantity - step)));
                }}
              >
                <Minus />
              </Button>
              <TextInput
                inputMode="decimal"
                value={quantityText}
                onChange={(event) => {
                  setQuantityText(event.target.value);
                  const value = parseQuantity(event.target.value);
                  if (value !== undefined)
                    void updateItem(db, item.id, { quantity: value });
                }}
                onBlur={() => {
                  setQuantityText(formatNumber(item.quantity));
                }}
                className="text-center font-bold tabular-nums"
                aria-label={t.quantity}
              />
              <Button
                type="button"
                variant="iconOutline"
                size="icon"
                aria-label={t.more}
                onClick={() => {
                  setQuantity(round(item.quantity + step));
                }}
              >
                <Plus />
              </Button>
            </div>
          </Field>
          <Field label={t.unit} className="w-40">
            <UnitSelect
              units={data.units}
              value={item.unitId}
              onChange={(event) => {
                setUnit(event.target.value);
              }}
            />
          </Field>
        </div>
        {usualUnits.length > 1 && (
          <div className="-mt-2 flex flex-wrap gap-2">
            {usualUnits.map((u) => (
              <Chip
                key={u.id}
                selected={u.id === item.unitId}
                onClick={() => {
                  setUnit(u.id);
                }}
                className="min-h-10"
              >
                {u.singular}
              </Chip>
            ))}
          </div>
        )}

        <div>
          <p className="mb-1.5 text-sm font-semibold text-muted-foreground">
            {t.types}
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip
              selected={item.acceptedTypes.length === 0}
              onClick={() =>
                void updateItem(db, item.id, { acceptedTypes: [] })
              }
            >
              {t.anyType}
            </Chip>
            {article.types.map((type) => (
              <Chip
                key={type}
                selected={item.acceptedTypes.includes(type)}
                onClick={() => {
                  toggleType(type);
                }}
              >
                {type}
              </Chip>
            ))}
          </div>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const type = newType.trim();
              if (!type) return;
              void addArticleType(db, article.id, type).then(() =>
                updateItem(db, item.id, {
                  acceptedTypes: [...new Set([...item.acceptedTypes, type])],
                }),
              );
              setNewType("");
            }}
          >
            <TextInput
              value={newType}
              onChange={(event) => {
                setNewType(event.target.value);
              }}
              placeholder={t.newType}
              aria-label={t.newType}
            />
            <Button
              type="submit"
              variant="iconOutline"
              size="icon"
              aria-label={t.addType}
              disabled={!newType.trim()}
            >
              <Plus />
            </Button>
          </form>
        </div>

        <KeepOneOff article={article} data={data} />

        <Field label={t.note}>
          <TextInput
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
            }}
            onBlur={saveNote}
            placeholder={t.notePlaceholder}
          />
        </Field>

        <Link
          to={manageArticlePath(article.id)}
          onClick={() => {
            saveNote();
            onClose();
          }}
          className="-my-1 flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-primary"
        >
          <Pencil className="size-4" aria-hidden />
          {fr.manage.article.edit}
        </Link>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-danger/50 text-danger"
            onClick={() => {
              onRemove(item);
              onClose();
            }}
          >
            <Trash2 />
            {t.remove}
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() => {
              saveNote();
              onClose();
            }}
          >
            {t.done}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
