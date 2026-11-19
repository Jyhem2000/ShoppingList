import { useMemo, useState } from "react";
import { db } from "@/db/database";
import { useListItems } from "@/db/hooks";
import { addRecipeToList } from "@/db/recipes";
import type { ID, Recipe } from "@/domain/model";
import { planRecipeAdd, yieldLabel } from "@/domain/recipes";
import { stepCount } from "@/domain/quantity";
import { feedback } from "@/feedback";
import { ingredientDetails, lineDetails, lineQuantity } from "@/common/format";
import type { ListData } from "@/common/useListData";
import { fr } from "@/i18n/fr";
import { ArticleIcon } from "@/ui/ArticleIcon";
import { Button } from "@/ui/button";
import { ChoiceMark, FieldLabel } from "@/ui/form";
import { EmptyHint } from "@/ui/Page";
import { PreviewRow } from "@/ui/PreviewRow";
import { RowButton } from "@/ui/RowButton";
import { Sheet } from "@/ui/Sheet";
import { Stepper, StepperValue } from "@/ui/Stepper";
import { showToast, reportSaveError } from "@/ui/toast";
import { cn } from "@/ui/utils";

const t = fr.recipes;
const a = t.add;

/**
 * « Ajouter à une liste » (docs/03 E2, docs/04 § 2.6) : la liste (choix seulement s'il
 * y en a plusieurs), la quantité dans l'unité de rendement (`− 4 personnes +`), puis
 * l'aperçu des ingrédients recalculés, tous cochés sauf les facultatifs : on décoche ce
 * qu'on a déjà. Rien n'est ajouté avant « Ajouter ».
 */
export function RecipeAddSheet({
  recipe,
  data,
  onClose,
}: {
  recipe: Recipe;
  data: ListData;
  onClose: () => void;
}) {
  const [listId, setListId] = useState<ID>(data.list.id);
  const [requested, setRequested] = useState(recipe.yield.quantity);
  const [overrides, setOverrides] = useState<ReadonlyMap<number, boolean>>(
    new Map(),
  );
  const target = useListItems(listId);
  const list = data.lists.find((l) => l.id === listId) ?? data.list;

  const lines = useMemo(
    () =>
      planRecipeAdd(recipe, requested, target ?? [], data.units).map(
        (line) => ({
          ...line,
          checked: overrides.get(line.index) ?? line.checked,
        }),
      ),
    [recipe, requested, target, data.units, overrides],
  );
  const count = lines.filter((line) => line.checked).length;

  const add = () => {
    addRecipeToList(db, recipe.id, listId, requested, lines).then(
      () => {
        feedback.add();
        showToast(a.done(count, list.name), { tone: "success" });
        onClose();
      },
      () => {
        reportSaveError();
      },
    );
  };

  return (
    <Sheet
      autoFocus={false}
      onClose={() => {
        onClose();
      }}
      title={a.title(recipe.name)}
      description={data.lists.length > 1 ? undefined : a.into(list.name)}
    >
      <div className="flex flex-col gap-5 pb-1">
        {data.lists.length > 1 && (
          <fieldset>
            <FieldLabel as="legend">{a.list}</FieldLabel>
            <ul>
              {data.lists.map((l) => {
                const selected = l.id === listId;
                return (
                  <li key={l.id}>
                    <RowButton
                      inset="sheet"
                      aria-pressed={selected}
                      icon={<ChoiceMark selected={selected} />}
                      onClick={() => {
                        setListId(l.id);
                      }}
                    >
                      <span
                        className={cn(
                          "truncate font-semibold",
                          selected && "text-primary",
                        )}
                      >
                        {l.name}
                      </span>
                    </RowButton>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        )}

        <div>
          <FieldLabel>{a.amount}</FieldLabel>
          <Stepper
            className="justify-center gap-4"
            lessLabel={a.less}
            moreLabel={a.more}
            lessDisabled={stepCount(requested, -1) === undefined}
            onLess={() => {
              setRequested((value) => stepCount(value, -1) ?? value);
            }}
            onMore={() => {
              setRequested((value) => stepCount(value, 1));
            }}
          >
            <StepperValue size="lg">
              {yieldLabel(requested, recipe.yield.unit)}
            </StepperValue>
          </Stepper>
        </div>

        <fieldset>
          <FieldLabel as="legend">{a.ingredients}</FieldLabel>
          {lines.length === 0 ? (
            <EmptyHint>{a.empty}</EmptyHint>
          ) : (
            <>
              <p className="mb-1 text-sm text-muted-foreground">{a.hint}</p>
              {lines.map((line) => {
                const article = data.articleById.get(line.articleId);
                if (!article) return null;
                const existing = line.existing;
                const merge = !existing
                  ? a.isNew
                  : line.result.kind === "note"
                    ? a.note(lineQuantity(existing, data.unitById))
                    : a.merged(
                        lineQuantity(existing, data.unitById),
                        lineQuantity(line.result, data.unitById),
                      );
                return (
                  <PreviewRow
                    key={line.index}
                    checked={line.checked}
                    onCheckedChange={(checked) => {
                      setOverrides((current) =>
                        new Map(current).set(line.index, checked),
                      );
                    }}
                    icon={
                      <ArticleIcon
                        article={article}
                        category={data.categoryById.get(article.categoryId)}
                      />
                    }
                    title={article.name}
                    detail={ingredientDetails(
                      lineDetails(line),
                      { optional: line.optional },
                      merge,
                    )}
                    quantity={lineQuantity(line, data.unitById)}
                  />
                );
              })}
            </>
          )}
        </fieldset>

        <Button disabled={count === 0} onClick={add}>
          {a.apply(count)}
        </Button>
      </div>
    </Sheet>
  );
}
