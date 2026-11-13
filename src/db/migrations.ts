import { storeTemplatesData } from "@/data";
import type { Aisle } from "@/domain/model";

/**
 * Migrations des données (docs/07 § 5), partagées par la mise à jour de la base et par
 * l'import d'une sauvegarde plus ancienne.
 */

/** Noms des rayons de tous les modèles de magasin (docs/06 § 3). */
const templateAisleNames = new Set(
  storeTemplatesData.flatMap((template) =>
    template.aisles.map((aisle) => aisle.name.fr),
  ),
);

/**
 * Schéma 2 (13 novembre 2026) : les rayons sont numérotés dans l'ordre de passage et
 * leur nom devient facultatif. Un nom resté tel que le modèle l'avait donné
 * (« Boulangerie ») est retiré : il décrivait souvent mal le vrai rayon. Un nom tapé
 * ou modifié par l'utilisateur est gardé. Renvoie `true` si le rayon a changé.
 */
export function clearTemplateAisleName(aisle: Aisle): boolean {
  if (aisle.isUnsorted || !templateAisleNames.has(aisle.name)) return false;
  aisle.name = "";
  return true;
}
