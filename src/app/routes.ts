/** Chemins de l'app (routage par hash : `#/reglages`…). */
export const routes = {
  list: "/",
  catalog: "/catalogue",
  catalogCategory: "/catalogue/:categoryId",
  settings: "/reglages",
  about: "/reglages/a-propos",
  licences: "/reglages/a-propos/licences",
  releaseNotes: "/reglages/a-propos/nouveautes",
  preferences: "/reglages/preferences",
  sounds: "/reglages/preferences/sons",
  backup: "/reglages/sauvegarde",
  shopping: "/courses",
  shoppingRecap: "/courses/bilan/:sessionId",
  manageArticles: "/reglages/articles",
  manageArticle: "/reglages/articles/:articleId",
  manageCategories: "/reglages/categories",
  manageUnits: "/reglages/unites",
  manageStores: "/reglages/magasins",
  manageStore: "/reglages/magasins/:storeId",
  devUi: "/dev/ui",
} as const;

/** Fiche d'un article. */
export function manageArticlePath(articleId: string): string {
  return routes.manageArticle.replace(":articleId", articleId);
}

/** Fiche d'un magasin (rayons, catégories). */
export function manageStorePath(storeId: string): string {
  return routes.manageStore.replace(":storeId", storeId);
}

/** Bilan d'une session de courses. */
export function shoppingRecapPath(sessionId: string): string {
  return routes.shoppingRecap.replace(":sessionId", sessionId);
}

/** Chemin des articles d'une catégorie du catalogue. */
export function catalogCategoryPath(categoryId: string): string {
  return routes.catalogCategory.replace(":categoryId", categoryId);
}
