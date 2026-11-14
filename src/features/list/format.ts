import { categoriesData, familiesData } from "@/data";
import { formatQuantity } from "@/domain/quantity";
import type {
  Aisle,
  Article,
  Category,
  ID,
  ListItem,
  Unit,
} from "@/domain/model";
import { aisleContents, aisleTitle } from "@/domain/stores";
import { fr } from "@/i18n/fr";

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

/** Nom court d'une catégorie (docs/02 § 4) : le sien, sinon celui du catalogue, sinon son nom. */
export function categoryShortName(
  category: Pick<Category, "name" | "shortName" | "catalogKey">,
): string {
  const own = category.shortName?.trim();
  if (own) return own;
  const data = category.catalogKey
    ? catalogCategories.get(category.catalogKey)
    : undefined;
  return data?.short?.fr ?? category.name;
}

const catalogCategories = new Map(categoriesData.map((c) => [c.key, c]));
const familyNames = new Map(familiesData.map((f) => [f.key, f.name.fr]));

/** Nom de la famille d'une catégorie du catalogue (« Épicerie sucrée »). */
function categoryFamily(
  category: Pick<Category, "catalogKey">,
): string | undefined {
  const key = category.catalogKey
    ? catalogCategories.get(category.catalogKey)?.family
    : undefined;
  return key ? familyNames.get(key) : undefined;
}

/** Poids d'une catégorie pour le titre d'un rayon : le nombre d'achats de ses articles. */
export function categoryWeights(
  articles: readonly Pick<Article, "id" | "categoryId">[],
  purchaseCounts: ReadonlyMap<ID, number>,
): Map<ID, number> {
  const weights = new Map<ID, number>();
  for (const article of articles) {
    const count = purchaseCounts.get(article.id) ?? 0;
    if (count)
      weights.set(
        article.categoryId,
        (weights.get(article.categoryId) ?? 0) + count,
      );
  }
  return weights;
}

/** Comment désigner un rayon à l'écran (docs/02 § 4). */
export interface AisleText {
  /** « Rayon », au-dessus du titre ; absent pour « À placer ». */
  kicker?: string;
  /** Son nom, sinon le titre tiré de ses catégories (« Pain · Café & thé +2 »). */
  title: string;
  /** Seul, dans un message ou un titre de panneau : « Rayon Pain · Café & thé +2 ». */
  label: string;
  /** Dans une phrase : « au rayon Fruits », « dans « À placer » ». */
  into: string;
  /** Toutes ses catégories principales, quand il n'a pas de nom. */
  contents?: string;
  description?: string;
  /** Le titre qu'il aurait sans nom (indication du champ nom). */
  automatic: string;
}

export function aisleText(
  aisle: Pick<Aisle, "name" | "description" | "categories" | "isUnsorted">,
  categoryById: ReadonlyMap<
    ID,
    Pick<Category, "name" | "shortName" | "catalogKey">
  >,
  weights: ReadonlyMap<ID, number> = new Map(),
): AisleText {
  const a = fr.aisles;
  // Chaînes vides = absentes.
  const name = aisle.name.trim() ? aisle.name.trim() : undefined;
  const description = aisle.description?.trim()
    ? aisle.description.trim()
    : undefined;
  if (aisle.isUnsorted) {
    const title = a.unplaced;
    return {
      title,
      label: title,
      into: a.intoUnplaced,
      description,
      automatic: title,
    };
  }
  const automatic =
    aisleTitle(
      aisle,
      (id) => {
        const category = categoryById.get(id);
        return category
          ? {
              short: categoryShortName(category),
              family: categoryFamily(category),
            }
          : undefined;
      },
      (id) => weights.get(id) ?? 0,
    ) ?? a.newAisle;
  const categories = aisleContents(aisle, (id) => categoryById.get(id)?.name);
  const title = name ?? automatic;
  return {
    kicker: a.kicker,
    title,
    label: a.label(title),
    into: a.into(title),
    contents:
      name === undefined && categories.length > 1
        ? categories.join(" · ")
        : undefined,
    description,
    automatic,
  };
}
