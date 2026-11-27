import { createHashRouter, type RouteObject } from "react-router";
import { CatalogPage } from "@/features/catalog/CatalogPage";
import { CategoryPage } from "@/features/catalog/CategoryPage";
import { ListPage } from "@/features/list/ListPage";
import { RecipePage } from "@/features/recipes/RecipePage";
import { RecipesPage } from "@/features/recipes/RecipesPage";
import { RecapPage } from "@/features/shopping/RecapPage";
import { ShoppingPage } from "@/features/shopping/ShoppingPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { TourPage } from "@/features/suggestions/TourPage";
import { texts } from "@/i18n";
import { Loading } from "@/ui/Page";
import { Layout } from "./Layout";
import { ScreenError } from "./ScreenError";
import { routes } from "./routes";

/**
 * Écrans rares (sous-pages des Réglages, Gérer, import, maquette) : chargés à leur
 * première ouverture, pour alléger le démarrage. L'app installée les garde en cache
 * avec le reste : ils s'ouvrent aussi hors ligne.
 */
const later = (
  path: string,
  load: () => Promise<RouteObject["Component"]>,
): RouteObject => ({
  path,
  lazy: async () => ({ Component: await load() }),
});

export const router = createHashRouter([
  {
    element: <Layout />,
    // Écran différé ouvert au lancement (lien de partage…) : le temps de le charger.
    hydrateFallbackElement: <Loading>{texts.list.loading}</Loading>,
    children: [
      {
        // Un écran qui ne s'ouvre pas (fichier non chargé…) : message à sa place,
        // la barre d'onglets reste.
        errorElement: <ScreenError />,
        children: [
          { path: routes.list, element: <ListPage /> },
          { path: routes.tour, element: <TourPage /> },
          { path: routes.catalog, element: <CatalogPage /> },
          { path: routes.catalogCategory, element: <CategoryPage /> },
          { path: routes.recipes, element: <RecipesPage /> },
          { path: routes.recipe, element: <RecipePage /> },
          { path: routes.settings, element: <SettingsPage /> },
          { path: routes.shopping, element: <ShoppingPage /> },
          { path: routes.shoppingRecap, element: <RecapPage /> },
          later(
            routes.about,
            async () =>
              (await import("@/features/settings/AboutPage")).AboutPage,
          ),
          later(
            routes.licences,
            async () =>
              (await import("@/features/settings/LicencesPage")).LicencesPage,
          ),
          later(
            routes.releaseNotes,
            async () =>
              (await import("@/features/settings/ReleaseNotesPage"))
                .ReleaseNotesPage,
          ),
          later(
            routes.preferences,
            async () =>
              (await import("@/features/settings/PreferencesPage"))
                .PreferencesPage,
          ),
          later(
            routes.sounds,
            async () =>
              (await import("@/features/settings/SoundsPage")).SoundsPage,
          ),
          later(
            routes.backup,
            async () =>
              (await import("@/features/settings/BackupPage")).BackupPage,
          ),
          later(
            routes.help,
            async () => (await import("@/features/settings/HelpPage")).HelpPage,
          ),
          later(
            routes.manageArticles,
            async () =>
              (await import("@/features/manage/ArticlesPage")).ArticlesPage,
          ),
          later(
            routes.manageArticle,
            async () =>
              (await import("@/features/manage/ArticlePage")).ArticlePage,
          ),
          later(
            routes.manageCategories,
            async () =>
              (await import("@/features/manage/CategoriesPage")).CategoriesPage,
          ),
          later(
            routes.manageUnits,
            async () => (await import("@/features/manage/UnitsPage")).UnitsPage,
          ),
          later(
            routes.manageStores,
            async () =>
              (await import("@/features/manage/StoresPage")).StoresPage,
          ),
          later(
            routes.manageStore,
            async () => (await import("@/features/manage/StorePage")).StorePage,
          ),
          later(
            routes.import,
            async () =>
              (await import("@/features/share/ImportPage")).ImportPage,
          ),
          // Maquette des composants, hors production (docs/05 § 4) : absente de l'app publiée.
          ...(__APP_CHANNEL__ === "production"
            ? []
            : [
                later(
                  routes.devUi,
                  async () => (await import("@/features/dev/UiPage")).UiPage,
                ),
              ]),
          { path: "*", element: <ListPage /> },
        ],
      },
    ],
  },
]);
