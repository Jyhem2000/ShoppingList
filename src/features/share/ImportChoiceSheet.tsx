import { useState } from "react";
import type { Article, Category, ID } from "@/domain/model";
import { searchArticles } from "@/domain/search";
import {
  canKeep,
  defaultOneOff,
  existingArticle,
  findCategory,
  type ImportChoice,
  type ImportLine,
} from "@/domain/share";
import { fr } from "@/i18n/fr";
import { ArticleIcon } from "@/ui/ArticleIcon";
import { Button } from "@/ui/button";
import {
  ChipChoice,
  ChoiceMark,
  Field,
  FieldLabel,
  TextInput,
} from "@/ui/form";
import { EmptyHint } from "@/ui/Page";
import { RowButton } from "@/ui/RowButton";
import { SearchField } from "@/ui/SearchField";
import { Sheet } from "@/ui/Sheet";
import { byName } from "@/domain/slug";

const t = fr.share;
const MAX_RESULTS = 8;

/**
 * Choisir l'article d'une ligne reçue (docs/02 § 9, « Aider à trouver un article qu'on
 * ne sait pas avoir ») : les candidats « Peut-être chez toi », tous les articles de sa
 * catégorie, une recherche libre ; « C'est celui-là » en un tap, ou « Créer » avec un
 * libellé modifiable.
 */
export function ImportChoiceSheet({
  line,
  choice,
  quantity,
  articles,
  articleById,
  categories,
  categoryById,
  purchaseCounts,
  onChoose,
  onClose,
}: {
  line: ImportLine;
  choice: ImportChoice;
  /** Quantité reçue, telle qu'affichée dans l'aperçu. */
  quantity: string;
  articles: readonly Article[];
  articleById: ReadonlyMap<ID, Article>;
  categories: readonly Category[];
  categoryById: ReadonlyMap<ID, Category>;
  purchaseCounts: ReadonlyMap<ID, number>;
  onChoose: (choice: ImportChoice) => void;
  onClose: () => void;
}) {
  const { received, match } = line;
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [name, setName] = useState(
    choice.kind === "create" ? choice.name : received.name,
  );
  const keepable = canKeep(line);
  const [oneOff, setOneOff] = useState(
    choice.kind === "create" ? choice.oneOff : defaultOneOff(line),
  );
  const category = findCategory(received.category, categories);
  const chosenId = choice.kind === "use" ? choice.articleId : undefined;

  const proposed = [
    ...new Set([
      ...(match.kind === "unknown" ? match.candidates : [match.articleId]),
      ...(chosenId ? [chosenId] : []),
    ]),
  ]
    .map((id) => articleById.get(id))
    .filter((article) => article !== undefined);
  const others = query.trim()
    ? searchArticles(query, articles, purchaseCounts)
        .slice(0, MAX_RESULTS)
        .map((result) => result.article)
    : showAll && category
      ? articles
          .filter((article) => article.categoryId === category.id)
          .sort(byName)
      : [];

  const row = (article: Article) => (
    <RowButton
      key={article.id}
      inset="sheet"
      icon={
        <ArticleIcon
          article={article}
          category={categoryById.get(article.categoryId)}
        />
      }
      title={article.name}
      detail={categoryById.get(article.categoryId)?.name}
      trailing={<ChoiceMark selected={article.id === chosenId} />}
      onClick={() => {
        onChoose({ kind: "use", articleId: article.id });
      }}
    />
  );

  return (
    <Sheet
      autoFocus={false}
      onClose={() => {
        onClose();
      }}
      title={t.choiceTitle(received.label)}
      description={t.choiceText(
        category?.name ?? received.category.name,
        quantity,
      )}
    >
      <div className="flex flex-col gap-5 pb-1">
        <section>
          <FieldLabel>{t.candidates}</FieldLabel>
          {proposed.length ? (
            proposed.map(row)
          ) : (
            <EmptyHint>{t.noCandidates}</EmptyHint>
          )}
          {category && !showAll && (
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={() => {
                setShowAll(true);
              }}
            >
              {t.allInCategory}
            </Button>
          )}
        </section>

        <section className="flex flex-col gap-1">
          <SearchField
            value={query}
            onValueChange={setQuery}
            label={t.search}
          />
          {others.filter((article) => !proposed.includes(article)).map(row)}
        </section>

        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const typed = name.trim();
            if (!typed) return;
            // Un article de ce nom existe déjà : c'est lui (pas de double).
            const same = existingArticle(typed, articles);
            onChoose(
              same
                ? { kind: "use", articleId: same.id }
                : { kind: "create", name: typed, oneOff: oneOff || !keepable },
            );
          }}
        >
          <FieldLabel>{t.createTitle}</FieldLabel>
          <Field label={t.createName}>
            <TextInput
              value={name}
              autoCapitalize="sentences"
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
          </Field>
          {keepable ? (
            <ChipChoice
              selected={oneOff}
              onToggle={() => {
                setOneOff(!oneOff);
              }}
              label={fr.list.createSheet.oneOff}
              hint={
                oneOff
                  ? fr.list.createSheet.oneOffOn
                  : t.inCategory(category?.name ?? received.category.name)
              }
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {fr.list.createSheet.oneOffOn}
            </p>
          )}
          <Button
            type="submit"
            variant={choice.kind === "create" ? "default" : "outline"}
            disabled={!name.trim()}
          >
            {t.create}
          </Button>
        </form>
      </div>
    </Sheet>
  );
}
