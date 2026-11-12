import { useMemo, useState } from "react";
import { ONE_OFF_CATEGORY } from "@/data";
import { setArticleCategory } from "@/db/catalog";
import { db } from "@/db/database";
import type { Article } from "@/domain/model";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { Field, Select } from "@/ui/form";
import { showToast } from "@/ui/toast";
import { reportSaveError } from "./useAddToList";
import type { ListData } from "./useListData";

const t = fr.list.keepOneOff;
const collator = new Intl.Collator("fr");

/**
 * Achat ponctuel gardé dans le catalogue (docs/03 A4) : il faut lui choisir une
 * vraie catégorie, qui décide aussi de son rayon. Rien n'apparaît pour un article normal.
 */
export function KeepOneOff({
  article,
  data,
}: {
  article: Article;
  data: ListData;
}) {
  const [categoryId, setCategoryId] = useState("");
  const categories = useMemo(
    () =>
      data.categories
        .filter((c) => c.catalogKey !== ONE_OFF_CATEGORY)
        .sort((a, b) => collator.compare(a.name, b.name)),
    [data.categories],
  );
  if (
    data.categoryById.get(article.categoryId)?.catalogKey !== ONE_OFF_CATEGORY
  )
    return null;

  return (
    <div className="rounded-2xl border border-border p-3">
      <p className="mb-3 text-sm text-muted-foreground">{t.hint}</p>
      <Field label={t.category}>
        <Select
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
          }}
        >
          <option value="" disabled>
            {t.choose}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Button
        variant="outline"
        className="mt-3 w-full"
        disabled={!categoryId}
        onClick={() => {
          const category = data.categoryById.get(categoryId);
          void setArticleCategory(db, article.id, categoryId)
            .then(() => {
              showToast(t.done(article.name, category?.name ?? ""), {
                tone: "success",
              });
            })
            .catch(reportSaveError);
        }}
      >
        {t.keep}
      </Button>
    </div>
  );
}
