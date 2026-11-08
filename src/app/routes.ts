/** Chemins de l'app (routage par hash : `#/reglages`…). */
export const routes = {
  list: "/",
  catalog: "/catalogue",
  settings: "/reglages",
  about: "/reglages/a-propos",
  licences: "/reglages/a-propos/licences",
  releaseNotes: "/reglages/a-propos/nouveautes",
  sounds: "/reglages/sons",
} as const;
