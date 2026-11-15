import { Minus, Plus, Trash2 } from "lucide-react";
import { db } from "@/db/database";
import { deleteItems, restoreItems, updateItem } from "@/db/lists";
import { otherTypes, typesKey } from "@/domain/lines";
import type { Article, ListItem } from "@/domain/model";
import { feedback } from "@/feedback";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { OtherTypes } from "@/ui/OtherTypes";
import { Sheet } from "@/ui/Sheet";
import { showToast } from "@/ui/toast";
import { lineQuantity } from "@/features/list/format";
import { KeepOneOff } from "@/features/list/KeepOneOff";
import type { ListData } from "@/features/list/useListData";

const t = fr.catalog;

/**
 * Réglage rapide d'un article déjà dans la liste (docs/03 A5) : **toutes ses lignes**,
 * chacune avec sa sorte (« Peu importe », « Entier »), ses − / + et sa corbeille, puis
 * « Une autre sorte » (docs/02 § 6). Une sorte touchée ajoute sa ligne ici même, avec
 * la quantité par défaut de l'article, à régler sur place ; le panneau reste ouvert.
 * Il se ferme quand l'article n'a plus de ligne.
 */
export function QuantitySheet({
  article,
  data,
  onClose,
  onAddType,
}: {
  article: Article;
  data: ListData;
  onClose: () => void;
  onAddType: (type: string) => void;
}) {
  const lines = data.items
    .filter((item) => item.articleId === article.id)
    .sort(
      (a, b) =>
        a.acceptedTypes.length - b.acceptedTypes.length ||
        typesKey(a.acceptedTypes).localeCompare(typesKey(b.acceptedTypes)) ||
        a.createdAt - b.createdAt,
    );
  // Une seule ligne « peu importe » : pas d'étiquette, le panneau d'avant.
  const labelled = lines.some((line) => line.acceptedTypes.length > 0);

  const remove = (line: ListItem) => {
    if (lines.length === 1) onClose();
    void deleteItems(db, [line.id]).then((removed) => {
      feedback.remove();
      showToast(fr.list.removed(article.name), {
        action: {
          label: fr.list.undo,
          run: () => {
            void restoreItems(db, removed);
          },
        },
      });
    });
  };

  return (
    <Sheet
      open
      autoFocus={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t.quantityTitle(article.name)}
    >
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2">
          {lines.map((line) => (
            <QuantityRow
              key={line.id}
              line={line}
              data={data}
              label={
                labelled
                  ? line.acceptedTypes.length
                    ? fr.list.typesMany(line.acceptedTypes)
                    : fr.list.line.anyType
                  : undefined
              }
              onRemove={() => {
                remove(line);
              }}
            />
          ))}
        </ul>
        <OtherTypes
          types={otherTypes(article, data.items)}
          onPick={onAddType}
          label={t.otherType}
        />
        <KeepOneOff article={article} data={data} />
        <Button onClick={onClose}>{t.done}</Button>
      </div>
    </Sheet>
  );
}

function QuantityRow({
  line,
  data,
  label,
  onRemove,
}: {
  line: ListItem;
  data: ListData;
  label?: string;
  onRemove: () => void;
}) {
  const unit = data.unitById.get(line.unitId);
  if (!unit) return null;
  const step = unit.step > 0 ? unit.step : 1;
  const set = (quantity: number) => {
    void updateItem(db, line.id, {
      quantity: Math.round(quantity * 1000) / 1000,
    });
  };
  return (
    <li className="flex items-center gap-2">
      {label && (
        <span className="min-w-0 flex-1 truncate font-semibold">{label}</span>
      )}
      <div
        className={
          label
            ? "flex items-center gap-2"
            : "flex flex-1 items-center justify-center gap-4"
        }
      >
        <Button
          variant="iconOutline"
          size="icon"
          aria-label={fr.list.line.less}
          disabled={line.quantity <= step}
          onClick={() => {
            set(Math.max(step, line.quantity - step));
          }}
        >
          <Minus />
        </Button>
        <span
          className={
            label
              ? "min-w-16 text-center text-lg font-extrabold text-secondary tabular-nums"
              : "min-w-28 text-center text-2xl font-extrabold text-secondary tabular-nums"
          }
        >
          {lineQuantity(line, data.unitById)}
        </span>
        <Button
          variant="iconOutline"
          size="icon"
          aria-label={fr.list.line.more}
          onClick={() => {
            set(line.quantity + step);
          }}
        >
          <Plus />
        </Button>
      </div>
      <Button
        variant="icon"
        size="icon"
        className="text-danger"
        aria-label={t.removeLine(label)}
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
    </li>
  );
}
