import { GitMerge, Trash2, X } from "lucide-react";
import { useState } from "react";
import { db } from "@/db/database";
import {
  deleteAisle,
  mergeAisleInto,
  setAisleCategoryRole,
  updateAisle,
} from "@/db/stores";
import type { Aisle, Category } from "@/domain/model";
import { categoryRole } from "@/domain/stores";
import { aisleText, paletteColor } from "@/features/list/format";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { Field, Select, ConfirmActions } from "@/ui/form";
import { GroupIcon } from "@/ui/GroupIcon";
import { palette } from "@/ui/palette";
import { Sheet } from "@/ui/Sheet";
import { StylePicker } from "@/ui/StylePicker";
import { Switch } from "@/ui/switch";
import { showToast } from "@/ui/toast";
import { NameField } from "./NameField";
import { cn } from "@/ui/utils";
import { RowButton } from "@/ui/RowButton";
const t = fr.manage.aisle;

type Step = "edit" | "merge" | "delete";

/**
 * Un rayon (docs/03 G3) : nom et repère facultatifs (sans nom, son titre vient de ses
 * catégories), icône et couleur, catégories (pleine = principale,
 * contour = aussi ici ; toucher pour changer, ✕ pour retirer), fusion, suppression.
 * Tout est enregistré au fil de l'eau.
 */
export function AisleSheet({
  aisle,
  aisles,
  categories,
  weights,
  onClose,
}: {
  aisle: Aisle;
  aisles: Aisle[];
  categories: Category[];
  /** Achats par catégorie, pour le titre des rayons sans nom. */
  weights: ReadonlyMap<string, number>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("edit");
  const [promote, setPromote] = useState(true);
  const color = paletteColor(aisle.color);
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const present = aisle.categories.flatMap((entry) => {
    const category = categoryById.get(entry.categoryId);
    return category ? [{ category, primary: entry.primary }] : [];
  });
  const addable = categories
    .filter((c) => !c.isSystem && categoryRole(aisle, c.id) === "none")
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const others = aisles.filter((a) => a.id !== aisle.id);
  const textOf = (a: Aisle) => aisleText(a, categoryById, weights);
  const text = textOf(aisle);

  const setRole = (
    categoryId: string,
    role: "primary" | "secondary" | "none",
  ) => void setAisleCategoryRole(db, aisle.storeId, aisle.id, categoryId, role);

  return (
    <Sheet
      open
      autoFocus={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onBack={
        step === "edit"
          ? undefined
          : () => {
              setStep("edit");
            }
      }
      title={
        step === "merge"
          ? t.mergeTitle(text.label)
          : step === "delete"
            ? t.deleteTitle(text.label)
            : text.label
      }
      description={
        step === "merge"
          ? t.mergeText
          : step === "delete"
            ? t.deleteText
            : undefined
      }
    >
      {step === "merge" && (
        <ul className="-mx-2">
          {others.map((target) => {
            const targetText = textOf(target);
            return (
              <li key={target.id}>
                <RowButton
                  inset="sheet"
                  icon={
                    <GroupIcon
                      name={target.icon}
                      color={target.color}
                      className="size-5 shrink-0"
                    />
                  }
                  title={targetText.label}
                  detail={targetText.contents}
                  onClick={() => {
                    void mergeAisleInto(db, aisle.id, target.id).then(() => {
                      showToast(t.merged(text.label, targetText.label), {
                        tone: "success",
                      });
                    });
                    onClose();
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}

      {step === "delete" && (
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-3">
            <span className="flex-1 text-sm">{t.deletePromote}</span>
            <Switch
              checked={promote}
              aria-label={t.deletePromote}
              onCheckedChange={setPromote}
            />
          </label>
          <ConfirmActions
            label={t.delete}
            onConfirm={() => {
              void deleteAisle(db, aisle.id, promote).then(() => {
                showToast(t.deleted(text.label), { tone: "success" });
              });
              onClose();
            }}
          />
        </div>
      )}

      {step === "edit" && (
        <div className="flex flex-col gap-5 pb-1">
          {!aisle.isUnsorted && (
            <>
              <NameField
                key={aisle.name}
                label={t.name}
                value={aisle.name}
                optional
                placeholder={text.automatic}
                hint={t.nameHint}
                onSave={(clean) =>
                  void updateAisle(db, aisle.id, { name: clean })
                }
              />
              <NameField
                key={`description-${aisle.description ?? ""}`}
                label={t.description}
                value={aisle.description ?? ""}
                optional
                placeholder={t.descriptionPlaceholder}
                onSave={(clean) =>
                  void updateAisle(db, aisle.id, {
                    description: clean || undefined,
                  })
                }
              />
            </>
          )}

          {aisle.isUnsorted ? (
            <p className="text-sm text-muted-foreground">{t.unsortedHint}</p>
          ) : (
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                {t.categories}
              </p>
              <p className="mb-2 text-sm text-muted-foreground">
                {t.categoriesHint}
              </p>
              <ul aria-label={t.categories} className="flex flex-wrap gap-2">
                {present.map(({ category, primary }) => (
                  <li key={category.id} className="flex">
                    <button
                      type="button"
                      aria-pressed={primary}
                      aria-label={
                        primary
                          ? t.makeSecondary(category.name)
                          : t.makePrimary(category.name)
                      }
                      onClick={() => {
                        setRole(category.id, primary ? "secondary" : "primary");
                      }}
                      className={cn(
                        "flex min-h-11 items-center gap-1.5 rounded-l-full border border-r-0 py-1 pr-2 pl-3 text-sm font-semibold",
                        primary
                          ? cn(
                              palette[color].border,
                              palette[color].soft,
                              palette[color].text,
                            )
                          : "border-border text-muted-foreground",
                      )}
                    >
                      <GroupIcon name={category.icon} className="size-4" />
                      {category.name}
                    </button>
                    <button
                      type="button"
                      aria-label={t.removeCategory(category.name)}
                      onClick={() => {
                        setRole(category.id, "none");
                      }}
                      className={cn(
                        "flex min-h-11 items-center rounded-r-full border border-l-0 pr-2.5 pl-1",
                        primary
                          ? cn(
                              palette[color].border,
                              palette[color].soft,
                              palette[color].text,
                            )
                          : "border-border text-muted-foreground",
                      )}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
              {addable.length > 0 && (
                <Field label={t.addCategory} className="mt-3">
                  <Select
                    value=""
                    onChange={(event) => {
                      const id = event.target.value;
                      if (!id) return;
                      // Principale si elle n'a encore aucun rayon principal dans ce magasin.
                      const elsewhere = aisles.some(
                        (a) => categoryRole(a, id) === "primary",
                      );
                      setRole(id, elsewhere ? "secondary" : "primary");
                    }}
                  >
                    <option value="">{t.chooseCategory}</option>
                    {addable.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>
          )}

          <StylePicker
            icon={aisle.icon}
            color={color}
            onIconChange={(icon) => void updateAisle(db, aisle.id, { icon })}
            onColorChange={(c) => void updateAisle(db, aisle.id, { color: c })}
          />

          {!aisle.isUnsorted && (
            <div className="flex flex-col gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("merge");
                }}
              >
                <GitMerge />
                {t.merge}
              </Button>
              <Button
                variant="outline"
                className="border-danger/50 text-danger"
                onClick={() => {
                  setStep("delete");
                }}
              >
                <Trash2 />
                {t.delete}
              </Button>
            </div>
          )}
          <Button onClick={onClose}>{t.done}</Button>
        </div>
      )}
    </Sheet>
  );
}
