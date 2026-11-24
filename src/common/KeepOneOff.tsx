import { useState } from "react";
import { isOneOff } from "@/domain/categories";
import { setArticleCategory } from "@/db/catalog";
import { db } from "@/db/database";
import type { Article } from "@/domain/model";
import { texts } from "@/i18n";
import { Button } from "@/ui/button";
import { Field } from "@/ui/form";
import { CategorySelect } from "@/ui/CategorySelect";
import { showToast, reportSaveError } from "@/ui/toast";
import type { ListData } from "./useListData";

const t = texts.list.keepOneOff;
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
  if (!isOneOff(data.categoryById.get(article.categoryId))) return null;

  return (
    <div className="rounded-2xl border border-border p-3">
      <p className="mb-3 text-sm text-muted-foreground">{t.hint}</p>
      <Field label={t.category}>
        <CategorySelect
          categories={data.categories}
          exclude={isOneOff}
          value={categoryId}
          onChange={setCategoryId}
          placeholder={t.choose}
          required
        />
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
