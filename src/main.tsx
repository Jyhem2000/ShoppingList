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
// Puis la copie automatique du jour (docs/03 H4), avant toute modification, et les
// nouveautés du catalogue, sans réinstaller (docs/06 § 7).
const dailyCopy = () =>
  import("@/db/copies").then(({ takeDailyCopy }) => takeDailyCopy(db));
void import("@/db/seed")
  .then(({ seedDatabase }) => seedDatabase(db))
  .then(dailyCopy)
  .then(() => import("@/db/catalogUpdate"))
  .then(({ updateCatalog }) => updateCatalog(db))
  .catch((error: unknown) => {
    console.error("Initialisation des données impossible", error);
  });

// Une app installée reste souvent ouverte plusieurs jours : copie du jour au retour.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible")
    dailyCopy().catch((error: unknown) => {
      console.error("Copie automatique impossible", error);
    });
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
