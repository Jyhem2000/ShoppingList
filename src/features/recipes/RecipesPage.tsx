import { ChefHat, ClipboardPaste, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { recipePath, routes } from "@/app/routes";
import { db } from "@/db/database";
import { useRecipes } from "@/db/hooks";
import { createRecipe, DEFAULT_YIELD } from "@/db/recipes";
import { yieldLabel } from "@/domain/recipes";
import { searchKey } from "@/domain/slug";
import { reportSaveError } from "@/features/list/useAddToList";
import { PasteForm } from "@/features/share/PasteForm";
import { fr } from "@/i18n/fr";
import { pasteText } from "@/platform/clipboard";
import { Button } from "@/ui/button";
import { Field, TextInput } from "@/ui/form";
import { EmptyHint, EmptyState, PageHeader, Section } from "@/ui/Page";
import { RowButton } from "@/ui/RowButton";
import { SearchField } from "@/ui/SearchField";
import { Sheet } from "@/ui/Sheet";
import { RecipeIcon } from "./RecipeIcon";
import { YieldFields } from "./YieldFields";

const t = fr.recipes;

/**
 * Onglet Recettes (docs/04 § 2.6) : les recettes (icône, nom, rendement), une recherche,
 * « Nouvelle recette » et « Coller une recette » (docs/03 E3 : lit le presse-papiers ;
 * s'il est refusé, un champ où coller à la main).
 */
export function RecipesPage() {
  const navigate = useNavigate();
  const recipes = useRecipes();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [pasting, setPasting] = useState(false);
  const paste = (text: string) => {
    void navigate(routes.import, { state: { text, expected: "recipe" } });
  };

  const shown = useMemo(() => {
    const key = searchKey(query);
    return (recipes ?? []).filter(
      (recipe) => !key || searchKey(recipe.name).includes(key),
    );
  }, [recipes, query]);

  const actions = (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setCreating(true);
        }}
      >
        <Plus />
        {t.create}
      </Button>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          // Lu pendant le toucher (iPhone : bulle « Coller » à confirmer).
          void pasteText().then((text) => {
            if (text?.trim()) paste(text);
            else setPasting(true);
          });
        }}
      >
        <ClipboardPaste />
        {fr.share.pasteRecipe}
      </Button>
    </div>
  );

  return (
    <>
      <PageHeader title={t.title} />
      {recipes?.length === 0 ? (
        <EmptyState icon={<ChefHat />} title={t.emptyTitle} action={actions}>
          {t.emptyText}
        </EmptyState>
      ) : (
        recipes && (
          <>
            <div className="flex flex-col gap-3 px-4 pb-1">
              <SearchField
                label={t.search}
                value={query}
                onValueChange={setQuery}
              />
              {actions}
            </div>
            <Section title={t.count(shown.length)} className="pb-6">
              {shown.length === 0 ? (
                <EmptyHint inset>{t.noResult}</EmptyHint>
              ) : (
                <ul className="divide-y divide-border/50">
                  {shown.map((recipe) => (
                    <li key={recipe.id}>
                      <RowButton
                        to={recipePath(recipe.id)}
                        icon={<RecipeIcon recipe={recipe} />}
                        title={recipe.name}
                        detail={yieldLabel(
                          recipe.yield.quantity,
                          recipe.yield.unit,
                        )}
                        chevron
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </>
        )
      )}
      {pasting && (
        <Sheet
          open
          onOpenChange={(open) => {
            if (!open) setPasting(false);
          }}
          title={fr.share.pasteRecipe}
          description={fr.share.pasteRecipeText}
        >
          <PasteForm
            label={fr.share.pasteRecipe}
            placeholder={fr.share.pasteRecipePlaceholder}
            onPaste={paste}
          />
        </Sheet>
      )}
      {creating && (
        <NewRecipeSheet
          initialName={query}
          onClose={() => {
            setCreating(false);
          }}
        />
      )}
    </>
  );
}

/** Nom et rendement, puis la fiche s'ouvre en modification pour les ingrédients. */
function NewRecipeSheet({
  initialName,
  onClose,
}: {
  initialName: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [name, setName] = useState(initialName.trim());
  const [recipeYield, setRecipeYield] = useState(DEFAULT_YIELD);

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t.newTitle}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          createRecipe(db, {
            name,
            yield: {
              quantity: recipeYield.quantity,
              unit: recipeYield.unit.trim() || DEFAULT_YIELD.unit,
            },
            ingredients: [],
          }).then(
            (id) => {
              onClose();
              void navigate(recipePath(id, true));
            },
            () => {
              reportSaveError();
            },
          );
        }}
      >
        <Field label={t.name}>
          <TextInput
            value={name}
            placeholder={t.namePlaceholder}
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        </Field>
        <YieldFields value={recipeYield} onChange={setRecipeYield} />
        <Button type="submit" disabled={!name.trim()}>
          {t.createSubmit}
        </Button>
      </form>
    </Sheet>
  );
}
