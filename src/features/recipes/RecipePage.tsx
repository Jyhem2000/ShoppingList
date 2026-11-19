import { Copy, ListPlus, Pencil, Share, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { recipePath, routes } from "@/app/routes";
import { useWakeLock } from "@/app/useWakeLock";
import { db } from "@/db/database";
import { useRecipe } from "@/db/hooks";
import {
  addIngredient,
  deleteRecipe,
  duplicateRecipe,
  updateRecipe,
} from "@/db/recipes";
import { entryAmount, type ParsedEntry } from "@/domain/entry";
import type { Article, Recipe } from "@/domain/model";
import { feedback } from "@/feedback";
import { AddArticleBar } from "@/common/AddArticleBar";
import { CreateArticleSheet } from "@/common/CreateArticleSheet";
import { ingredientDetails, lineDetails, lineQuantity } from "@/common/format";
import { recipeMessage, sendMessage } from "@/common/shareMessage";
import { useEntryAdder } from "@/common/useEntryAdder";
import { type ListData, useListData } from "@/common/useListData";
import { IconPickerSheet } from "@/common/IconPickerSheet";
import { NameField } from "@/common/NameField";
import { fr } from "@/i18n/fr";
import { RECIPE_ICON_CATEGORIES } from "@/icons/pack";
import { ArticleIcon } from "@/ui/ArticleIcon";
import { Button } from "@/ui/button";
import { ConfirmActions, Field, TextInput } from "@/ui/form";
import { IconChangeButton } from "@/ui/IconChangeButton";
import { MarkdownField, MarkdownText } from "@/ui/Markdown";
import { useGoBack } from "@/ui/navigation";
import { EmptyHint, EmptyState, PageHeader, Section } from "@/ui/Page";
import { QuantityText } from "@/ui/PreviewRow";
import { InfoRow, RowButton } from "@/ui/RowButton";
import { Sheet } from "@/ui/Sheet";
import { showToast, reportSaveError } from "@/ui/toast";
import { IngredientSheet } from "./IngredientSheet";
import { RecipeAddSheet } from "./RecipeAddSheet";
import { RecipeHeader } from "@/common/RecipeHeader";
import { RECIPE_COLOR } from "@/common/RecipeIcon";
import { usePendingSave } from "@/ui/usePendingSave";
import { YieldFields } from "./YieldFields";

const t = fr.recipes;
/** Paramètre d'adresse de la fiche ouverte en modification. */
const EDIT = "modifier";

type Panel =
  | { kind: "add" }
  | { kind: "icon" }
  | { kind: "duplicate" }
  | { kind: "delete" }
  | { kind: "ingredient"; index: number };

/**
 * Fiche recette (docs/04 § 2.6) : en lecture, le rendement fixe, les ingrédients, les
 * étapes, puis « Ajouter à une liste » en bas ; « Modifier » ouvre l'édition sur la même fiche
 * (nom, rendement, icône, ingrédients par la barre d'ajout, étapes). Dupliquer (sous un
 * nom demandé tout de suite), partager (docs/03 E3) et supprimer en bas.
 */
export function RecipePage() {
  const { recipeId } = useParams();
  const recipe = useRecipe(recipeId);
  const data = useListData();

  if (recipe === null)
    return (
      <>
        <PageHeader title={t.title} backTo={routes.recipes} />
        <EmptyState icon={<X />} title={t.missing} />
      </>
    );
  if (!recipe || !data) return null;
  return <RecipeView key={recipe.id} recipe={recipe} data={data} />;
}

function RecipeView({ recipe, data }: { recipe: Recipe; data: ListData }) {
  const navigate = useNavigate();
  const goBack = useGoBack(routes.recipes);
  const [params, setParams] = useSearchParams();
  const editing = params.has(EDIT);
  const [panel, setPanel] = useState<Panel | null>(null);
  // On cuisine la recette sous les yeux : l'écran reste allumé (réglage Écran allumé).
  useWakeLock();
  const close = () => {
    setPanel(null);
  };

  const setEditing = (on: boolean) => {
    setParams(on ? { [EDIT]: "" } : {}, { replace: true });
  };
  const save = (changes: Partial<Recipe>) => {
    updateRecipe(db, recipe.id, changes).catch(reportSaveError);
  };

  const ingredient = (item: Recipe["ingredients"][number], index: number) => {
    const article = data.articleById.get(item.articleId);
    if (!article) return null;
    const props = {
      icon: (
        <ArticleIcon
          article={article}
          category={data.categoryById.get(article.categoryId)}
        />
      ),
      title: article.name,
      detail: ingredientDetails(lineDetails(item), item),
      trailing: (
        <QuantityText>{lineQuantity(item, data.unitById)}</QuantityText>
      ),
    };
    return (
      // Deux ingrédients peuvent porter le même article : le rang les distingue.
      <li key={index}>
        {editing ? (
          <RowButton
            {...props}
            onClick={() => {
              setPanel({ kind: "ingredient", index });
            }}
          />
        ) : (
          <InfoRow {...props} />
        )}
      </li>
    );
  };

  const panelIngredient =
    panel?.kind === "ingredient" ? recipe.ingredients[panel.index] : undefined;

  return (
    <>
      <PageHeader
        title={recipe.name}
        backTo={routes.recipes}
        action={
          editing ? (
            <Button
              size="sm"
              onClick={() => {
                setEditing(false);
              }}
            >
              {t.editDone}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(true);
              }}
            >
              <Pencil />
              {t.edit}
            </Button>
          )
        }
      />

      {editing ? (
        <>
          <div className="px-4 pt-2 pb-2">
            <IconChangeButton
              icon={recipe.icon}
              label={recipe.name}
              color={RECIPE_COLOR}
              onClick={() => {
                setPanel({ kind: "icon" });
              }}
            />
          </div>
          <Section>
            <div className="flex flex-col gap-4 px-4 py-4">
              <NameField
                key={recipe.name}
                label={t.name}
                value={recipe.name}
                onSave={(name) => {
                  save({ name });
                }}
              />
              <YieldEditor recipe={recipe} onSave={save} />
            </div>
          </Section>
        </>
      ) : (
        <RecipeHeader recipe={recipe} />
      )}

      <Section title={t.ingredients}>
        {recipe.ingredients.length === 0 ? (
          <EmptyHint inset>
            {editing ? t.noIngredientsEdit : t.noIngredients}
          </EmptyHint>
        ) : (
          <ul className="divide-y divide-border/50">
            {recipe.ingredients.map(ingredient)}
          </ul>
        )}
      </Section>

      <Section title={t.steps}>
        {editing ? (
          <div className="p-4">
            <StepsEditor recipe={recipe} onSave={save} />
          </div>
        ) : recipe.steps?.trim() ? (
          <MarkdownText text={recipe.steps} className="px-4 py-3" />
        ) : (
          <EmptyHint inset>{t.noSteps}</EmptyHint>
        )}
      </Section>

      <div className="flex flex-col gap-3 px-4 pt-6 pb-8">
        {!editing && (
          <Button
            size="lg"
            disabled={recipe.ingredients.length === 0}
            onClick={() => {
              setPanel({ kind: "add" });
            }}
          >
            <ListPlus />
            {t.addToList}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => {
            void sendMessage(
              recipeMessage(recipe, data),
              fr.share.recipeCopied,
            );
          }}
        >
          <Share />
          {fr.share.sendRecipe}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setPanel({ kind: "duplicate" });
          }}
        >
          <Copy />
          {t.duplicate}
        </Button>
        <Button
          variant="dangerOutline"
          onClick={() => {
            setPanel({ kind: "delete" });
          }}
        >
          <Trash2 />
          {t.delete}
        </Button>
      </div>

      {editing && (
        <>
          {/* Place pour la barre d'ajout flottante. */}
          <div aria-hidden className="h-24" />
          <IngredientBar recipe={recipe} data={data} />
        </>
      )}

      {panel?.kind === "add" && (
        <RecipeAddSheet recipe={recipe} data={data} onClose={close} />
      )}
      {panel?.kind === "icon" && (
        <IconPickerSheet
          label={recipe.name}
          color={RECIPE_COLOR}
          value={recipe.icon}
          featuredCategories={RECIPE_ICON_CATEGORIES}
          onPick={(icon) => {
            save({ icon });
          }}
          onClose={close}
        />
      )}
      {panel?.kind === "ingredient" && panelIngredient && (
        <IngredientSheet
          key={panel.index}
          recipeId={recipe.id}
          index={panel.index}
          ingredient={panelIngredient}
          data={data}
          onClose={close}
        />
      )}
      {panel?.kind === "duplicate" && (
        <DuplicateSheet
          recipe={recipe}
          onClose={close}
          onDone={(id) => {
            close();
            // La copie remplace l'originale dans l'historique : le retour mène à
            // l'écran d'où l'on venait (les recettes), pas à l'originale.
            void navigate(recipePath(id), { replace: true });
          }}
        />
      )}
      {panel?.kind === "delete" && (
        <Sheet
          autoFocus={false}
          onClose={() => {
            close();
          }}
          title={t.deleteTitle(recipe.name)}
          description={t.deleteText}
        >
          <ConfirmActions
            label={t.delete}
            onConfirm={() => {
              deleteRecipe(db, recipe.id).then(() => {
                feedback.remove();
                showToast(t.deleted(recipe.name), { tone: "success" });
                goBack();
              }, reportSaveError);
            }}
            onCancel={close}
          />
        </Sheet>
      )}
    </>
  );
}

/** Rendement en cours de saisie, enregistré à chaque changement valide. */
function YieldEditor({
  recipe,
  onSave,
}: {
  recipe: Recipe;
  onSave: (changes: Partial<Recipe>) => void;
}) {
  const [value, setValue] = useState(recipe.yield);
  return (
    <YieldFields
      value={value}
      onChange={(next) => {
        setValue(next);
        if (next.unit.trim())
          onSave({
            yield: { quantity: next.quantity, unit: next.unit.trim() },
          });
      }}
    />
  );
}

/** Étapes mises en forme (Markdown), enregistrées en quittant le champ. */
function StepsEditor({
  recipe,
  onSave,
}: {
  recipe: Recipe;
  onSave: (changes: Partial<Recipe>) => void;
}) {
  const [steps, setSteps] = useState(recipe.steps ?? "");
  const { edited, commit } = usePendingSave(() => {
    const clean = steps.trim();
    if (clean !== (recipe.steps ?? "")) onSave({ steps: clean || undefined });
  });
  return (
    <MarkdownField
      aria-label={t.steps}
      value={steps}
      placeholder={t.stepsPlaceholder}
      className="min-h-56"
      onValueChange={(value) => {
        setSteps(value);
        edited();
      }}
      onBlur={() => void commit()}
    />
  );
}

/**
 * Barre d'ajout des ingrédients (docs/03 E1) : saisie naturelle (« 200 g de farine,
 * 3 œufs »), suggestions, création d'un article inconnu. La quantité est gardée telle
 * qu'écrite (pas de simplification : c'est celle de la recette).
 */
const keepEntry = (entry: ParsedEntry) => entry;

function IngredientBar({ recipe, data }: { recipe: Recipe; data: ListData }) {
  const add = async (
    article: Article,
    entry: ParsedEntry = { text: article.name },
    acceptedTypes: string[] = [],
  ): Promise<undefined> => {
    const amount = entryAmount(entry, article, data.units, false);
    if (!amount) return undefined;
    await addIngredient(db, recipe.id, {
      articleId: article.id,
      quantity: amount.quantity,
      unitId: amount.unit.id,
      acceptedTypes,
      optional: false,
      fixed: false,
    });
    feedback.add();
    return undefined;
  };

  const { submit, enqueue, pending, next } = useEntryAdder(
    data,
    add,
    keepEntry,
    { recipe: true },
  );

  return (
    <>
      <AddArticleBar
        data={data}
        placeholder={t.addPlaceholder}
        addLabel={t.addLabel}
        showInList={false}
        recipe
        onSubmit={(text) => {
          void submit(text);
        }}
        onPick={(article, entry, types) => {
          add(article, entry, types).catch(reportSaveError);
        }}
        onCreate={(entry) => {
          enqueue(entry);
        }}
      />
      {pending && (
        <CreateArticleSheet
          key={pending.text}
          entry={pending}
          data={data}
          onCancel={next}
          onCreated={(article) => {
            next();
            add(article, pending).catch(reportSaveError);
          }}
        />
      )}
    </>
  );
}

/** Nom de la copie, demandé avant de la créer ; la copie s'ouvre ensuite. */
function DuplicateSheet({
  recipe,
  onClose,
  onDone,
}: {
  recipe: Recipe;
  onClose: () => void;
  onDone: (id: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <Sheet
      onClose={() => {
        onClose();
      }}
      title={t.duplicateTitle(recipe.name)}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const copyName = name.trim();
          if (!copyName) return;
          duplicateRecipe(db, recipe.id, copyName).then((id) => {
            if (!id) return;
            showToast(t.duplicated(copyName), { tone: "success" });
            onDone(id);
          }, reportSaveError);
        }}
      >
        <Field label={t.duplicateName}>
          <TextInput
            autoFocus
            value={name}
            placeholder={recipe.name}
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        </Field>
        <Button type="submit" disabled={!name.trim()}>
          <Copy />
          {t.duplicateSubmit}
        </Button>
      </form>
    </Sheet>
  );
}
