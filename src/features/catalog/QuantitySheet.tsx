import { Minus, Plus, Trash2 } from "lucide-react";
import { db } from "@/db/database";
import { deleteItems, restoreItems, updateItem } from "@/db/lists";
import type { ListItem } from "@/domain/model";
import { feedback } from "@/feedback";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { Sheet } from "@/ui/Sheet";
import { showToast } from "@/ui/toast";
import { lineQuantity } from "@/features/list/format";
import { KeepOneOff } from "@/features/list/KeepOneOff";
import type { ListData } from "@/features/list/useListData";

const t = fr.catalog;

/** Réglage rapide de la quantité d'un article déjà dans la liste (docs/03 A5). */
export function QuantitySheet({
  item,
  data,
  onClose,
}: {
  item: ListItem;
  data: ListData;
  onClose: () => void;
}) {
  const article = data.articleById.get(item.articleId);
  const unit = data.unitById.get(item.unitId);
  if (!article || !unit) return null;
  const step = unit.step > 0 ? unit.step : 1;
  const set = (quantity: number) => {
    void updateItem(db, item.id, {
      quantity: Math.round(quantity * 1000) / 1000,
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
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="iconOutline"
            size="icon"
            aria-label={fr.list.line.less}
            disabled={item.quantity <= step}
            onClick={() => {
              set(Math.max(step, item.quantity - step));
            }}
          >
            <Minus />
          </Button>
          <span className="min-w-28 text-center text-2xl font-extrabold text-secondary tabular-nums">
            {lineQuantity(item, data.unitById)}
          </span>
          <Button
            variant="iconOutline"
            size="icon"
            aria-label={fr.list.line.more}
            onClick={() => {
              set(item.quantity + step);
            }}
          >
            <Plus />
          </Button>
        </div>
        <KeepOneOff article={article} data={data} />
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-danger/50 text-danger"
            onClick={() => {
              void deleteItems(db, [item.id]).then((removed) => {
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
              onClose();
            }}
          >
            <Trash2 />
            {t.remove}
          </Button>
          <Button className="flex-1" onClick={onClose}>
            {t.done}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
