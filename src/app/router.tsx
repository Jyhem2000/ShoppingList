import { createHashRouter } from "react-router";
import { CatalogPage } from "@/features/catalog/CatalogPage";
import { CategoryPage } from "@/features/catalog/CategoryPage";
import { UiPage } from "@/features/dev/UiPage";
import { ArticlePage } from "@/features/manage/ArticlePage";
import { ArticlesPage } from "@/features/manage/ArticlesPage";
import { CategoriesPage } from "@/features/manage/CategoriesPage";
import { StorePage } from "@/features/manage/StorePage";
import { StoresPage } from "@/features/manage/StoresPage";
import { UnitsPage } from "@/features/manage/UnitsPage";
import { ListPage } from "@/features/list/ListPage";
import { RecapPage } from "@/features/shopping/RecapPage";
import { ShoppingPage } from "@/features/shopping/ShoppingPage";
import { AboutPage } from "@/features/settings/AboutPage";
import { BackupPage } from "@/features/settings/BackupPage";
import { LicencesPage } from "@/features/settings/LicencesPage";
import { PreferencesPage } from "@/features/settings/PreferencesPage";
import { ReleaseNotesPage } from "@/features/settings/ReleaseNotesPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { SoundsPage } from "@/features/settings/SoundsPage";
import { Layout } from "./Layout";
import { routes } from "./routes";

export const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: routes.list, element: <ListPage /> },
      { path: routes.catalog, element: <CatalogPage /> },
      { path: routes.catalogCategory, element: <CategoryPage /> },
      { path: routes.settings, element: <SettingsPage /> },
      { path: routes.about, element: <AboutPage /> },
      { path: routes.licences, element: <LicencesPage /> },
      { path: routes.releaseNotes, element: <ReleaseNotesPage /> },
      { path: routes.preferences, element: <PreferencesPage /> },
      { path: routes.sounds, element: <SoundsPage /> },
      { path: routes.backup, element: <BackupPage /> },
      { path: routes.shopping, element: <ShoppingPage /> },
      { path: routes.shoppingRecap, element: <RecapPage /> },
      { path: routes.manageArticles, element: <ArticlesPage /> },
      { path: routes.manageArticle, element: <ArticlePage /> },
      { path: routes.manageCategories, element: <CategoriesPage /> },
      { path: routes.manageUnits, element: <UnitsPage /> },
      { path: routes.manageStores, element: <StoresPage /> },
      { path: routes.manageStore, element: <StorePage /> },
      { path: routes.devUi, element: <UiPage /> },
      { path: "*", element: <ListPage /> },
    ],
  },
]);
