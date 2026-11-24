/**
 * Démarrage de l'app, chargé par `src/main.tsx` une fois la langue posée.
 */
import { Dexie } from "dexie";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import { StartupError } from "@/app/StartupError";
import { trackTheme } from "@/app/theme";
import { CATALOG_VERSION } from "@/data/catalogVersion";
import { db } from "@/db/database";
import { loadIconPack } from "@/icons/pack";
import { reportSaveError } from "@/ui/toast";
import {
  captureInstallPrompt,
  currentInstallEnvironment,
} from "@/platform/install";
import { trackAppHeight } from "@/platform/viewport";

trackTheme();

const root = document.getElementById("root");
if (!root) throw new Error("Élément #root introuvable");
const reactRoot = createRoot(root);

// iPhone : un champ qui garde le focus en arrière-plan fait proposer « Annuler la
// saisie » quand on secoue le téléphone en le reprenant. On rend le focus en partant.
document.addEventListener("visibilitychange", () => {
  if (
    document.visibilityState === "hidden" &&
    document.activeElement instanceof HTMLElement
  )
    document.activeElement.blur();
});
captureInstallPrompt();
trackAppHeight();

// Demande au navigateur de ne pas effacer les données de l'app (docs/03 H5).
// Silencieux : accordé d'office aux apps installées sur Android ; demandé une fois installée.
if (currentInstallEnvironment().standalone && "storage" in navigator) {
  navigator.storage.persist().catch(() => {
    // Refus ou API absente : l'app fonctionne quand même.
  });
}

// Premier lancement : données initiales copiées dans la base (docs/02 § 10).
// Puis la copie automatique du jour (docs/03 H4), avant toute modification, et les
// nouveautés du catalogue, sans réinstaller (docs/06 § 7). Données initiales et
// catalogue ne sont chargés (fichiers à part) que s'il y a quelque chose à faire.
const dailyCopy = () =>
  import("@/db/copies").then(({ takeDailyCopy }) => takeDailyCopy(db));
const ready = (async () => {
  const settings = (await db.meta.get("settings"))?.value;
  if (!settings) await (await import("@/db/seed")).seedDatabase(db);
  await dailyCopy();
  // Écrit « pas à jour » plutôt que « plus ancienne » : une version absente (réglages
  // d'une ancienne sauvegarde) passe aussi par la mise à jour, qui la pose.
  if (settings && !(settings.catalogVersion >= CATALOG_VERSION))
    await (await import("@/db/catalogUpdate")).updateCatalog(db);
})().catch((error: unknown) => {
  console.error("Initialisation des données impossible", error);
  // Base fermée ou inaccessible : un écran clair plutôt que « Chargement… » sans fin.
  if (!db.isOpen()) reactRoot.render(<StartupError />);
});

// Une écriture en base qui échoue sans être attendue (`void écriture(…)`) : un seul
// message pour toutes, plutôt qu'un `catch` à chaque appel.
window.addEventListener("unhandledrejection", (event) => {
  if (event.reason instanceof Dexie.DexieError) reportSaveError();
});

// Une app installée reste souvent ouverte plusieurs jours : copie du jour au retour,
// jamais avant la fin de l'initialisation (sinon, au premier lancement, la copie du
// jour pourrait être celle d'une base encore vide).
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible")
    ready.then(dailyCopy).catch((error: unknown) => {
      console.error("Copie automatique impossible", error);
    });
});

reactRoot.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Pack d'icônes chargé dès que l'app est affichée : prêt avant d'en avoir besoin.
setTimeout(() => void loadIconPack(), 1000);
