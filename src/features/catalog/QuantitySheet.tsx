import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { db } from "@/db/database";
import { deleteItems, restoreItems, stepItem } from "@/db/lists";
import { otherTypes, typesKey } from "@/domain/lines";
import type { Article, ListItem, Unit } from "@/domain/model";
import { stepAmount } from "@/domain/quantity";
import { feedback } from "@/feedback";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { OtherTypes } from "@/ui/OtherTypes";
import { Sheet } from "@/ui/Sheet";
import { Stepper, StepperValue } from "@/ui/Stepper";
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
 * Il se ferme quand l'article n'a plus de ligne. `actions` : boutons propres à l'écran
 * appelant (en courses : « Pas pris », « Changer de rayon », équivalents des gestes).
 */
export function QuantitySheet({
  article,
  data,
  onClose,
  onAddType,
  actions,
}: {
  article: Article;
  data: ListData;
  onClose: () => void;
  onAddType: (type: string) => void;
  actions?: ReactNode;
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
              home={data.unitById.get(article.defaultUnitId)}
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
        {actions}
        <Button onClick={onClose}>{t.done}</Button>
      </div>
    </Sheet>
  );
}

function QuantityRow({
  line,
  data,
  home,
  label,
  onRemove,
}: {
  line: ListItem;
  data: ListData;
  home?: Unit;
  label?: string;
  onRemove: () => void;
}) {
  const unit = data.unitById.get(line.unitId);
  if (!unit) return null;
  // Le pas suit l'unité, qui change au besoin : 950 g → 1 kg → 1,5 kg (docs/02 § 5).
  const amount = { quantity: line.quantity, unit };
  const less = stepAmount(amount, -1, data.units, { home });
  const set = (direction: 1 | -1) => {
    void stepItem(db, line.id, direction);
  };
  return (
    <li className="flex items-center gap-2">
      {label && (
        <span className="min-w-0 flex-1 truncate font-semibold">{label}</span>
      )}
      <Stepper
        className={label ? undefined : "flex-1 justify-center gap-4"}
        lessDisabled={!less}
        onLess={() => {
          set(-1);
        }}
        onMore={() => {
          set(1);
        }}
      >
        <StepperValue size={label ? "md" : "lg"}>
          {lineQuantity(line, data.unitById)}
        </StepperValue>
      </Stepper>
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
