import { DEFAULT_STORE_TEMPLATE, storeTemplatesData } from "@/data";
import type { ShoppingDatabase } from "@/db/database";
import type { Aisle, Article } from "@/domain/model";
import { sortAisles } from "@/domain/stores";
import { slugify } from "@/domain/slug";
import { buildInitialData } from "@/db/seed";

/**
 * Données des tests de logique (recherche, saisie, tri par rayon).
 *
 * Unités, catégories et magasin viennent des données initiales ; les articles sont
 * propres aux tests, pour que la relecture du catalogue (libellés, quantités,
 * alias) ne casse jamais un test de logique.
 */
const initial = buildInitialData(0);

/**
 * Les rayons sont créés sans nom (numérotés, docs/02 § 4). Les tests les désignent par
 * le nom que leur donne le modèle « Supermarché » (« Crèmerie »…), dans l'ordre.
 */
export function withTemplateNames<A extends Aisle>(aisles: A[]): A[] {
  const template = storeTemplatesData.find(
    (t) => t.key === DEFAULT_STORE_TEMPLATE,
  );
  sortAisles(aisles)
    .filter((a) => !a.isUnsorted)
    .forEach((a, index) => {
      a.name = template?.aisles[index]?.name.fr ?? a.name;
    });
  return aisles;
}

/** Même chose dans une base remplie par `seedDatabase`. */
export async function nameSeededAisles(db: ShoppingDatabase): Promise<void> {
  await db.aisles.bulkPut(withTemplateNames(await db.aisles.toArray()));
}

withTemplateNames(initial.aisles);

export const { units, categories, store, aisles, list } = initial;

interface TestArticle {
  category: string;
  unit: string;
  quantity?: number;
  aliases?: string[];
  types?: string[];
  generic?: boolean;
}

const definitions: Record<string, TestArticle> = {
  Pommes: {
    category: "fruits",
    unit: "kg",
    types: ["Gala", "Golden", "Granny Smith"],
  },
  "Fruits au choix": { category: "fruits", unit: "piece", generic: true },
  Bananes: { category: "fruits", unit: "piece", quantity: 6 },
  Cerises: { category: "fruits", unit: "kg", quantity: 0.5 },
  Citrons: {
    category: "fruits",
    unit: "piece",
    quantity: 3,
    types: ["jaunes", "verts"],
  },
  Tomates: { category: "legumes", unit: "kg", types: ["cerises", "grappe"] },
  Carottes: { category: "legumes", unit: "kg" },
  "Pommes de terre": { category: "legumes", unit: "kg", aliases: ["pdt"] },
  Champignons: {
    category: "legumes",
    unit: "barquette",
    types: ["de Paris", "girolles"],
  },
  Baguette: { category: "pain-viennoiseries", unit: "piece" },
  Pain: { category: "pain-viennoiseries", unit: "piece" },
  "Pain de mie": { category: "pain-viennoiseries", unit: "paquet" },
  "Pains au chocolat": {
    category: "pain-viennoiseries",
    unit: "piece",
    aliases: ["chocolatine"],
  },
  Bœuf: { category: "viande", unit: "g", quantity: 500 },
  Porc: { category: "viande", unit: "g", quantity: 500 },
  "Steaks hachés": { category: "viande", unit: "piece", quantity: 2 },
  Œufs: { category: "oeufs", unit: "piece", quantity: 6 },
  Lait: { category: "lait-creme-beurre", unit: "l", quantity: 6 },
  Pâté: { category: "charcuterie", unit: "pot", types: ["de campagne"] },
  Pâtes: { category: "pates-riz-feculents", unit: "paquet" },
  Beurre: { category: "lait-creme-beurre", unit: "g", quantity: 250 },
  "Crème fraîche": {
    category: "lait-creme-beurre",
    unit: "piece",
    aliases: ["crème"],
    types: ["épaisse", "liquide"],
  },
  Compotes: {
    category: "yaourts-desserts",
    unit: "piece",
    quantity: 4,
    types: ["pomme", "poire"],
  },
  Comté: { category: "fromages", unit: "g", quantity: 250 },
  Farine: { category: "farine-sucre-patisserie", unit: "paquet" },
  "Tomates concassées": { category: "conserves-bocaux", unit: "boite" },
  "Sauce tomate": { category: "sauces-condiments", unit: "pot" },
  Moutarde: { category: "sauces-condiments", unit: "pot" },
  Sel: { category: "sauces-condiments", unit: "paquet" },
  "Lait de coco": { category: "sauces-condiments", unit: "boite" },
  "Huile d'olive": { category: "huiles-vinaigres", unit: "bouteille" },
  Chips: { category: "aperitif", unit: "sachet" },
  Miel: { category: "confitures-tartiner", unit: "pot" },
  Café: { category: "cafe-the", unit: "paquet" },
  "Jus de fruits": {
    category: "jus-sodas",
    unit: "bouteille",
    aliases: ["jus"],
    types: ["orange", "pomme"],
  },
  "Coca-Cola": {
    category: "jus-sodas",
    unit: "bouteille",
    aliases: ["coca"],
  },
  "Papier toilette": {
    category: "papier-mouchoirs",
    unit: "piece",
    quantity: 6,
  },
  "Essuie-tout": {
    category: "papier-mouchoirs",
    unit: "piece",
    quantity: 4,
    aliases: ["sopalin"],
  },
  Lessive: { category: "entretien", unit: "bouteille" },
};

function idOf<T extends { id: string }>(
  items: T[],
  match: (item: T) => boolean,
  what: string,
): string {
  const found = items.find(match);
  if (!found) throw new Error(`Donnée de test inconnue : ${what}`);
  return found.id;
}

export const articles: Article[] = Object.entries(definitions).map(
  ([name, a]) => ({
    id: `article-${slugify(name)}`,
    createdAt: 0,
    updatedAt: 0,
    slug: slugify(name),
    name,
    categoryId: idOf(
      categories,
      (c) => c.catalogKey === a.category,
      a.category,
    ),
    defaultUnitId: idOf(units, (u) => u.slug === a.unit, a.unit),
    defaultQuantity: a.quantity,
    generic: a.generic,
    types: a.types ?? [],
    aliases: (a.aliases ?? []).map(slugify),
    favorite: false,
    barcodes: [],
    notDuplicateOf: [],
  }),
);

export function article(name: string): Article {
  const found = articles.find((a) => a.name === name);
  if (!found) throw new Error(`Article de test inconnu : ${name}`);
  return found;
}

export function unit(slug: string) {
  const found = units.find((u) => u.slug === slug);
  if (!found) throw new Error(`Unité inconnue : ${slug}`);
  return found;
}
