import { useLiveQuery } from "dexie-react-hooks";
import { GitMerge, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { routes } from "@/app/routes";
import {
  articleUsage,
  deleteArticle,
  mergeArticles,
  updateArticle,
} from "@/db/articles";
import { db } from "@/db/database";
import type { Article } from "@/domain/model";
import { formatNumber } from "@/domain/quantity";
import { searchArticles } from "@/domain/search";
import { slugify } from "@/domain/slug";
import { paletteColor } from "@/features/list/format";
import { UnitSelect } from "@/features/list/UnitSelect";
import { type ListData, useListData } from "@/features/list/useListData";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { backState } from "@/ui/navigation";
import { Field, Select, TextInput } from "@/ui/form";
import { EmptyState, PageHeader, Row, Section } from "@/ui/Page";
import { ProductIcon } from "@/ui/ProductIcon";
import { Sheet } from "@/ui/Sheet";
import { Switch } from "@/ui/switch";
import { showToast } from "@/ui/toast";
import { IconPickerSheet } from "./IconPickerSheet";
import { NameField } from "./NameField";

const t = fr.manage.article;

/** Un alias est stocké en slug (docs/07 § 5) : on l'affiche avec des espaces. */
const aliasLabel = (alias: string) => alias.replaceAll("-", " ");

/**
 * Fiche article (docs/03 G1, docs/04 § 2.9) : nom, catégorie, unité et quantité par
 * défaut, types, autres noms, icône, favori ; fusion et suppression en bas, en rouge,
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
        <EmptyState icon={<X className="size-10" />} title={t.missing} />
      </>
    );
  if (!data || !article) return null;
  return <ArticleForm key={article.id} article={article} data={data} />;
}

function ArticleForm({ article, data }: { article: Article; data: ListData }) {
  const navigate = useNavigate();
  const [panel, setPanel] = useState<"icon" | "merge" | "delete" | null>(null);
  const [quantity, setQuantity] = useState(
    article.defaultQuantity === undefined
      ? ""
      : formatNumber(article.defaultQuantity),
  );
  const [newType, setNewType] = useState("");
  const [newAlias, setNewAlias] = useState("");
  const usage = useLiveQuery(() => articleUsage(db, article.id), [article.id]);
  const category = data.categoryById.get(article.categoryId);
  const color = paletteColor(category?.color);
  const save = (changes: Parameters<typeof updateArticle>[2]) =>
    void updateArticle(db, article.id, changes).then((result) => {
      if (result === "nameTaken") showToast(t.nameTaken, { tone: "warning" });
    });

  const saveQuantity = () => {
    const value = Number(quantity.replace(",", "."));
    if (!quantity.trim()) save({ defaultQuantity: undefined });
    else if (Number.isFinite(value) && value > 0)
      save({ defaultQuantity: value });
    else
      setQuantity(
        article.defaultQuantity === undefined
          ? ""
          : formatNumber(article.defaultQuantity),
      );
  };
  const addType = () => {
    const clean = newType.trim();
    if (clean && !article.types.some((x) => slugify(x) === slugify(clean)))
      save({ types: [...article.types, clean] });
    setNewType("");
  };
  const addAlias = () => {
    const slug = slugify(newAlias);
    if (slug && slug !== article.slug && !article.aliases.includes(slug))
      save({ aliases: [...article.aliases, slug] });
    setNewAlias("");
  };

  return (
    <>
      <PageHeader title={article.name} backTo={routes.manageArticles} />
      <div className="flex flex-col items-center gap-2 px-4 pt-2 pb-4">
        <button
          type="button"
          onClick={() => {
            setPanel("icon");
          }}
          aria-label={fr.manage.icon.change}
          className="rounded-3xl border border-border p-3 active:bg-raised"
        >
          <ProductIcon
            icon={article.icon}
            label={article.name}
            color={color}
            size={72}
          />
        </button>
        <span className="text-sm font-semibold text-primary">
          {fr.manage.icon.change}
        </span>
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
            <Select
              value={article.categoryId}
              onChange={(event) => {
                save({ categoryId: event.target.value });
              }}
            >
              {[...data.categories]
                .sort((a, b) => a.name.localeCompare(b.name, "fr"))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
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
            <Field label={t.quantity} className="w-32">
              <TextInput
                inputMode="decimal"
                value={quantity}
                placeholder="1"
                onChange={(event) => {
                  setQuantity(event.target.value);
                }}
                onBlur={saveQuantity}
              />
            </Field>
          </div>
          <p className="-mt-2 text-sm text-muted-foreground">
            {t.quantityHint}
          </p>
        </div>
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

      <Section title={t.types}>
        <TagEditor
          hint={t.typesHint}
          values={article.types}
          display={(x) => x}
          removeLabel={t.removeType}
          onRemove={(type) => {
            save({ types: article.types.filter((x) => x !== type) });
          }}
          input={newType}
          onInput={setNewType}
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
          input={newAlias}
          onInput={setNewAlias}
          placeholder={t.newAlias}
          addLabel={t.addAlias}
          onAdd={addAlias}
        />
      </Section>

      <div className="flex flex-col gap-3 px-4 pt-6 pb-8">
        {usage && (
          <p className="text-center text-sm text-muted-foreground">
            {t.usage(usage.lines, usage.lists)}
          </p>
        )}
        <Button
          variant="outline"
          onClick={() => {
            setPanel("merge");
          }}
        >
          <GitMerge />
          {t.merge}
        </Button>
        <Button
          variant="outline"
          className="border-danger/50 text-danger"
          onClick={() => {
            setPanel("delete");
          }}
        >
          <Trash2 />
          {t.delete}
        </Button>
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
          open
          autoFocus={false}
          onOpenChange={(open) => {
            if (!open) setPanel(null);
          }}
          title={t.deleteTitle(article.name)}
          description={t.deleteText(usage?.lists ?? 0)}
        >
          <div className="flex flex-col gap-3">
            <Button
              variant="destructive"
              onClick={() => {
                void deleteArticle(db, article.id).then(() => {
                  showToast(t.deleted(article.name), { tone: "success" });
                  void navigate(routes.manageArticles, {
                    replace: true,
                    state: backState,
                  });
                });
              }}
            >
              {t.delete}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPanel(null);
              }}
            >
              {fr.manage.confirmCancel}
            </Button>
          </div>
        </Sheet>
      )}
    </>
  );
}

/** Puces modifiables (types, autres noms) : ✕ pour retirer, champ pour ajouter. */
function TagEditor({
  hint,
  values,
  display,
  removeLabel,
  onRemove,
  input,
  onInput,
  placeholder,
  addLabel,
  onAdd,
}: {
  hint: string;
  values: string[];
  display: (value: string) => string;
  removeLabel: (value: string) => string;
  onRemove: (value: string) => void;
  input: string;
  onInput: (value: string) => void;
  placeholder: string;
  addLabel: string;
  onAdd: () => void;
}) {
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
          onAdd();
        }}
      >
        <TextInput
          value={input}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(event) => {
            onInput(event.target.value);
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
      open
      autoFocus={false}
      onOpenChange={(open) => {
        if (!open) onClose();
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
          <label className="mb-2 flex h-12 items-center gap-2 rounded-full border border-border bg-raised px-4 light:bg-bg">
            <Search className="size-5 shrink-0 text-secondary" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              placeholder={t.mergeSearch}
              aria-label={t.mergeSearch}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
          </label>
          <ul className="-mx-2">
            {results.map((article) => {
              const category = data.categoryById.get(article.categoryId);
              return (
                <li key={article.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOther(article);
                    }}
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left active:bg-raised"
                  >
                    <ProductIcon
                      icon={article.icon}
                      label={article.name}
                      color={paletteColor(category?.color)}
                      size={28}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {article.name}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {category?.name}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Sheet>
  );
}
