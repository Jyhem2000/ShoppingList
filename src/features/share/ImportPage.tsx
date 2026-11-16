import { Link2Off, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { routes } from "@/app/routes";
import { categoriesData, keywordRules, unitsData } from "@/data";
import { db } from "@/db/database";
import {
  useArticles,
  useCategories,
  useLists,
  usePurchaseCounts,
  useUnits,
} from "@/db/hooks";
import { applyImport } from "@/db/share";
import type { ID } from "@/domain/model";
import { formatQuantity } from "@/domain/quantity";
import {
  buildImportCatalog,
  defaultChoice,
  findCategory,
  findSharedList,
  findUnit,
  importAmount,
  importSummary,
  resolveImport,
  textImportLines,
  type ImportCatalog,
  type ImportChoice,
  type ImportLine,
} from "@/domain/share";
import { feedback } from "@/feedback";
import { lineDetails } from "@/features/list/format";
import { reportSaveError } from "@/features/list/useAddToList";
import { fr } from "@/i18n/fr";
import { copyText } from "@/platform/clipboard";
import {
  currentInstallEnvironment,
  detectInstallContext,
} from "@/platform/install";
import { ArticleIcon } from "@/ui/ArticleIcon";
import { Button } from "@/ui/button";
import { Field, Select } from "@/ui/form";
import { EmptyState, Loading, PageHeader, Section } from "@/ui/Page";
import { PreviewRow } from "@/ui/PreviewRow";
import { showToast } from "@/ui/toast";
import { ImportChoiceSheet } from "./ImportChoiceSheet";

const t = fr.share;

/** D'où vient la liste : le lien de la page, ou un texte collé dans l'app. */
type Source = { kind: "link" } | { kind: "text"; text: string; listId?: ID };

type Preview =
  | { kind: "lines"; name: string; received: boolean; lines: ImportLine[] }
  | { kind: "broken" }
  | { kind: "empty" };

const NEW_LIST = "new";

/**
 * Aperçu d'une liste reçue ou collée (docs/02 § 9, docs/03 F2 et A8) : la liste cible
 * (nouvelle liste ou une liste existante), le décompte, les lignes à vérifier puis les
 * lignes reconnues, chacune à cocher ; toucher une ligne choisit son article.
 * Ouvert depuis un lien dans le navigateur de l'iPhone, il explique d'abord comment
 * l'ouvrir dans l'app installée (elle n'a pas les mêmes données).
 */
export function ImportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [source] = useState<Source>(() => {
    const state = location.state as { text?: string; listId?: ID } | null;
    return state?.text === undefined
      ? { kind: "link" }
      : { kind: "text", text: state.text, listId: state.listId };
  });
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
  const [catalog, setCatalog] = useState<ImportCatalog>();
  useEffect(() => {
    // Le catalogue embarqué, chargé à part (comme au premier lancement).
    void import("@/data/catalog").then(({ catalogData }) => {
      setCatalog(
        buildImportCatalog({
          articles: catalogData,
          categories: categoriesData,
          units: unitsData,
        }),
      );
    });
  }, []);

  const preview = useMemo((): Preview | undefined => {
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
    const shared = findSharedList(
      source.kind === "text" ? source.text : window.location.href,
    );
    if (shared)
      return {
        kind: "lines",
        name: shared.n,
        received: true,
        lines: resolveImport(shared, context),
      };
    if (source.kind === "link") return { kind: "broken" };
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
                    showToast(copied ? t.linkCopied : t.copyError, {
                      tone: copied ? "success" : "error",
                    });
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
              {t.importHere}
            </Button>
          </div>
        }
      >
        {t.browserText}
      </EmptyState>
    );

  if (!preview || !lists || !units || !categories || !articles)
    return <Loading>{t.loading}</Loading>;

  const backToList = (
    <Button
      variant="outline"
      onClick={() => {
        void navigate(routes.list, { replace: true });
      }}
    >
      {t.backToList}
    </Button>
  );
  if (preview.kind !== "lines")
    return (
      <EmptyState
        icon={<Link2Off />}
        title={preview.kind === "broken" ? t.brokenTitle : t.titlePasted}
        action={backToList}
      >
        {preview.kind === "broken" ? t.broken : t.empty}
      </EmptyState>
    );

  const { lines } = preview;
  const choiceOf = (index: number, line: ImportLine) =>
    choices.get(index) ?? defaultChoice(line);

  /** Ce que la ligne deviendra : article, catégorie, détail et quantité. */
  const display = (line: ImportLine, choice: ImportChoice) => {
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
    const category = findCategory(received.category, categories);
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
      category: category ?? received.category,
      detail: t.willCreate(category?.name ?? received.category.name),
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
  const summary = importSummary(lines);
  const count = lines.length - excluded.size;
  const targetList = lists.find((list) => list.id === target);
  const listName = targetList?.name ?? preview.name;
  const opened = open === undefined ? undefined : lines[open];

  return (
    <>
      <PageHeader
        title={preview.received ? t.titleShared : t.titlePasted}
        backTo={routes.list}
      />
      <div className="flex flex-col gap-1 px-5">
        <p className="font-semibold">
          {t.summary(summary.known, summary.probable, summary.unknown)}
        </p>
        {toCheck.length > 0 && (
          <p className="text-sm text-muted-foreground">{t.summaryHint}</p>
        )}
      </div>
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
      {toCheck.length > 0 && (
        <Section title={t.sectionCheck}>
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
      <div className="px-4 pt-6">
        <Button
          size="lg"
          className="w-full"
          disabled={count === 0 || saving}
          onClick={() => {
            setSaving(true);
            const chosen = lines.map((line, index) =>
              excluded.has(index)
                ? { kind: "skip" as const }
                : choiceOf(index, line),
            );
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
          {t.apply(count)}
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
