import { useLiveQuery } from "dexie-react-hooks";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { routes } from "@/app/routes";
import { db } from "@/db/database";
import { useUnits } from "@/db/hooks";
import {
  createUnit,
  deleteUnit,
  type UnitInput,
  unitUsage,
  updateUnit,
} from "@/db/units";
import type { ID, Unit, UnitGroup } from "@/domain/model";
import {
  formatNumber,
  parseNumber,
  pieceUnit,
  UNIT_GROUPS,
  unitGroup,
  unitOptionLabel,
} from "@/domain/quantity";
import { fr } from "@/i18n/fr";
import { AddButton } from "@/ui/AddButton";
import { Button } from "@/ui/button";
import { Field, Select, TextInput, ConfirmActions } from "@/ui/form";
import { PageHeader, Section } from "@/ui/Page";
import { RowButton } from "@/ui/RowButton";
import { Sheet } from "@/ui/Sheet";
import { showToast } from "@/ui/toast";
import { feedback } from "@/feedback";
import { compareText } from "@/domain/slug";

const t = fr.manage.units;
const groupLabel = fr.list.unitGroups;

const dimensionOf = (group: UnitGroup): Unit["dimension"] =>
  group === "mass" ? "mass" : group === "volume" ? "volume" : "other";

/** Unités (docs/03 G4) : rangées par type, création, modification, suppression. */
export function UnitsPage() {
  const units = useUnits();
  // `null` : aucune fiche ; `""` : nouvelle unité ; sinon l'id de l'unité ouverte.
  const [open, setOpen] = useState<ID | null>(null);
  const editing = units?.find((u) => u.id === open);

  return (
    <>
      <PageHeader title={t.title} backTo={routes.settings} />
      <div className="px-4 pb-1">
        <AddButton
          label={t.add}
          onClick={() => {
            setOpen("");
          }}
        />
      </div>
      {UNIT_GROUPS.map((group) => {
        // Du plus petit au plus grand pour les poids et volumes, par nom sinon.
        const inGroup = (units ?? [])
          .filter((u) => unitGroup(u) === group)
          .sort(
            (a, b) =>
              (a.factor ?? 0) - (b.factor ?? 0) ||
              compareText(a.singular, b.singular),
          );
        if (inGroup.length === 0) return null;
        return (
          <Section key={group} title={groupLabel[group]} className="last:pb-6">
            <ul className="divide-y divide-border/50">
              {inGroup.map((unit) => (
                <li key={unit.id}>
                  <RowButton
                    title={unitOptionLabel(unit)}
                    chevron
                    onClick={() => {
                      setOpen(unit.id);
                    }}
                  />
                </li>
              ))}
            </ul>
          </Section>
        );
      })}
      {open !== null && units && (open === "" || editing) && (
        <UnitSheet
          key={open || "new"}
          unit={editing}
          units={units}
          onClose={() => {
            setOpen(null);
          }}
        />
      )}
    </>
  );
}

function UnitSheet({
  unit,
  units,
  onClose,
}: {
  unit: Unit | undefined;
  units: Unit[];
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [singular, setSingular] = useState(unit?.singular ?? "");
  const [plural, setPlural] = useState(unit?.plural ?? "");
  const [abbr, setAbbr] = useState(unit?.abbr ?? "");
  const [group, setGroup] = useState<UnitGroup>(
    unit ? unitGroup(unit) : "container",
  );
  const [factor, setFactor] = useState(
    unit?.factor ? formatNumber(unit.factor) : "",
  );
  const [step, setStep] = useState(formatNumber(unit?.step ?? 1));
  const others = units.filter((u) => u.id !== unit?.id);
  const sameDimension = (u: Unit) => u.dimension === unit?.dimension;
  const [replacement, setReplacement] = useState<ID>(
    (others.find(sameDimension) ?? pieceUnit(others) ?? others[0])?.id ?? "",
  );
  const usage = useLiveQuery(
    async () => (unit ? unitUsage(db, unit.id) : undefined),
    [unit?.id],
  );
  const measured = group === "mass" || group === "volume";

  const submit = () => {
    if (!singular.trim()) return;
    const input: UnitInput = {
      singular: singular.trim(),
      plural: plural.trim() || singular.trim(),
      abbr: abbr.trim() || undefined,
      group,
      dimension: dimensionOf(group),
      factor:
        measured && parseNumber(factor) > 0 ? parseNumber(factor) : undefined,
      step: parseNumber(step) > 0 ? parseNumber(step) : 1,
    };
    const done = (result: unknown) => {
      if (result === "nameTaken") showToast(t.nameTaken, { tone: "warning" });
      else onClose();
    };
    if (unit) void updateUnit(db, unit.id, input).then(done);
    else void createUnit(db, input).then(done);
  };

  const label = unit ? unitOptionLabel(unit) : t.newTitle;

  return (
    <Sheet
      autoFocus={!unit}
      onClose={() => {
        onClose();
      }}
      onBack={
        deleting
          ? () => {
              setDeleting(false);
            }
          : undefined
      }
      title={deleting ? t.deleteTitle(label) : label}
      description={deleting ? t.deleteText : undefined}
    >
      {deleting && unit ? (
        <div className="flex flex-col gap-4">
          {usage && (
            <p className="text-sm text-muted-foreground">
              {t.usage(usage.lines, usage.articles)}
            </p>
          )}
          <Field label={t.replaceWith}>
            <Select
              value={replacement}
              onChange={(event) => {
                setReplacement(event.target.value);
              }}
            >
              {[
                ...others.filter(sameDimension),
                ...others.filter((u) => !sameDimension(u)),
              ].map((u) => (
                <option key={u.id} value={u.id}>
                  {unitOptionLabel(u)}
                </option>
              ))}
            </Select>
          </Field>
          <ConfirmActions
            label={t.delete}
            disabled={!replacement}
            onConfirm={() => {
              void deleteUnit(db, unit.id, replacement).then(() => {
                feedback.remove();
                showToast(t.deleted(unit.singular), { tone: "success" });
              });
              onClose();
            }}
          />
        </div>
      ) : (
        <form
          className="flex flex-col gap-4 pb-1"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="flex gap-3">
            <Field label={t.singular} className="min-w-0 flex-1">
              <TextInput
                value={singular}
                onChange={(event) => {
                  setSingular(event.target.value);
                }}
              />
            </Field>
            <Field label={t.plural} className="min-w-0 flex-1">
              <TextInput
                value={plural}
                placeholder={singular}
                onChange={(event) => {
                  setPlural(event.target.value);
                }}
              />
            </Field>
          </div>
          <Field label={t.abbr}>
            <TextInput
              value={abbr}
              onChange={(event) => {
                setAbbr(event.target.value);
              }}
            />
          </Field>
          <p className="-mt-2 text-sm text-muted-foreground">{t.abbrHint}</p>
          <Field label={t.group}>
            <Select
              value={group}
              onChange={(event) => {
                setGroup(event.target.value as UnitGroup);
              }}
            >
              {UNIT_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {groupLabel[g]}
                </option>
              ))}
            </Select>
          </Field>
          {measured && (
            <>
              <Field label={t.factor(t.base[group])}>
                <TextInput
                  inputMode="decimal"
                  value={factor}
                  onChange={(event) => {
                    setFactor(event.target.value);
                  }}
                />
              </Field>
              <p className="-mt-2 text-sm text-muted-foreground">
                {t.factorHint(t.base[group])}
              </p>
            </>
          )}
          <Field label={t.step}>
            <TextInput
              inputMode="decimal"
              value={step}
              onChange={(event) => {
                setStep(event.target.value);
              }}
            />
          </Field>
          <Button type="submit" disabled={!singular.trim()}>
            {unit ? t.save : t.create}
          </Button>
          {unit && (
            <Button
              type="button"
              variant="dangerOutline"
              onClick={() => {
                setDeleting(true);
              }}
            >
              <Trash2 />
              {t.delete}
            </Button>
          )}
        </form>
      )}
    </Sheet>
  );
}
