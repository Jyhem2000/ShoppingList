import type { ByLanguage, Language } from "./language";
import { slugify } from "./slug";

/**
 * Textes du catalogue de départ (`src/data`), rangés par langue, et leur lecture dans
 * une langue : la même pour la première installation, l'import d'un partage et le
 * changement de langue (docs/06 § 4).
 */
export interface CatalogArticleTexts {
  key: string;
  name: ByLanguage<string>;
  aliases?: ByLanguage<string[]>;
  types?: ByLanguage<string[]>;
}

export interface CatalogCategoryTexts {
  key: string;
  name: ByLanguage<string>;
}

export interface UnitName {
  singular: string;
  plural: string;
  abbr?: string;
}

export interface CatalogUnitTexts {
  key: string;
  name: ByLanguage<UnitName>;
  aliases?: ByLanguage<string[]>;
}

/** Les textes du catalogue de départ, par langue. */
export interface CatalogTexts {
  articles: readonly CatalogArticleTexts[];
  categories: readonly CatalogCategoryTexts[];
  units: readonly CatalogUnitTexts[];
}

/**
 * Un article du catalogue dans une langue : nom, slug, alias (slugs, sans doublon ni
 * le slug du nom) et types.
 */
export function articleTexts(data: CatalogArticleTexts, language: Language) {
  const name = data.name[language];
  const slug = slugify(name);
  const aliases = [
    ...new Set((data.aliases?.[language] ?? []).map(slugify)),
  ].filter((alias) => alias !== slug);
  return { name, slug, aliases, types: data.types?.[language] ?? [] };
}

/** Une catégorie du catalogue dans une langue : nom et slug. */
export function categoryTexts(data: CatalogCategoryTexts, language: Language) {
  const name = data.name[language];
  return { name, slug: slugify(name) };
}

/** Une unité du catalogue dans une langue : noms, abréviation et alias. */
export function unitTexts(data: CatalogUnitTexts, language: Language) {
  const { singular, plural, abbr } = data.name[language];
  return { singular, plural, abbr, aliases: data.aliases?.[language] ?? [] };
}

/** Mêmes noms et même abréviation (absente = vide). */
export function sameUnitName(a: UnitName, b: UnitName): boolean {
  return (
    a.singular === b.singular &&
    a.plural === b.plural &&
    (a.abbr ?? "") === (b.abbr ?? "")
  );
}
