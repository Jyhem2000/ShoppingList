import { useMemo, useState } from "react";
import { keywordRules } from "@/data";
import {
  isOneOff,
  oneOffCategory as findOneOffCategory,
} from "@/domain/categories";
import { createArticle } from "@/db/catalog";
import { db } from "@/db/database";
import type { ParsedEntry } from "@/domain/entry";
import { guessFromKeywords } from "@/domain/keywords";
import { capitalize } from "@/domain/slug";
import { othersCategory } from "@/domain/categories";
import { unitByKey } from "@/domain/quantity";
import { suggestedUnitKey } from "./format";
import type { Article } from "@/domain/model";
import { fr } from "@/i18n/fr";
import { reportSaveError } from "@/ui/toast";
import { Button } from "@/ui/button";
import { ChipChoice, Field, TextInput } from "@/ui/form";
import { CategorySelect } from "@/ui/CategorySelect";
import { ProductIcon } from "@/ui/ProductIcon";
import { Sheet } from "@/ui/Sheet";
import { UnitSelect } from "@/ui/UnitSelect";
import type { ListData } from "./useListData";
const t = fr.list.createSheet;
/**
 * Fiche rapide de création d'un article inconnu (docs/03 A4) : catégorie, unité et
 * icône devinées par le dictionnaire de mots-clés, toujours remplies (au pire
 * « Autres » et « pièce »). Si l'écriture correspond à un article existant, c'est
 * lui qui est retenu (`existed`). `submitLabel` : « Créer et ajouter » par défaut ;
 * `allowOneOff` : propose « Juste cette fois » (pas dans Réglages → Articles).
 */
export function CreateArticleSheet({
  entry,
  data,
  onCreated,
  onCancel,
  submitLabel = t.submit,
  allowOneOff = true,
}: {
  entry: ParsedEntry;
  data: ListData;
  onCreated: (article: Article, existed: boolean) => void;
  onCancel: () => void;
  submitLabel?: string;
  allowOneOff?: boolean;
}) {
  const guess = useMemo(
    () => guessFromKeywords(entry.text, keywordRules),
    [entry.text],
  );
  const byKey = (key: string | undefined) =>
    data.categories.find((c) => c.catalogKey === key);
  const others = othersCategory(data.categories);
  const oneOffCategory = allowOneOff
    ? findOneOffCategory(data.categories)
    : undefined;
  const initialCategory = byKey(guess?.category) ?? others;

  const [name, setName] = useState(capitalize(entry.text));
  const [categoryId, setCategoryId] = useState(initialCategory?.id ?? "");
  const [unitId, setUnitId] = useState(
    unitByKey(
      data.units,
      guess?.unit ?? suggestedUnitKey(initialCategory?.catalogKey),
    )?.id ?? "",
  );
  const [unitTouched, setUnitTouched] = useState(false);
  const [oneOff, setOneOff] = useState(false);
  const icon = guessFromKeywords(name, keywordRules)?.icon ?? guess?.icon;
  const savedCategoryId =
    oneOff && oneOffCategory ? oneOffCategory.id : categoryId;
  const category = data.categoryById.get(savedCategoryId);

  return (
    <Sheet
      autoFocus={false}
      onClose={() => {
        onCancel();
      }}
      title={t.title}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || !savedCategoryId || !unitId) return;
          void createArticle(db, {
            name,
            categoryId: savedCategoryId,
            defaultUnitId: unitId,
            icon,
          })
            .then((result) => {
              onCreated(result.article, result.kind === "exists");
            })
            .catch(reportSaveError);
        }}
      >
        <div className="flex items-end gap-3">
          <ProductIcon
            icon={icon}
            label={name || "?"}
            color={category?.color}
            size={48}
          />
          <Field label={t.name} className="flex-1">
            <TextInput
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
              autoCapitalize="sentences"
              required
            />
          </Field>
        </div>
        {oneOffCategory && (
          <ChipChoice
            selected={oneOff}
            onToggle={() => {
              setOneOff(!oneOff);
            }}
            label={t.oneOff}
            hint={oneOff ? t.oneOffOn : t.oneOffHint}
          />
        )}
        {!oneOff && (
          <Field label={t.category}>
            <CategorySelect
              categories={data.categories}
              exclude={isOneOff}
              value={categoryId}
              onChange={(id) => {
                setCategoryId(id);
                if (!unitTouched) {
                  const key = data.categoryById.get(id)?.catalogKey;
                  const unit = unitByKey(data.units, suggestedUnitKey(key));
                  if (unit) setUnitId(unit.id);
                }
              }}
            />
          </Field>
        )}
        <Field label={t.unit}>
          <UnitSelect
            units={data.units}
            value={unitId}
            onChange={(event) => {
              setUnitId(event.target.value);
              setUnitTouched(true);
            }}
          />
        </Field>
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            {t.cancel}
          </Button>
          <Button type="submit" className="flex-1">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
