import { formatQuantity } from "@/domain/quantity";
import type { Aisle, Category, ID, ListItem, Unit } from "@/domain/model";
import { aisleContents } from "@/domain/stores";
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

/** Comment désigner un rayon à l'écran (docs/02 § 4, docs/04 § 2.4). */
export interface AisleText {
  /** « Rayon 3 », au-dessus du titre ; absent pour « Non classé ». */
  kicker?: string;
  /** Titre : son nom, sinon ses catégories principales, sinon « Rayon 3 ». */
  title: string;
  /** Nom court, dans un choix ou un message : « Rayon 3 · Boulangerie », « Rayon 3 ». */
  label: string;
  /** Dans une phrase : « au rayon 3 (Boulangerie) », « dans « Non classé » ». */
  into: string;
  /** Ses catégories principales, quand il n'a pas de nom. */
  contents?: string;
  description?: string;
}

export function aisleText(
  aisle: Pick<Aisle, "name" | "description" | "categories" | "isUnsorted">,
  number: number | undefined,
  categoryById: ReadonlyMap<ID, Pick<Category, "name">>,
): AisleText {
  const a = fr.aisles;
  // Chaînes vides = absentes.
  const name = aisle.name.trim() ? aisle.name.trim() : undefined;
  const description = aisle.description?.trim()
    ? aisle.description.trim()
    : undefined;
  if (aisle.isUnsorted || number === undefined) {
    const title = name ?? fr.defaults.unsortedAisle;
    return { title, label: title, into: a.intoUnsorted(title), description };
  }
  const numbered = a.number(number);
  const categories = aisleContents(aisle, (id) => categoryById.get(id)?.name);
  const contents =
    name === undefined && categories.length > 0
      ? categories.join(" · ")
      : undefined;
  const title = name ?? contents ?? numbered;
  return {
    kicker: title === numbered ? undefined : numbered,
    title,
    label: name ? `${numbered} · ${name}` : numbered,
    into: a.into(number, name),
    contents,
    description,
  };
}

/** Couleur de palette d'une catégorie ou d'un rayon (gris si inconnue). */
export function paletteColor(color: string | undefined): PaletteColor {
  return paletteColors.find((c) => c === color) ?? "gris";
}
