import { useMemo, useState } from "react";
import { categoriesData, keywordRules, ONE_OFF_CATEGORY } from "@/data";
import { createArticle } from "@/db/catalog";
import { db } from "@/db/database";
import type { ParsedEntry } from "@/domain/entry";
import { guessFromKeywords } from "@/domain/keywords";
import type { Article } from "@/domain/model";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { Chip, Field, Select, TextInput } from "@/ui/form";
import { ProductIcon } from "@/ui/ProductIcon";
import { Sheet } from "@/ui/Sheet";
import { reportSaveError } from "./useAddToList";
import { UnitSelect } from "./UnitSelect";
import type { ListData } from "./useListData";
import { paletteColor } from "@/ui/palette";
const t = fr.list.createSheet;
const collator = new Intl.Collator("fr");

function capitalize(text: string): string {
  const clean = text.trim();
  return clean.charAt(0).toLocaleUpperCase("fr") + clean.slice(1);
}

/** Unité suggérée d'une catégorie (docs/06 § 2), « pièce » à défaut. */
function suggestedUnitKey(catalogKey: string | undefined): string {
  return categoriesData.find((c) => c.key === catalogKey)?.unit ?? "piece";
}

/**
 * Fiche rapide de création d'un article inconnu (docs/03 A4) : catégorie, unité et
 * icône devinées par le dictionnaire de mots-clés, toujours remplies (au pire
 * « Autres » et « pièce »). Si l'écriture correspond à un article existant, c'est
 * lui qui est ajouté.
 */
export function CreateArticleSheet({
  entry,
  data,
  onCreated,
  onCancel,
}: {
  entry: ParsedEntry;
  data: ListData;
  onCreated: (article: Article) => void;
  onCancel: () => void;
}) {
  const guess = useMemo(
    () => guessFromKeywords(entry.text, keywordRules),
    [entry.text],
  );
  const byKey = (key: string | undefined) =>
    data.categories.find((c) => c.catalogKey === key);
  const others = byKey("autres");
  const oneOffCategory = byKey(ONE_OFF_CATEGORY);
  const initialCategory = byKey(guess?.category) ?? others;
  const unitBySlug = (slug: string) => data.units.find((u) => u.slug === slug);

  const [name, setName] = useState(capitalize(entry.text));
  const [categoryId, setCategoryId] = useState(initialCategory?.id ?? "");
  const [unitId, setUnitId] = useState(
    unitBySlug(guess?.unit ?? suggestedUnitKey(initialCategory?.catalogKey))
      ?.id ?? "",
  );
  const [unitTouched, setUnitTouched] = useState(false);
  const [oneOff, setOneOff] = useState(false);
  const icon = guessFromKeywords(name, keywordRules)?.icon ?? guess?.icon;
  const savedCategoryId =
    oneOff && oneOffCategory ? oneOffCategory.id : categoryId;
  const category = data.categoryById.get(savedCategoryId);

  const categories = useMemo(
    () =>
      data.categories
        .filter((c) => c.catalogKey !== ONE_OFF_CATEGORY)
        .sort((a, b) => collator.compare(a.name, b.name)),
    [data.categories],
  );

  return (
    <Sheet
      open
      autoFocus={false}
      onOpenChange={(open) => {
        if (!open) onCancel();
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
              onCreated(result.article);
            })
            .catch(reportSaveError);
        }}
      >
        <div className="flex items-end gap-3">
          <ProductIcon
            icon={icon}
            label={name || "?"}
            color={paletteColor(category?.color)}
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
          <div>
            <Chip
              selected={oneOff}
              onClick={() => {
                setOneOff(!oneOff);
              }}
            >
              {t.oneOff}
            </Chip>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {oneOff ? t.oneOffOn : t.oneOffHint}
            </p>
          </div>
        )}
        {!oneOff && (
          <Field label={t.category}>
            <Select
              value={categoryId}
              onChange={(event) => {
                const id = event.target.value;
                setCategoryId(id);
                if (!unitTouched) {
                  const key = data.categoryById.get(id)?.catalogKey;
                  const unit = unitBySlug(suggestedUnitKey(key));
                  if (unit) setUnitId(unit.id);
                }
              }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
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
            {t.submit}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
