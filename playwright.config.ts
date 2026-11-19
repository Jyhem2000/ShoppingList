import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

/**
 * Scénarios de bout en bout (docs/08) : chaque test tourne sur
 * - un iPhone émulé avec WebKit (moteur de tous les navigateurs iPhone),
 * - un téléphone Android émulé avec Chromium.
 */
export default defineConfig({
  testDir: "tests/e2e",
  // Résultats rangés avec les tests (ignorés par git).
  outputDir: "tests/e2e/.results",
  fullyParallel: true,
  // Trois scénarios à la fois : à quatre (la moitié des 8 cœurs), WebKit sous Windows
  // cesse plus souvent de redessiner la page et les scénarios iPhone dépassent leur
  // délai ; à trois, la suite est verte et plus rapide (docs/08 § 3, 17 novembre 2026).
  workers: 3,
  // Le premier lancement copie le catalogue dans IndexedDB : environ 11 s avec le
  // WebKit de Playwright sous Windows. `enterApp` (tests/e2e/app.ts) l'attend avec
  // son propre délai ; ensuite, 10 s suffisent largement.
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "tests/e2e/.report" }],
  ],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "fr-FR",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "iphone",
      use: { ...devices["iPhone 15"] },
      // WebKit sous Windows cesse parfois un moment de redessiner la page (docs/08 § 3) :
      // un échec isolé est rejoué une fois et signalé « flaky » ; deux échecs, c'est un
      // vrai problème. Ces pauses (jusqu'à une dizaine de secondes) demandent aussi plus
      // de temps par scénario.
      retries: 1,
      timeout: 60_000,
    },
    { name: "android", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
