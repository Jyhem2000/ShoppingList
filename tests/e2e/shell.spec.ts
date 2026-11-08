import { expect, type Page, test } from "@playwright/test";

/** Passe l'écran d'installation, comme le ferait « Continuer dans le navigateur ». */
async function enterApp(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Continuer dans le navigateur" })
    .click();
  await expect(
    page.getByRole("navigation", { name: "Navigation principale" }),
  ).toBeVisible();
}

test("premier lancement dans le navigateur : explique comment installer l'app", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Installe l'app" }),
  ).toBeVisible();

  if (testInfo.project.name === "iphone") {
    await expect(
      page.getByText("Sur l'écran d'accueil", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByText("ne partagent pas leurs données", { exact: false }),
    ).toBeVisible();
  } else {
    await expect(
      page.getByRole("button", { name: "Installer l'application" }),
    ).toBeVisible();
  }
});

test("le choix « Continuer dans le navigateur » est mémorisé", async ({
  page,
}) => {
  await enterApp(page);
  await page.reload();
  await expect(
    page.getByRole("navigation", { name: "Navigation principale" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Installe l'app" }),
  ).toHaveCount(0);
});

test("navigation entre les onglets et écran À propos avec la version", async ({
  page,
}) => {
  await enterApp(page);
  await expect(
    page.getByRole("heading", { name: "Courses", exact: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Catalogue" }).click();
  await expect(
    page.getByRole("heading", { name: "Catalogue", exact: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Réglages" }).click();
  await page.getByRole("link", { name: /À propos/ }).click();
  await expect(page.getByTestId("app-version")).toContainText(/\d+\.\d+\.\d+/);
});

test("réglage des sons : tous d'un coup ou un par un, mémorisé", async ({
  page,
}) => {
  await enterApp(page);
  await page.getByRole("link", { name: "Réglages" }).click();
  await expect(
    page.getByRole("heading", { name: "Fonctionnalités" }),
  ).toBeVisible();

  await page.getByRole("link", { name: /Sons/ }).click();
  const master = page.getByRole("switch", { name: "Sons", exact: true });
  const check = page.getByRole("switch", { name: "Article coché" });

  // Sans Web Audio (WebKit de Playwright sous Windows), les sons sont grisés, sans erreur.
  const audio = await page.evaluate(
    () => "AudioContext" in window || "webkitAudioContext" in window,
  );
  if (!audio) {
    await expect(master).toBeDisabled();
    await expect(
      page.getByText("Non disponible sur ce téléphone"),
    ).toBeVisible();
    return;
  }

  await expect(master).toBeChecked();

  await check.click();
  await expect(check).not.toBeChecked();
  await master.click();
  await expect(check).toBeDisabled();

  await page.reload();
  await expect(master).not.toBeChecked();
  await master.click();
  await expect(check).not.toBeChecked();
  await expect(
    page.getByRole("switch", { name: "Ajout d'un article" }),
  ).toBeChecked();

  await page.getByRole("link", { name: "Retour" }).click();
  await expect(page.getByText("5 sons sur 6")).toBeVisible();
});

test("l'app s'ouvre hors ligne une fois chargée", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "Service workers non pilotables par Playwright sous WebKit",
  );
  await enterApp(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("navigation", { name: "Navigation principale" }),
  ).toBeVisible();
  await context.setOffline(false);
});
