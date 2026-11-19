import { mergeTypes } from "@/domain/slug";
import { addArticleType } from "@/db/catalog";
import { db } from "@/db/database";
import {
  removeIngredient,
  stepIngredient,
  updateIngredient,
} from "@/db/recipes";
import type { ID, Recipe } from "@/domain/model";
import type { ListData } from "@/common/useListData";
import { fr } from "@/i18n/fr";
import { AmountFields } from "@/ui/AmountFields";
import { CheckOption, RemoveDoneActions } from "@/ui/form";
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
      autoFocus={false}
      onClose={() => {
        onClose();
      }}
      title={article.name}
    >
      <div className="flex flex-col gap-5 pb-1">
        <AmountFields
          units={data.units}
          quantity={ingredient.quantity}
          unit={unit}
          kitchen
          stepping={{ home: data.unitById.get(article.defaultUnitId) }}
          onQuantity={(quantity) => {
            update({ quantity });
          }}
          onStep={(direction) => {
            void stepIngredient(db, recipeId, index, direction);
          }}
          onUnit={update}
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
                acceptedTypes: mergeTypes(ingredient.acceptedTypes, [type]),
              });
            });
          }}
        />

        <div>
          <CheckOption
            checked={ingredient.optional}
            onCheckedChange={(optional) => {
              update({ optional });
            }}
            title={t.optional}
            hint={t.optionalHint}
          />
          <CheckOption
            checked={ingredient.fixed}
            onCheckedChange={(fixed) => {
              update({ fixed });
            }}
            title={t.fixed}
            hint={t.fixedHint}
          />
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
