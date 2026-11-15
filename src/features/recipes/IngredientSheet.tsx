import { addArticleType } from "@/db/catalog";
import { db } from "@/db/database";
import { removeIngredient, updateIngredient } from "@/db/recipes";
import type { ID, Recipe } from "@/domain/model";
import { changeUnit } from "@/domain/quantity";
import type { ListData } from "@/features/list/useListData";
import { fr } from "@/i18n/fr";
import { AmountFields } from "@/ui/AmountFields";
import { CheckRow, RemoveDoneActions } from "@/ui/form";
import { RowText } from "@/ui/RowButton";
import { Sheet } from "@/ui/Sheet";
import { TypesPicker } from "@/ui/TypesPicker";

const t = fr.recipes.ingredient;

/**
 * Fiche d'un ingrédient (docs/03 E1) : quantité et unité (unités de cuisine comprises),
 * sortes acceptées, « facultatif » et « quantité fixe ». Chaque changement est
 * enregistré tout de suite.
 */
export function IngredientSheet({
  recipeId,
  index,
  ingredient,
  data,
  onClose,
}: {
  recipeId: ID;
  index: number;
  ingredient: Recipe["ingredients"][number];
  data: ListData;
  onClose: () => void;
}) {
  const article = data.articleById.get(ingredient.articleId);
  const unit = data.unitById.get(ingredient.unitId);
  if (!article || !unit) return null;

  const update = (changes: Partial<Recipe["ingredients"][number]>) => {
    void updateIngredient(db, recipeId, index, changes);
  };

  return (
    <Sheet
      open
      autoFocus={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={article.name}
    >
      <div className="flex flex-col gap-5 pb-1">
        <AmountFields
          units={data.units}
          quantity={ingredient.quantity}
          unit={unit}
          kitchen
          onQuantity={(quantity) => {
            update({ quantity });
          }}
          onUnit={(unitId) => {
            const next = data.unitById.get(unitId);
            if (!next || next.id === unit.id) return;
            update({
              unitId: next.id,
              quantity: changeUnit(ingredient.quantity, unit, next),
            });
          }}
        />

        <TypesPicker
          types={article.types}
          accepted={ingredient.acceptedTypes}
          onChange={(acceptedTypes) => {
            update({ acceptedTypes });
          }}
          onAddType={(type) => {
            void addArticleType(db, article.id, type).then(() => {
              update({
                acceptedTypes: [
                  ...new Set([...ingredient.acceptedTypes, type]),
                ],
              });
            });
          }}
        />

        <div>
          <CheckRow
            checked={ingredient.optional}
            onCheckedChange={(optional) => {
              update({ optional });
            }}
          >
            <RowText title={t.optional} detail={t.optionalHint} wrap />
          </CheckRow>
          <CheckRow
            checked={ingredient.fixed}
            onCheckedChange={(fixed) => {
              update({ fixed });
            }}
          >
            <RowText title={t.fixed} detail={t.fixedHint} wrap />
          </CheckRow>
        </div>

        <RemoveDoneActions
          removeLabel={t.remove}
          doneLabel={t.done}
          onRemove={() => {
            void removeIngredient(db, recipeId, index);
            onClose();
          }}
          onDone={onClose}
        />
      </div>
    </Sheet>
  );
}
