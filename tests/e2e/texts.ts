import categories from "../../src/data/categories.json" with { type: "json" };
import { fr } from "../../src/i18n/fr";

/**
 * Textes attendus à l'écran, lus là où l'app les prend (docs/08 § 3) : un texte retouché
 * dans `src/i18n/fr.ts` ou `src/data/categories.json` ne casse pas les scénarios.
 * Les noms d'articles restent écrits dans les scénarios : c'est ce que l'on tape.
 */
export { fr };

function find(key: string) {
  const category = categories.find((candidate) => candidate.key === key);
  if (!category) throw new Error(`Catégorie inconnue : ${key}`);
  return category;
}

/** Nom d'une catégorie des données initiales (titre de groupe dans la liste). */
export function category(key: string): string {
  return find(key).name.fr;
}

/** Nom court d'une catégorie : titre d'un rayon sans nom (docs/02 § 4). */
export function short(key: string): string {
  const category = find(key);
  return category.short?.fr ?? category.name.fr;
}

/** Titre d'un groupe en mode courses : « Rayon : Pain · Fruits ». */
export function aisle(...keys: string[]): string {
  return `${fr.aisles.kicker} : ${keys.map(short).join(" · ")}`;
}
