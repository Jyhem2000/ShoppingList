import { expect, test } from "@playwright/test";
import { enterApp } from "./app";
import { fr } from "./texts";

test("premier lancement dans le navigateur : explique comment installer l'app", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: fr.install.title }),
  ).toBeVisible();

  if (testInfo.project.name === "iphone") {
    await expect(page.getByText(fr.install.iosSafariSteps[1])).toBeVisible();
    await expect(page.getByText(fr.install.iosWarning)).toBeVisible();
  } else {
    await expect(
      page.getByRole("button", { name: fr.install.androidButton }),
    ).toBeVisible();
  }
});

test("le choix « Continuer dans le navigateur » est mémorisé", async ({
  page,
}) => {
  await enterApp(page);
  await page.reload();
  await expect(
    page.getByRole("navigation", { name: fr.tabs.navigation }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: fr.install.title }),
  ).toHaveCount(0);
});

test("navigation entre les onglets et écran À propos avec la version", async ({
  page,
}) => {
  await enterApp(page);
  await expect(
    page.getByRole("heading", { name: fr.defaults.listName, exact: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: fr.tabs.catalog }).click();
  await expect(
    page.getByRole("heading", { name: fr.catalog.title, exact: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: fr.tabs.settings }).click();
  await page.getByRole("link", { name: new RegExp(fr.settings.about) }).click();
  await expect(page.getByTestId("app-version")).toContainText(/\d+\.\d+\.\d+/);
});

test("réglage des sons : tous d'un coup ou un par un, mémorisé", async ({
  page,
}) => {
  await enterApp(page);
  await page.getByRole("link", { name: fr.tabs.settings }).click();
  await page
    .getByRole("link", {
      name: new RegExp(`^${fr.settings.preferences.title}`),
    })
    .click();
  await expect(
    page.getByRole("heading", { name: fr.settings.sectionFeatures }),
  ).toBeVisible();

  await page
    .getByRole("link", { name: new RegExp(fr.settings.sounds.title) })
    .click();
  const master = page.getByRole("switch", { name: fr.soundsPage.master });
  const check = page.getByRole("switch", { name: fr.soundsPage.events.check });

  // Sans Web Audio (WebKit de Playwright sous Windows), les sons sont grisés, sans erreur.
  const audio = await page.evaluate(
    () => "AudioContext" in window || "webkitAudioContext" in window,
  );
  if (!audio) {
    await expect(master).toBeDisabled();
    await expect(page.getByText(fr.settings.unavailable)).toBeVisible();
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
    page.getByRole("switch", { name: fr.soundsPage.events.add }),
  ).toBeChecked();

  await page.getByRole("link", { name: fr.sheet.back }).click();
  await expect(
    page.getByText(fr.settings.sounds.stateSome(5, 6)),
  ).toBeVisible();
});

test("thème : clair ou sombre au choix, mémorisé, sans attendre le chargement", async ({
  page,
}) => {
  await enterApp(page);
  await page.getByRole("link", { name: fr.tabs.settings }).click();
  await page
    .getByRole("link", {
      name: new RegExp(`^${fr.settings.preferences.title}`),
    })
    .click();
  await page
    .getByRole("radio", { name: fr.settings.theme.options.light })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  // Posé par index.html avant l'affichage de l'app.
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(
    page.getByRole("radio", { name: fr.settings.theme.options.light }),
  ).toBeChecked();
  await page
    .getByRole("radio", { name: fr.settings.theme.options.dark })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
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
    page.getByRole("navigation", { name: fr.tabs.navigation }),
  ).toBeVisible();
  await context.setOffline(false);
});

test("maquette : les icônes du pack s'affichent, un monogramme remplace les manquantes", async ({
  page,
}) => {
  await enterApp(page);
  await page.goto("/#/dev/ui");
  await expect(
    page.getByRole("heading", { name: fr.devUi.title }),
  ).toBeVisible();
  await expect(page.locator('svg[data-icon="pommes"]').first()).toBeVisible();
  await expect(
    page.locator("[data-monogram]", { hasText: "SN" }).first(),
  ).toBeVisible();
});
