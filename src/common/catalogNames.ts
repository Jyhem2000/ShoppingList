import { appLanguage } from "@/domain/language";

let names: ReadonlyMap<string, string> | undefined;

/**
 * Noms des articles du catalogue de départ dans la langue de l'app, par clé : un
 * partage n'envoie pas le nom d'un article qui l'a gardé (docs/02 § 9). Chargés à
 * part, peu après le démarrage (le catalogue est un fichier à part).
 */
export async function loadCatalogNames(): Promise<void> {
  if (names) return;
  const { catalogData } = await import("@/data/catalog");
  const language = appLanguage();
  names = new Map(
    catalogData.map((article) => [article.key, article.name[language]]),
  );
}

/** Nom d'origine d'un article du catalogue ; inconnu tant que rien n'est chargé. */
export function catalogName(key: string): string | undefined {
  return names?.get(key);
}
