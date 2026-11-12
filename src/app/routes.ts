/** Chemins de l'app (routage par hash : `#/reglages`…). */
export const routes = {
  list: "/",
  catalog: "/catalogue",
  catalogCategory: "/catalogue/:categoryId",
  settings: "/reglages",
  about: "/reglages/a-propos",
  licences: "/reglages/a-propos/licences",
  releaseNotes: "/reglages/a-propos/nouveautes",
  sounds: "/reglages/sons",
  devUi: "/dev/ui",
} as const;

/** Chemin des articles d'une catégorie du catalogue. */
export function catalogCategoryPath(categoryId: string): string {
  return routes.catalogCategory.replace(":categoryId", categoryId);
}
