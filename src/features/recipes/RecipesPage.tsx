import { ChefHat, ClipboardPaste, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { recipePath, routes } from "@/app/routes";
import { db } from "@/db/database";
import { useRecipes } from "@/db/hooks";
import { createRecipe, DEFAULT_YIELD } from "@/db/recipes";
import { yieldLabel } from "@/domain/recipes";
import { searchKey } from "@/domain/slug";
import { PasteForm } from "@/common/PasteForm";
import { fr } from "@/i18n/fr";
import { reportSaveError } from "@/ui/toast";
import { pasteOrAsk } from "@/common/paste";
import { AddButton } from "@/ui/AddButton";
import { Button } from "@/ui/button";
import { Field, MenuItem, TextInput } from "@/ui/form";
import { MenuButton } from "@/ui/MenuButton";
import { EmptyHint, EmptyState, PageHeader, Section } from "@/ui/Page";
import { RowButton } from "@/ui/RowButton";
import { SearchField } from "@/ui/SearchField";
import { Sheet } from "@/ui/Sheet";
import { RecipeIcon } from "@/common/RecipeIcon";
import { YieldFields } from "./YieldFields";

const t = fr.recipes;

/**
 * Onglet Recettes (docs/04 § 2.6) : les recettes (icône, nom, rendement), une recherche,
 * et le menu ⋯ : « Nouvelle recette » et « Coller une recette » (docs/03 E3 : lit le
 * presse-papiers ; s'il est refusé, un champ où coller à la main). Sans recette, les deux
 * actions sont aussi des boutons de l'écran vide.
 */
export function RecipesPage() {
  const navigate = useNavigate();
  const recipes = useRecipes();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  /**
   * Menu ⋯ ouvert ; « coller à la main » depuis le menu (retour possible) ou depuis le
   * bouton de l'écran vide.
   */
  const [menu, setMenu] = useState<"menu" | "menu-paste" | "paste">();
  const paste = (text: string) => {
    void navigate(routes.import, { state: { text, expected: "recipe" } });
  };

  const shown = useMemo(() => {
    const key = searchKey(query);
    return (recipes ?? []).filter(
      (recipe) => !key || searchKey(recipe.name).includes(key),
    );
  }, [recipes, query]);

  const create = () => {
    setMenu(undefined);
    setCreating(true);
  };
  const askPaste = (fromMenu: boolean) => {
    pasteOrAsk(paste, () => {
      setMenu(fromMenu ? "menu-paste" : "paste");
    });
  };

  const actions = (
    <div className="flex flex-col gap-3">
      <AddButton label={t.create} onClick={create} />
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          askPaste(false);
        }}
      >
        <ClipboardPaste />
        {fr.share.pasteRecipe}
      </Button>
    </div>
  );

  return (
    <>
      <PageHeader
        title={t.title}
        action={
          <MenuButton
            label={t.menu}
            onClick={() => {
              setMenu("menu");
            }}
          />
        }
      />
      {recipes?.length === 0 ? (
        <EmptyState icon={<ChefHat />} title={t.emptyTitle} action={actions}>
          {t.emptyText}
        </EmptyState>
      ) : (
        recipes && (
          <>
            <div className="px-4 pb-1">
              <SearchField
                label={t.search}
                value={query}
                onValueChange={setQuery}
              />
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
      {menu && (
        <Sheet
          onClose={() => {
            setMenu(undefined);
          }}
          onBack={
            menu === "menu-paste"
              ? () => {
                  setMenu("menu");
                }
              : undefined
          }
          title={menu === "menu" ? t.title : fr.share.pasteRecipe}
          description={
            menu === "menu" ? t.menuDescription : fr.share.pasteRecipeText
          }
        >
          {menu === "menu" ? (
            <div className="flex flex-col">
              <MenuItem icon={<Plus />} onClick={create}>
                {t.create}
              </MenuItem>
              <MenuItem
                icon={<ClipboardPaste />}
                onClick={() => {
                  askPaste(true);
                }}
              >
                {fr.share.pasteRecipe}
              </MenuItem>
            </div>
          ) : (
            <PasteForm
              label={fr.share.pasteRecipe}
              placeholder={fr.share.pasteRecipePlaceholder}
              onPaste={paste}
            />
          )}
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
      onClose={() => {
        onClose();
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
