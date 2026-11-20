import { useLiveQuery } from "dexie-react-hooks";
import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { routes } from "@/app/routes";
import {
  articleUsage,
  deleteArticle,
  mergeArticles,
  updateArticle,
} from "@/db/articles";
import { db } from "@/db/database";
import type { Article } from "@/domain/model";
import { formatNumber, parseNumber } from "@/domain/quantity";
import { searchArticles } from "@/domain/search";
import { monthOf, showsSeason, toggleMonth } from "@/domain/season";
import { MonthCalendar } from "@/ui/MonthCalendar";
import { useNow } from "@/ui/useNow";
import { addAlias as withAlias, mergeTypes } from "@/domain/slug";
import { UnitSelect } from "@/ui/UnitSelect";
import { type ListData, useListData } from "@/common/useListData";
import { fr } from "@/i18n/fr";
import { SearchField } from "@/ui/SearchField";
import { Button } from "@/ui/button";
import { useGoBack } from "@/ui/navigation";
import {
  Field,
  TextInput,
  ConfirmActions,
  MergeDeleteActions,
} from "@/ui/form";
import { CategorySelect } from "@/ui/CategorySelect";
import { EmptyState, PageHeader, Row, Section } from "@/ui/Page";
import { IconChangeButton } from "@/ui/IconChangeButton";
import { Sheet } from "@/ui/Sheet";
import { Switch } from "@/ui/switch";
import { showToast } from "@/ui/toast";
import { IconPickerSheet } from "@/common/IconPickerSheet";
import { NameField } from "@/common/NameField";
import { RowButton } from "@/ui/RowButton";
import { ArticleIcon } from "@/ui/ArticleIcon";
import { paletteColor } from "@/ui/palette";
import { usePendingSave } from "@/ui/usePendingSave";
import { feedback } from "@/feedback";
const t = fr.manage.article;

/** Un alias est stocké en slug (docs/07 § 5) : on l'affiche avec des espaces. */
const aliasLabel = (alias: string) => alias.replaceAll("-", " ");

/**
 * Fiche article (docs/03 G1, docs/04 § 2.9) : nom, catégorie, unité et quantité par
 * défaut, types, autres noms, icône, favori, mois de saison (D3) ; fusion et suppression en bas, en rouge,
 * avec leurs conséquences. Tout est enregistré au fil de l'eau.
 */
export function ArticlePage() {
  const { articleId } = useParams();
  const data = useListData();
  const article = articleId ? data?.articleById.get(articleId) : undefined;

  if (data && !article)
    return (
      <>
        <PageHeader
          title={fr.manage.articles.title}
          backTo={routes.manageArticles}
        />
        <EmptyState icon={<X />} title={t.missing} />
      </>
    );
  if (!data || !article) return null;
  return <ArticleForm key={article.id} article={article} data={data} />;
}

function ArticleForm({ article, data }: { article: Article; data: ListData }) {
  const goBack = useGoBack(routes.manageArticles);
  const [panel, setPanel] = useState<"icon" | "merge" | "delete" | null>(null);
  const [quantity, setQuantity] = useState(
    quantityText(article.defaultQuantity),
  );
  const usage = useLiveQuery(() => articleUsage(db, article.id), [article.id]);
  const category = data.categoryById.get(article.categoryId);
  const month = monthOf(useNow());
  const color = paletteColor(category?.color);
  const save = (changes: Parameters<typeof updateArticle>[2]) =>
    void updateArticle(db, article.id, changes).then((result) => {
      if (result === "nameTaken") showToast(t.nameTaken, { tone: "warning" });
    });

  const saveQuantity = () => {
    const value = parseNumber(quantity);
    if (!quantity.trim()) save({ defaultQuantity: undefined });
    else if (Number.isFinite(value) && value > 0)
      save({ defaultQuantity: value });
    else setQuantity(quantityText(article.defaultQuantity));
  };
  const { edited: quantityEdited, commit: commitQuantity } =
    usePendingSave(saveQuantity);
  const addType = (text: string) => {
    const types = mergeTypes(article.types, [text]);
    if (types.length > article.types.length) save({ types });
  };
  const addAlias = (text: string) => {
    const aliases = withAlias(article, text);
    if (aliases.length > article.aliases.length) save({ aliases });
  };

  return (
    <>
      <PageHeader title={article.name} backTo={routes.manageArticles} />
      <div className="px-4 pt-2 pb-4">
        <IconChangeButton
          icon={article.icon}
          label={article.name}
          color={color}
          onClick={() => {
            setPanel("icon");
          }}
        />
      </div>

      <Section>
        <div className="flex flex-col gap-4 px-4 py-4">
          <NameField
            key={article.name}
            label={t.name}
            value={article.name}
            onSave={(name) => {
              save({ name });
            }}
          />
          <Field label={t.category}>
            <CategorySelect
              categories={data.categories}
              value={article.categoryId}
              onChange={(categoryId) => {
                save({ categoryId });
              }}
            />
          </Field>
          <div className="flex flex-col gap-4">
            <Field label={t.unit}>
              <UnitSelect
                units={data.units}
                value={article.defaultUnitId}
                onChange={(event) => {
                  save({ defaultUnitId: event.target.value });
                }}
              />
            </Field>
            {/* Champ étroit, intitulé sur toute la largeur (sinon sur 2 lignes). */}
            <Field label={t.quantity}>
              <TextInput
                className="w-32"
                inputMode="decimal"
                value={quantity}
                placeholder="1"
                onChange={(event) => {
                  setQuantity(event.target.value);
                  quantityEdited();
                }}
                onBlur={() => void commitQuantity()}
              />
            </Field>
          </div>
          <p className="-mt-2 text-sm text-muted-foreground">
            {t.quantityHint}
          </p>
        </div>
        {data.units.find((u) => u.id === article.defaultUnitId)?.dimension ===
          "mass" && (
          <Row label={t.countable} hint={t.countableHint}>
            <Switch
              checked={article.countable === true}
              aria-label={t.countable}
              onCheckedChange={(countable) => {
                save({ countable });
              }}
            />
          </Row>
        )}
        <Row label={t.favorite} hint={t.favoriteHint}>
          <Switch
            checked={article.favorite}
            aria-label={t.favorite}
            onCheckedChange={(favorite) => {
              save({ favorite });
            }}
          />
        </Row>
      </Section>

      {showsSeason(article, category?.catalogKey) && (
        <Section title={t.season}>
          <div className="flex flex-col gap-3 px-4 py-4">
            <p className="text-sm text-muted-foreground">{t.seasonHint}</p>
            <MonthCalendar
              months={article.seasonMonths ?? []}
              current={month}
              onToggle={(month) => {
                save({
                  seasonMonths: toggleMonth(article.seasonMonths, month),
                });
              }}
            />
          </div>
        </Section>
      )}

      <Section title={t.types}>
        <TagEditor
          hint={t.typesHint}
          values={article.types}
          removeLabel={t.removeType}
          onRemove={(type) => {
            save({ types: article.types.filter((x) => x !== type) });
          }}
          placeholder={t.newType}
          addLabel={t.addType}
          onAdd={addType}
        />
      </Section>

      <Section title={t.aliases}>
        <TagEditor
          hint={t.aliasesHint}
          values={article.aliases}
          display={aliasLabel}
          removeLabel={(alias) => t.removeAlias(aliasLabel(alias))}
          onRemove={(alias) => {
            save({ aliases: article.aliases.filter((x) => x !== alias) });
          }}
          placeholder={t.newAlias}
          addLabel={t.addAlias}
          onAdd={addAlias}
        />
      </Section>

      <div className="flex flex-col gap-3 px-4 pt-6 pb-8">
        {usage && (
          <p className="text-center text-sm text-muted-foreground">
            {t.usage(usage.lines, usage.lists, usage.recipes)}
          </p>
        )}
        <MergeDeleteActions
          mergeLabel={t.merge}
          deleteLabel={t.delete}
          onMerge={() => {
            setPanel("merge");
          }}
          onDelete={() => {
            setPanel("delete");
          }}
        />
      </div>

      {panel === "icon" && (
        <IconPickerSheet
          label={article.name}
          color={color}
          value={article.icon}
          onPick={(icon) => {
            save({ icon });
          }}
          onClose={() => {
            setPanel(null);
          }}
        />
      )}
      {panel === "merge" && (
        <MergeArticleSheet
          keep={article}
          data={data}
          onClose={() => {
            setPanel(null);
          }}
        />
      )}
      {panel === "delete" && (
        <Sheet
          autoFocus={false}
          onClose={() => {
            setPanel(null);
          }}
          title={t.deleteTitle(article.name)}
          description={t.deleteText(usage?.lists ?? 0, usage?.recipes ?? 0)}
        >
          <ConfirmActions
            label={t.delete}
            onConfirm={() => {
              void deleteArticle(db, article.id).then(() => {
                feedback.remove();
                showToast(t.deleted(article.name), { tone: "success" });
                goBack();
              });
            }}
            onCancel={() => {
              setPanel(null);
            }}
          />
        </Sheet>
      )}
    </>
  );
}

/** Quantité par défaut dans son champ (vide : celle de l'unité). */
function quantityText(quantity: number | undefined): string {
  return quantity === undefined ? "" : formatNumber(quantity);
}

/**
 * Puces modifiables (types, autres noms) : ✕ pour retirer, champ pour ajouter
 * (`onAdd` reçoit le texte saisi, puis le champ se vide).
 */
function TagEditor({
  hint,
  values,
  display = (value) => value,
  removeLabel,
  onRemove,
  placeholder,
  addLabel,
  onAdd,
}: {
  hint: string;
  values: string[];
  display?: (value: string) => string;
  removeLabel: (value: string) => string;
  onRemove: (value: string) => void;
  placeholder: string;
  addLabel: string;
  onAdd: (text: string) => void;
}) {
  const [input, setInput] = useState("");
  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <p className="text-sm text-muted-foreground">{hint}</p>
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {values.map((value) => (
            <li
              key={value}
              className="flex min-h-11 items-center gap-1 rounded-full border border-border pr-1 pl-4 text-sm font-semibold"
            >
              {display(value)}
              <button
                type="button"
                aria-label={removeLabel(value)}
                onClick={() => {
                  onRemove(value);
                }}
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground active:bg-raised"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onAdd(input);
          setInput("");
        }}
      >
        <TextInput
          value={input}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(event) => {
            setInput(event.target.value);
          }}
        />
        <Button
          type="submit"
          size="icon"
          variant="iconOutline"
          aria-label={addLabel}
          disabled={!input.trim()}
        >
          <Plus />
        </Button>
      </form>
    </div>
  );
}

/** Choisir l'article à fusionner dans celui-ci, puis confirmer. */
function MergeArticleSheet({
  keep,
  data,
  onClose,
}: {
  keep: Article;
  data: ListData;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [other, setOther] = useState<Article>();
  const results = useMemo(
    () =>
      query.trim()
        ? searchArticles(query, data.articles, data.purchaseCounts)
            .map((r) => r.article)
            .filter((a) => a.id !== keep.id)
            .slice(0, 8)
        : [],
    [query, data, keep.id],
  );

  return (
    <Sheet
      autoFocus={false}
      onClose={() => {
        onClose();
      }}
      onBack={
        other
          ? () => {
              setOther(undefined);
            }
          : undefined
      }
      title={t.mergeTitle(keep.name)}
      description={other ? t.mergeText(keep.name, other.name) : undefined}
    >
      {other ? (
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => {
              void mergeArticles(db, keep.id, other.id).then(() => {
                showToast(t.merged(other.name, keep.name), { tone: "success" });
              });
              onClose();
            }}
          >
            {t.mergeConfirm}
          </Button>
          <Button variant="outline" onClick={onClose}>
            {fr.manage.confirmCancel}
          </Button>
        </div>
      ) : (
        <>
          <SearchField
            className="mb-2"
            label={t.mergeSearch}
            value={query}
            onValueChange={setQuery}
          />
          <ul className="-mx-2">
            {results.map((article) => {
              const category = data.categoryById.get(article.categoryId);
              return (
                <li key={article.id}>
                  <RowButton
                    inset="sheet"
                    icon={<ArticleIcon article={article} category={category} />}
                    title={article.name}
                    detail={category?.name}
                    onClick={() => {
                      setOther(article);
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Sheet>
  );
}
