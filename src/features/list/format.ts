import { formatQuantity } from "@/domain/quantity";
import type { ID, ListItem, Unit } from "@/domain/model";
import { fr } from "@/i18n/fr";
import { paletteColors, type PaletteColor } from "@/ui/palette";

const t = fr.list;

/** « Gala uniquement », « Gala ou Golden », puis la note (docs/02 § 6). */
export function lineDetails(
  item: Pick<ListItem, "acceptedTypes" | "note">,
): string | undefined {
  const types =
    item.acceptedTypes.length === 1
      ? t.typesOne(item.acceptedTypes[0] ?? "")
      : item.acceptedTypes.length > 1
        ? t.typesMany(item.acceptedTypes)
        : undefined;
  const parts = [types, item.note?.trim()].filter(Boolean);
  return parts.length ? parts.join(" · ") : undefined;
}

export function lineQuantity(
  item: Pick<ListItem, "quantity" | "unitId">,
  unitById: ReadonlyMap<ID, Unit>,
  style: "short" | "long" = "short",
): string {
  const unit = unitById.get(item.unitId);
  return unit ? formatQuantity(item.quantity, unit, style) : "";
}

/** Couleur de palette d'une catégorie ou d'un rayon (gris si inconnue). */
export function paletteColor(color: string | undefined): PaletteColor {
  return paletteColors.find((c) => c === color) ?? "gris";
}
