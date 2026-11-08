import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import {
  captureInstallPrompt,
  currentInstallEnvironment,
} from "@/platform/install";
import "@/styles/index.css";

captureInstallPrompt();

// Demande au navigateur de ne pas effacer les données de l'app (docs/03 H5).
// Silencieux : accordé d'office aux apps installées sur Android ; demandé une fois installée.
if (currentInstallEnvironment().standalone && "storage" in navigator) {
  navigator.storage.persist().catch(() => {
    // Refus ou API absente : l'app fonctionne quand même.
  });
}

const root = document.getElementById("root");
if (!root) throw new Error("Élément #root introuvable");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
