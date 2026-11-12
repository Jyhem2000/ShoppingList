import { useState } from "react";
import { RouterProvider } from "react-router";
import { InstallScreen } from "@/features/settings/InstallScreen";
import {
  currentInstallEnvironment,
  detectInstallContext,
} from "@/platform/install";
import { UpdateWatcher } from "./pwa/UpdateBanner";
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
    // Cadre plein écran fixe (dans la page au lancement sur iPhone, voir platform/viewport) :
    // seul le contenu défile (voir Layout).
    <div
      data-app-frame
      className="fixed inset-x-0 top-0 flex h-(--app-height,100dvh) flex-col bg-bg"
    >
      {/* Zone de la barre d'état, opaque : rien ne passe jamais dessous. */}
      <div
        aria-hidden
        className="h-[env(safe-area-inset-top)] shrink-0 bg-bg"
      />
      {/* Toujours monté : enregistre le service worker (le bandeau est dans Layout). */}
      <UpdateWatcher />
      <div className="min-h-0 flex-1">
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
      </div>
    </div>
  );
}
