import { db } from "@/db/database";
import { updateItem } from "@/db/lists";
import { formatQuantity, mergeQuantity } from "@/domain/quantity";
import { feedback } from "@/feedback";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { Sheet } from "@/ui/Sheet";
import { lineQuantity } from "./format";
import type { PendingAdd } from "./useAddToList";
import type { ListData } from "./useListData";

const t = fr.list.exists;

/**
 * Article déjà dans la liste (docs/03 A3) : rien n'est modifié d'office. « Ne rien
 * faire » est le choix par défaut (Entrée ou fermer).
 */
export function ExistsSheet({
  pending,
  data,
  onDone,
}: {
  pending: Extract<PendingAdd, { kind: "exists" }>;
  data: ListData;
  onDone: () => void;
}) {
  const { item, article, amount } = pending;
  const existingUnit = data.unitById.get(item.unitId);
  const merged = existingUnit
    ? mergeQuantity(
        { quantity: item.quantity, unit: existingUnit },
        amount,
        data.units,
      )
    : { kind: "incompatible" as const };
  const existing = lineQuantity(item, data.unitById, "long");
  const added = formatQuantity(amount.quantity, amount.unit, "long");

  const apply = async (
    changes: Parameters<typeof updateItem>[2],
  ): Promise<void> => {
    await updateItem(db, item.id, changes);
    feedback.add();
    onDone();
  };

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onDone();
      }}
      title={article.name}
      description={
        merged.kind === "merged"
          ? t.text(existing)
          : t.incompatible(existing, added)
      }
    >
      <div className="flex flex-col gap-2">
        {merged.kind === "merged" ? (
          <Button
            variant="outline"
            onClick={() =>
              void apply({ quantity: merged.quantity, unitId: merged.unit.id })
            }
          >
            {t.add(added)}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() =>
                void apply({
                  quantity: amount.quantity,
                  unitId: amount.unit.id,
                })
              }
            >
              {t.replace(added)}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                void apply({
                  note: [item.note, `+ ${added}`].filter(Boolean).join(" · "),
                })
              }
            >
              {t.asNote}
            </Button>
          </>
        )}
        <Button autoFocus onClick={onDone}>
          {merged.kind === "merged" ? t.nothing : t.keep}
        </Button>
      </div>
    </Sheet>
  );
}
