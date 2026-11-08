import { useState } from "react";
import { RouterProvider } from "react-router";
import { InstallScreen } from "@/features/settings/InstallScreen";
import {
  currentInstallEnvironment,
  detectInstallContext,
} from "@/platform/install";
import { UpdateBanner } from "./pwa/UpdateBanner";
import { router } from "./router";

const SKIP_INSTALL_KEY = "shoppinglist.skipInstall";

function readSkip(): boolean {
  try {
    return localStorage.getItem(SKIP_INSTALL_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Racine : propose d'abord d'installer l'app quand elle est ouverte dans le
 * navigateur (docs/04 § 2.11), puis affiche l'app.
 */
export function App() {
  const [context] = useState(() =>
    detectInstallContext(currentInstallEnvironment()),
  );
  const [skipped, setSkipped] = useState(readSkip);

  const showInstall = context.kind !== "installed" && !skipped;

  return (
    <>
      {/* Toujours monté : enregistre le service worker (hors ligne, mises à jour). */}
      <UpdateBanner />
      {showInstall ? (
        <InstallScreen
          context={context}
          onContinue={() => {
            try {
              localStorage.setItem(SKIP_INSTALL_KEY, "1");
            } catch {
              // Navigation privée : on continue sans mémoriser.
            }
            setSkipped(true);
          }}
        />
      ) : (
        <RouterProvider router={router} />
      )}
    </>
  );
}
