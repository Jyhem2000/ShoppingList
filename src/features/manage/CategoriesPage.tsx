import { GitMerge, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { routes } from "@/app/routes";
import {
  createCategory,
  deleteCategory,
  mergeCategoryInto,
  updateCategory,
} from "@/db/categories";
import { db } from "@/db/database";
import { useArticles, useCategories } from "@/db/hooks";
import type { Category, ID } from "@/domain/model";
import { categoryShortName } from "@/features/list/format";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { Field, Select, TextInput, ConfirmActions } from "@/ui/form";
import { GroupIcon } from "@/ui/GroupIcon";
import { PageHeader, Section } from "@/ui/Page";
import { type PaletteColor, paletteColor } from "@/ui/palette";
import { Sheet } from "@/ui/Sheet";
import { StylePicker } from "@/ui/StylePicker";
import { showToast } from "@/ui/toast";
import { NameField } from "./NameField";
import { RowButton } from "@/ui/RowButton";
const t = fr.manage.categories;
const collator = new Intl.Collator("fr");

/** Catégories (docs/03 G2) : la liste, la création, et la fiche de chacune. */
export function CategoriesPage() {
  const categories = useCategories();
  const articles = useArticles();
  const [open, setOpen] = useState<ID | null>(null);
  const [creating, setCreating] = useState(false);
  const counts = new Map<ID, number>();
  for (const a of articles ?? [])
    counts.set(a.categoryId, (counts.get(a.categoryId) ?? 0) + 1);
  const sorted = [...(categories ?? [])].sort(
    (a, b) =>
      Number(a.isSystem) - Number(b.isSystem) ||
      collator.compare(a.name, b.name),
  );
  const editing = sorted.find((c) => c.id === open);

  return (
    <>
      <PageHeader title={t.title} backTo={routes.settings} />
      <div className="px-4 pb-1">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setCreating(true);
          }}
        >
          <Plus />
          {t.add}
        </Button>
      </div>
      <Section className="pb-6">
        <ul className="divide-y divide-border/50">
          {sorted.map((category) => (
            <li key={category.id}>
              <RowButton
                icon={
                  <GroupIcon
                    name={category.icon}
                    palette={category.color}
                    className="size-6 shrink-0"
                  />
                }
                title={category.name}
                detail={t.count(counts.get(category.id) ?? 0)}
                chevron
                onClick={() => {
                  setOpen(category.id);
                }}
              />
            </li>
          ))}
        </ul>
      </Section>
      {editing && (
        <CategorySheet
          key={editing.id}
          category={editing}
          categories={sorted}
          count={counts.get(editing.id) ?? 0}
          onClose={() => {
            setOpen(null);
          }}
        />
      )}
      {creating && (
        <NewCategorySheet
          onClose={() => {
            setCreating(false);
          }}
          onCreated={(id) => {
            setCreating(false);
            setOpen(id);
          }}
        />
      )}
    </>
  );
}

function NewCategorySheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: ID) => void;
}) {
  const [name, setName] = useState("");
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t.newTitle}
      description={t.newHint}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          void createCategory(db, { name, icon: "tag", color: "gris" }).then(
            (result) => {
              if (result.kind === "nameTaken")
                showToast(t.nameTaken, { tone: "warning" });
              else onCreated(result.category.id);
            },
          );
        }}
      >
        <Field label={t.name}>
          <TextInput
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        </Field>
        <Button type="submit" disabled={!name.trim()}>
          {t.create}
        </Button>
      </form>
    </Sheet>
  );
}

type Step = "edit" | "merge" | "delete";

function CategorySheet({
  category,
  categories,
  count,
  onClose,
}: {
  category: Category;
  categories: Category[];
  count: number;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("edit");
  const others = categories.filter((c) => c.id !== category.id);
  const fallback =
    categories.find((c) => c.catalogKey === "autres") ?? others[0];
  const [moveTo, setMoveTo] = useState<ID>(fallback?.id ?? "");
  const color = paletteColor(category.color);
  const save = (changes: Parameters<typeof updateCategory>[2]) =>
    void updateCategory(db, category.id, changes).then((result) => {
      if (result === "nameTaken") showToast(t.nameTaken, { tone: "warning" });
    });

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
          ? t.mergeTitle(category.name)
          : step === "delete"
            ? t.deleteTitle(category.name)
            : category.name
      }
      description={
        step === "merge"
          ? t.mergeText
          : step === "delete"
            ? t.deleteText(count)
            : undefined
      }
    >
      {step === "merge" && (
        <ul className="-mx-2">
          {others.map((target) => (
            <li key={target.id}>
              <RowButton
                inset="sheet"
                icon={
                  <GroupIcon
                    name={target.icon}
                    palette={target.color}
                    className="size-5 shrink-0"
                  />
                }
                title={target.name}
                onClick={() => {
                  void mergeCategoryInto(db, category.id, target.id).then(
                    () => {
                      showToast(t.merged(category.name, target.name), {
                        tone: "success",
                      });
                    },
                  );
                  onClose();
                }}
              />
            </li>
          ))}
        </ul>
      )}
      {step === "delete" && (
        <div className="flex flex-col gap-4">
          {count > 0 && (
            <Field label={t.moveTo}>
              <Select
                value={moveTo}
                onChange={(event) => {
                  setMoveTo(event.target.value);
                }}
              >
                {others.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <ConfirmActions
            label={t.delete}
            disabled={!moveTo}
            onConfirm={() => {
              void deleteCategory(db, category.id, moveTo).then(() => {
                showToast(t.deleted(category.name), { tone: "success" });
              });
              onClose();
            }}
          />
        </div>
      )}
      {step === "edit" && (
        <div className="flex flex-col gap-5 pb-1">
          <NameField
            key={category.name}
            label={t.name}
            value={category.name}
            onSave={(name) => {
              save({ name });
            }}
          />
          {!category.isSystem && (
            <NameField
              key={`short-${category.shortName ?? ""}`}
              label={t.shortName}
              value={category.shortName ?? ""}
              optional
              placeholder={categoryShortName({ ...category, shortName: "" })}
              hint={t.shortNameHint}
              onSave={(shortName) => {
                save({ shortName: shortName || undefined });
              }}
            />
          )}
          {category.isSystem && (
            <p className="text-sm text-muted-foreground">{t.system}</p>
          )}
          <StylePicker
            icon={category.icon}
            color={color}
            onIconChange={(icon) => {
              save({ icon });
            }}
            onColorChange={(c: PaletteColor) => {
              save({ color: c });
            }}
          />
          {!category.isSystem && (
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
