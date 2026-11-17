import { Link2Off, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { recipePath, routes } from "@/app/routes";
import { categoriesData, keywordRules, unitsData } from "@/data";
import { db } from "@/db/database";
import {
  useArticles,
  useCategories,
  useLists,
  usePurchaseCounts,
  useUnits,
} from "@/db/hooks";
import { applyImport, applyRecipeImport } from "@/db/share";
import type { ID } from "@/domain/model";
import { formatQuantity } from "@/domain/quantity";
import { yieldLabel } from "@/domain/recipes";
import {
  buildImportCatalog,
  defaultChoice,
  defaultOneOff,
  findShared,
  findUnit,
  importAmount,
  importSummary,
  newArticleCategory,
  receivedRecipe,
  resolveImport,
  textImportLines,
  type ImportCatalog,
  type ImportChoice,
  type ImportLine,
  type Shared,
  type SharedRecipe,
  type ShareType,
} from "@/domain/share";
import { feedback } from "@/feedback";
import { lineDetails } from "@/features/list/format";
import { reportSaveError } from "@/features/list/useAddToList";
import { RecipeIcon } from "@/features/recipes/RecipeIcon";
import { fr } from "@/i18n/fr";
import { copyText } from "@/platform/clipboard";
import {
  currentInstallEnvironment,
  detectInstallContext,
} from "@/platform/install";
import { ArticleIcon } from "@/ui/ArticleIcon";
import { Button } from "@/ui/button";
import { Field, Select } from "@/ui/form";
import { MarkdownText } from "@/ui/Markdown";
import { EmptyState, Loading, PageHeader, Section } from "@/ui/Page";
import { PreviewRow } from "@/ui/PreviewRow";
import { showToast } from "@/ui/toast";
import { ImportChoiceSheet } from "./ImportChoiceSheet";

const t = fr.share;

/**
 * D'où vient ce qu'on importe : le lien de la page (déjà relu), ou un texte collé
 * depuis une liste (`expected` : « list ») ou depuis l'onglet Recettes (« recipe »).
 */
type Source =
  | { kind: "link"; shared?: Shared }
  | { kind: "text"; text: string; expected: ShareType; listId?: ID };

type Preview =
  | {
      kind: "lines";
      name: string;
      received: boolean;
      lines: ImportLine[];
      /** Recette reçue : elle sera créée, au lieu d'ajouter des lignes à une liste. */
      recipe?: SharedRecipe;
    }
  | { kind: "broken" }
  | { kind: "failed" }
  | { kind: "empty" }
  /** Collé depuis l'onglet Recettes, sans lien de recette. */
  | { kind: "notRecipe" }
  /** Un lien de l'autre type : une recette collée dans une liste, ou l'inverse. */
  | { kind: "wrongType"; found: ShareType };

const NEW_LIST = "new";

/**
 * Aperçu d'une liste ou d'une recette reçue, ou d'une liste collée (docs/02 § 9,
 * docs/03 E3, F2 et A8) : pour une liste, la liste cible (nouvelle liste ou une liste
 * existante) ; pour une recette, son nom et son rendement. Puis le décompte, les lignes
 * à vérifier puis les lignes reconnues, chacune à cocher ; toucher une ligne choisit son
 * article. Le lien décide de ce qu'on importe ; un texte collé doit contenir un lien du
 * type attendu (sauf une liste en texte, docs/03 A8).
 * Ouvert depuis un lien dans le navigateur de l'iPhone, il explique d'abord comment
 * l'ouvrir dans l'app installée (elle n'a pas les mêmes données).
 */
export function ImportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [source] = useState<Source>(() => {
    const state = location.state as {
      text?: string;
      expected?: ShareType;
      listId?: ID;
    } | null;
    return state?.text === undefined
      ? { kind: "link", shared: findShared(window.location.href) }
      : {
          kind: "text",
          text: state.text,
          expected: state.expected ?? "list",
          listId: state.listId,
        };
  });
  /** Liste ou recette : d'où l'on vient, où l'on revient. */
  const type: ShareType =
    source.kind === "text" ? source.expected : (source.shared?.type ?? "list");
  const isRecipe = type === "recipe";
  const home = isRecipe ? routes.recipes : routes.list;
  const [inBrowser] = useState(
    () =>
      source.kind === "link" &&
      detectInstallContext(currentInstallEnvironment()).kind === "ios",
  );
  const [here, setHere] = useState(false);

  const articles = useArticles();
  const categories = useCategories();
  const units = useUnits();
  const lists = useLists();
  const purchaseCounts = usePurchaseCounts();
  const [catalog, setCatalog] = useState<ImportCatalog | "failed">();
  useEffect(() => {
    // Le catalogue embarqué, chargé à part (comme au premier lancement).
    import("@/data/catalog")
      .then(({ catalogData }) => {
        setCatalog(
          buildImportCatalog({
            articles: catalogData,
            categories: categoriesData,
            units: unitsData,
          }),
        );
      })
      .catch(() => {
        setCatalog("failed");
      });
  }, []);

  const preview = useMemo((): Preview | undefined => {
    if (catalog === "failed") return { kind: "failed" };
    if (!catalog || !articles || !categories || !units || !purchaseCounts)
      return undefined;
    const context = {
      articles,
      categories,
      units,
      purchaseCounts,
      catalog,
      keywordRules,
    };
    const shared =
      source.kind === "text" ? findShared(source.text) : source.shared;
    if (shared) {
      if (source.kind === "text" && shared.type !== source.expected)
        return { kind: "wrongType", found: shared.type };
      const lines = resolveImport(shared, context);
      return shared.type === "recipe"
        ? {
            kind: "lines",
            name: shared.n || t.titleRecipe,
            received: true,
            lines,
            recipe: shared,
          }
        : {
            kind: "lines",
            name: shared.n || t.titleShared,
            received: true,
            lines,
          };
    }
    if (source.kind === "link") return { kind: "broken" };
    if (source.expected === "recipe") return { kind: "notRecipe" };
    const lines = textImportLines(source.text, context);
    return lines.length
      ? { kind: "lines", name: t.pastedListName, received: false, lines }
      : { kind: "empty" };
  }, [source, catalog, articles, categories, units, purchaseCounts]);

  const [choices, setChoices] = useState<ReadonlyMap<number, ImportChoice>>(
    new Map(),
  );
  const [excluded, setExcluded] = useState<ReadonlySet<number>>(new Set());
  const [target, setTarget] = useState(
    source.kind === "text" && source.listId ? source.listId : NEW_LIST,
  );
  const [open, setOpen] = useState<number>();
  const [saving, setSaving] = useState(false);

  const articleById = useMemo(
    () => new Map((articles ?? []).map((article) => [article.id, article])),
    [articles],
  );
  const categoryById = useMemo(
    () =>
      new Map((categories ?? []).map((category) => [category.id, category])),
    [categories],
  );

  if (inBrowser && !here)
    return (
      <EmptyState
        icon={<Smartphone />}
        title={t.browserTitle}
        action={
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                void copyText(Promise.resolve(window.location.href)).then(
                  (copied) => {
                    showToast(
                      copied
                        ? isRecipe
                          ? t.linkCopiedRecipe
                          : t.linkCopied
                        : t.copyError,
                      {
                        tone: copied ? "success" : "error",
                      },
                    );
                  },
                );
              }}
            >
              {t.copyLink}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setHere(true);
              }}
            >
              {isRecipe ? t.importRecipeHere : t.importHere}
            </Button>
          </div>
        }
      >
        {isRecipe ? t.browserRecipeText : t.browserText}
      </EmptyState>
    );

  if (!preview || !lists || !units || !categories || !articles)
    return <Loading>{t.loading}</Loading>;

  if (preview.kind !== "lines") {
    const [title, text] =
      preview.kind === "broken"
        ? [t.brokenTitle, t.broken]
        : preview.kind === "failed"
          ? [t.brokenTitle, t.catalogError]
          : preview.kind === "empty"
            ? [t.titlePasted, t.empty]
            : preview.kind === "notRecipe"
              ? [t.notRecipeTitle, t.notRecipe]
              : preview.found === "recipe"
                ? [t.isRecipeTitle, t.isRecipe]
                : [t.isListTitle, t.isList];
    return (
      <EmptyState
        icon={<Link2Off />}
        title={title}
        action={
          <Button
            variant="outline"
            onClick={() => {
              void navigate(home, { replace: true });
            }}
          >
            {isRecipe ? t.backToRecipes : t.backToList}
          </Button>
        }
      >
        {text}
      </EmptyState>
    );
  }

  const { lines, recipe } = preview;
  /** Choix de la ligne ; un article choisi puis supprimé entre-temps : le choix par défaut. */
  const choiceOf = (index: number, line: ImportLine): ImportChoice => {
    const chosen = choices.get(index);
    return chosen &&
      (chosen.kind !== "use" || articleById.has(chosen.articleId))
      ? chosen
      : defaultChoice(line);
  };

  /**
   * Ce que la ligne deviendra : article, catégorie, détail et quantité ; un ingrédient
   * dit en plus s'il est facultatif ou à quantité fixe.
   */
  const display = (line: ImportLine, choice: ImportChoice) => {
    const shown = outcome(line, choice);
    const detail = [
      shown.detail,
      line.ingredient?.optional ? fr.recipes.optional : undefined,
      line.ingredient?.fixed ? fr.recipes.fixed : undefined,
    ]
      .filter(Boolean)
      .join(" · ");
    return { ...shown, detail: detail || undefined };
  };
  const outcome = (line: ImportLine, choice: ImportChoice) => {
    const { received, match } = line;
    const chosen =
      choice.kind === "use" ? articleById.get(choice.articleId) : undefined;
    const fallback =
      "quantity" in line.amount
        ? formatQuantity(line.amount.quantity, { ...line.amount.unit, id: "" })
        : "";
    if (chosen) {
      const amount = importAmount(line, chosen, units);
      const same = match.kind !== "unknown" && match.articleId === chosen.id;
      return {
        article: chosen,
        category: categoryById.get(chosen.categoryId),
        detail:
          same && match.kind === "known"
            ? lineDetails(line)
            : same
              ? t.toConfirm(received.label)
              : t.received(received.label),
        quantity: amount
          ? formatQuantity(amount.quantity, amount.unit)
          : fallback,
      };
    }
    const name = choice.kind === "create" ? choice.name : received.name;
    const { existing, desc } = newArticleCategory(
      line,
      choice.kind === "create" ? choice.oneOff : defaultOneOff(line),
      categories,
    );
    const category = existing ?? desc;
    const amount = importAmount(
      line,
      {
        defaultUnitId: findUnit(received.unit, units)?.id ?? "",
        defaultQuantity: received.defaultQuantity,
        countable: received.countable,
      },
      units,
    );
    return {
      article: { name, icon: received.icon },
      category,
      detail: t.willCreate(category.name),
      quantity: amount
        ? formatQuantity(amount.quantity, amount.unit)
        : fallback,
    };
  };

  const row = (line: ImportLine, index: number) => {
    const shown = display(line, choiceOf(index, line));
    return (
      <PreviewRow
        key={index}
        checked={!excluded.has(index)}
        onCheckedChange={(checked) => {
          setExcluded((current) => {
            const next = new Set(current);
            if (checked) next.delete(index);
            else next.add(index);
            return next;
          });
        }}
        checkLabel={shown.article.name}
        onOpen={() => {
          setOpen(index);
        }}
        icon={<ArticleIcon article={shown.article} category={shown.category} />}
        title={shown.article.name}
        detail={shown.detail}
        quantity={shown.quantity}
      />
    );
  };

  const toCheck = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.match.kind !== "known");
  const known = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.match.kind === "known");
  const allChecked = toCheck.every(({ index }) => !excluded.has(index));
  const summary = importSummary(lines);
  const count = lines.length - excluded.size;
  const targetList = recipe
    ? undefined
    : lists.find((list) => list.id === target);
  const listName = targetList?.name ?? preview.name;
  const opened = open === undefined ? undefined : lines[open];

  return (
    <>
      <PageHeader
        title={
          recipe
            ? t.titleRecipe
            : preview.received
              ? t.titleShared
              : t.titlePasted
        }
        backTo={home}
      />
      {recipe && (
        <div className="flex items-center gap-4 px-4 pt-1 pb-4">
          <RecipeIcon
            recipe={{ name: preview.name, icon: recipe.ic }}
            size={56}
          />
          <div className="min-w-0">
            <p className="text-lg font-semibold">{preview.name}</p>
            <p className="text-muted-foreground">
              {fr.recipes.serves(yieldLabel(recipe.y.q, recipe.y.u))}
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1 px-5">
        {lines.length > 0 && (
          <p className="font-semibold">
            {t.summary(summary.known, summary.probable, summary.unknown)}
          </p>
        )}
        {toCheck.length > 0 && (
          <p className="text-sm text-muted-foreground">{t.summaryHint}</p>
        )}
        {lines.some((line) => line.outdated) && (
          <p className="text-sm text-muted-foreground">{t.outdated}</p>
        )}
      </div>
      {!recipe && (
        <div className="px-4 pt-4">
          <Field label={t.target}>
            <Select
              value={target}
              onChange={(event) => {
                setTarget(event.target.value);
              }}
            >
              <option value={NEW_LIST}>{t.newList(preview.name)}</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}
      {toCheck.length > 0 && (
        <Section
          title={t.sectionCheck}
          action={
            toCheck.length > 1 && (
              <Button
                variant="link"
                className="px-1"
                onClick={() => {
                  setExcluded((current) => {
                    const next = new Set(current);
                    for (const { index } of toCheck)
                      if (allChecked) next.add(index);
                      else next.delete(index);
                    return next;
                  });
                }}
              >
                {allChecked ? t.uncheckAll : t.checkAll}
              </Button>
            )
          }
        >
          <div className="px-4">
            {toCheck.map(({ line, index }) => row(line, index))}
          </div>
        </Section>
      )}
      {known.length > 0 && (
        <Section title={t.sectionKnown}>
          <div className="px-4">
            {known.map(({ line, index }) => row(line, index))}
          </div>
        </Section>
      )}
      {recipe?.s && (
        <Section title={fr.recipes.steps}>
          <MarkdownText text={recipe.s} className="px-4 py-3" />
        </Section>
      )}
      <div className="px-4 pt-6">
        <Button
          size="lg"
          className="w-full"
          disabled={(count === 0 && !recipe) || saving}
          onClick={() => {
            setSaving(true);
            const chosen = lines.map((line, index) =>
              excluded.has(index)
                ? { kind: "skip" as const }
                : choiceOf(index, line),
            );
            if (recipe) {
              void applyRecipeImport(
                db,
                { ...receivedRecipe(recipe), name: preview.name },
                lines,
                chosen,
              )
                .then((result) => {
                  feedback.add();
                  showToast(t.recipeDone(result.name), { tone: "success" });
                  void navigate(recipePath(result.recipeId), {
                    replace: true,
                  });
                })
                .catch(() => {
                  setSaving(false);
                  reportSaveError();
                });
              return;
            }
            void applyImport(
              db,
              lines,
              chosen,
              targetList
                ? { kind: "list", listId: targetList.id }
                : { kind: "new", name: preview.name },
            )
              .then((result) => {
                feedback.add();
                showToast(t.done(result.count, listName), {
                  tone: "success",
                });
                void navigate(routes.list, { replace: true });
              })
              .catch(() => {
                setSaving(false);
                reportSaveError();
              });
          }}
        >
          {recipe ? t.applyRecipe(count) : t.apply(count)}
        </Button>
      </div>

      {opened && open !== undefined && (
        <ImportChoiceSheet
          key={open}
          line={opened}
          choice={choiceOf(open, opened)}
          quantity={display(opened, choiceOf(open, opened)).quantity}
          articles={articles}
          categories={categories}
          purchaseCounts={purchaseCounts ?? new Map<ID, number>()}
          onChoose={(choice) => {
            setChoices((current) => new Map(current).set(open, choice));
            setExcluded((current) => {
              const next = new Set(current);
              next.delete(open);
              return next;
            });
            setOpen(undefined);
          }}
          onClose={() => {
            setOpen(undefined);
          }}
        />
      )}
    </>
  );
}
