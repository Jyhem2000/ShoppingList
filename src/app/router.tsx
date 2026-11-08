import { createHashRouter } from "react-router";
import { CatalogPage } from "@/features/catalog/CatalogPage";
import { DiagnosticPage } from "@/features/diagnostic/DiagnosticPage";
import { ListPage } from "@/features/list/ListPage";
import { AboutPage } from "@/features/settings/AboutPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { Layout } from "./Layout";
import { routes } from "./routes";

export const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: routes.list, element: <ListPage /> },
      { path: routes.catalog, element: <CatalogPage /> },
      { path: routes.settings, element: <SettingsPage /> },
      { path: routes.about, element: <AboutPage /> },
      { path: routes.diagnostic, element: <DiagnosticPage /> },
      { path: "*", element: <ListPage /> },
    ],
  },
]);
