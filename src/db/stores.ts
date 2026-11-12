import { storeTemplatesData } from "@/data";
import type { Aisle, Category, ID, Store } from "@/domain/model";
import { fr } from "@/i18n/fr";

/** Positions réparties uniformément sur [0, 1] (docs/07 § 7.6). */
function spread(index: number, count: number): number {
  return count > 1 ? index / (count - 1) : 0;
}

/**
 * Magasin créé à partir d'un modèle (docs/06 § 3) : ses rayons dans l'ordre du
 * modèle, plus « Non classé » en dernier.
 */
export function buildStore(
  templateKey: string,
  name: string,
  categories: readonly Category[],
  now: number,
  newId: () => ID = () => crypto.randomUUID(),
): { store: Store; aisles: Aisle[] } {
  const base = () => ({ id: newId(), createdAt: now, updatedAt: now });
  const template = storeTemplatesData.find((t) => t.key === templateKey);
  if (!template) throw new Error(`Modèle de magasin inconnu : ${templateKey}`);
  const categoryByKey = new Map(categories.map((c) => [c.catalogKey, c]));
  const store: Store = { ...base(), name, orderLocked: false };
  const aisles: Aisle[] = template.aisles.map((aisle, index) => ({
    ...base(),
    storeId: store.id,
    name: aisle.name.fr,
    icon: aisle.icon,
    color: aisle.color,
    position: spread(index, template.aisles.length),
    // Une catégorie supprimée par l'utilisateur est simplement ignorée.
    categories: aisle.categories.flatMap((c) => {
      const category = categoryByKey.get(c.category);
      return category ? [{ categoryId: category.id, primary: c.primary }] : [];
    }),
    isUnsorted: false,
  }));
  // Catégories système (« Autres », « Achats ponctuels ») : rayon « Non classé ».
  const system = categories.filter((category) => category.isSystem);
  aisles.push({
    ...base(),
    storeId: store.id,
    name: fr.defaults.unsortedAisle,
    icon: "shopping-basket",
    color: "gris",
    position: 1,
    categories: system.map((c) => ({ categoryId: c.id, primary: true })),
    isUnsorted: true,
  });
  return { store, aisles };
}
