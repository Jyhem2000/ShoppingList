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
  shopping: "/courses",
  shoppingRecap: "/courses/bilan/:sessionId",
  devUi: "/dev/ui",
} as const;

/** Bilan d'une session de courses. */
export function shoppingRecapPath(sessionId: string): string {
  return routes.shoppingRecap.replace(":sessionId", sessionId);
}

/** Chemin des articles d'une catégorie du catalogue. */
export function catalogCategoryPath(categoryId: string): string {
  return routes.catalogCategory.replace(":categoryId", categoryId);
}
