import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import { trackTheme } from "@/app/theme";
import { db } from "@/db/database";
import { loadIconPack } from "@/icons/pack";
import {
  captureInstallPrompt,
  currentInstallEnvironment,
} from "@/platform/install";
import { trackAppHeight } from "@/platform/viewport";
import "@/styles/index.css";

trackTheme();

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
// Chargé à part : le catalogue n'alourdit pas le premier affichage.
// Puis les nouveautés du catalogue, sans réinstaller (docs/06 § 7).
void import("@/db/seed")
  .then(({ seedDatabase }) => seedDatabase(db))
  .then(() => import("@/db/catalogUpdate"))
  .then(({ updateCatalog }) => updateCatalog(db))
  .catch((error: unknown) => {
    console.error("Initialisation des données impossible", error);
  });

const root = document.getElementById("root");
if (!root) throw new Error("Élément #root introuvable");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Pack d'icônes chargé dès que l'app est affichée : prêt avant d'en avoir besoin.
setTimeout(() => void loadIconPack(), 1000);
