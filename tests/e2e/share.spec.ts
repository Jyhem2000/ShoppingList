import {
  devices,
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import {
  addIngredients,
  addToList,
  createRecipe,
  enterApp,
  ingredient,
  line,
  tapUntil,
} from "./app";
import { fr } from "./texts";

/** Scénarios de bout en bout du partage (docs/08 § 3 : 8 et 9). */

const t = fr.share;

/** Article inconnu : la fiche rapide de création, validée telle quelle. */
async function createUnknown(page: Page, text: string) {
  await addToList(page, text);
  await page
    .getByRole("dialog", { name: fr.list.createSheet.title })
    .getByRole("button", { name: fr.list.createSheet.submit })
    .click();
}

/** Remplace la feuille de partage du téléphone par une capture du message. */
async function captureShare(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: (data: ShareData) => {
        (window as { shared?: string }).shared = data.text;
        return Promise.resolve();
      },
    });
  });
}

/** Le message envoyé par la feuille de partage (capturée). */
async function sharedMessage(page: Page): Promise<string> {
  await expect
    .poll(() => page.evaluate(() => (window as { shared?: string }).shared))
    .toContain("#/import?d=");
  return (
    (await page.evaluate(() => (window as { shared?: string }).shared)) ?? ""
  );
}

/** Un autre téléphone, du même type, avec les données de départ seulement. */
async function otherPhone(browser: Browser): Promise<BrowserContext> {
  const device =
    devices[test.info().project.name === "iphone" ? "iPhone 15" : "Pixel 7"];
  return browser.newContext({
    ...device,
    baseURL: test.info().project.use.baseURL,
    locale: "fr-FR",
  });
}

/**
 * Ouvre le lien reçu. Dans le navigateur de l'iPhone, la page explique d'abord comment
 * l'ouvrir dans l'app ; on importe ici quand même (profil de test sans app installée).
 */
async function openLink(page: Page, link: string, recipe = false) {
  await page.goto(link);
  const here = page.getByRole("button", {
    name: recipe ? t.importRecipeHere : t.importHere,
  });
  const title = page.getByRole("heading", {
    name: recipe ? t.titleRecipe : t.titleShared,
  });
  await expect(here.or(title)).toBeVisible();
  if (await here.isVisible()) await here.click();
  await expect(title).toBeVisible();
}

test("8. partage puis import dans un profil vierge : aperçu, association mémorisée, articles créés", async ({
  browser,
  page,
}) => {
  // Expéditeur : la feuille de partage du téléphone est remplacée par une capture.
  await captureShare(page);
  await enterApp(page);
  await addToList(page, "3 tomates, du beurre");
  await createUnknown(page, "sirop de sureau maison");
  await createUnknown(page, "gâteau de mamie");
  await expect(line(page, "Gâteau de mamie")).toBeVisible();
  await page.getByRole("button", { name: fr.list.menu }).click();
  await page.getByRole("button", { name: t.send }).click();
  const message = await sharedMessage(page);
  expect(message).toContain("• Tomates × 3");
  const link = message.slice(message.indexOf("http"));

  // Destinataire : un autre téléphone, données de départ seulement.
  const other = await otherPhone(browser);
  const recipient = await other.newPage();
  await enterApp(recipient);
  await openLink(recipient, link);
  await expect(recipient.getByText(t.summary(2, 0, 2))).toBeVisible();

  // « Sirop de sureau maison » : c'est le Sirop de ce téléphone.
  const sheet = recipient.getByRole("dialog", {
    name: t.choiceTitle("Sirop de sureau maison"),
  });
  await tapUntil(
    () =>
      recipient
        .getByRole("button", { name: /^Sirop de sureau maison/ })
        .click({ timeout: 3000 }),
    (timeout) => expect(sheet).toBeVisible({ timeout }),
  );
  await sheet.getByRole("searchbox", { name: t.search }).fill("sirop");
  await sheet
    .getByRole("button")
    .filter({ has: recipient.getByText("Sirop", { exact: true }) })
    .first()
    .click();
  await expect(sheet).toBeHidden();
  await expect(
    recipient.getByRole("button", { name: /^Sirop / }).first(),
  ).toContainText(t.received("Sirop de sureau maison"));
  const add = recipient.getByRole("textbox", { name: fr.list.addPlaceholder });
  await tapUntil(
    () =>
      recipient
        .getByRole("button", { name: t.apply(4) })
        .click({ timeout: 3000 }),
    (timeout) => expect(add).toBeVisible({ timeout }),
  );

  // Nouvelle liste : les articles reconnus, le Sirop, et le gâteau créé.
  await expect(line(recipient, "Tomates")).toContainText("× 3");
  await expect(line(recipient, "Beurre")).toBeVisible();
  await expect(line(recipient, "Sirop")).toBeVisible();
  await expect(line(recipient, "Gâteau de mamie")).toBeVisible();

  // Le même lien, une seconde fois : tout est reconnu (association mémorisée).
  await openLink(recipient, link);
  await expect(recipient.getByText(t.summary(4, 0, 0))).toBeVisible();
  await other.close();
});

test("9. recette partagée puis importée dans un profil vierge : ingrédients, quantité fixe, étapes", async ({
  browser,
  page,
}) => {
  await captureShare(page);
  await enterApp(page);
  await createRecipe(page, "Gratin", { quantity: 4, unit: "personnes" });
  await addIngredients(page, "1 kg de pommes de terre, 1 crème fraîche");
  await expect(page.locator("main li")).toHaveCount(2);
  await ingredient(page, "Crème fraîche").getByRole("button").click();
  const crème = page.getByRole("dialog", { name: "Crème fraîche" });
  const fixed = crème.getByRole("checkbox", {
    name: new RegExp(fr.recipes.ingredient.fixed),
  });
  await fixed.click();
  await expect(fixed).toBeChecked();
  await crème.getByRole("button", { name: fr.recipes.ingredient.done }).click();
  await page
    .getByRole("button", { name: fr.recipes.editDone, exact: true })
    .click();
  await page.getByRole("button", { name: t.sendRecipe }).click();
  const message = await sharedMessage(page);
  expect(message).toContain("Gratin (pour 4 personnes)");
  expect(message).toContain(`• Crème fraîche × 1 (${fr.recipes.fixed})`);
  const link = message.slice(message.indexOf("http"));

  // Destinataire : tout est reconnu ; la recette est créée, retour à l'écran Recettes.
  const other = await otherPhone(browser);
  const recipient = await other.newPage();
  await enterApp(recipient);
  await openLink(recipient, link, true);
  await expect(recipient.getByText(t.summary(2, 0, 0))).toBeVisible();
  await expect(
    recipient.getByText(fr.recipes.serves("4 personnes")),
  ).toBeVisible();
  const received = recipient.getByRole("link", { name: /Gratin/ });
  await tapUntil(
    () =>
      recipient
        .getByRole("button", { name: t.applyRecipe(2) })
        .click({ timeout: 3000 }),
    (timeout) => expect(received).toBeVisible({ timeout }),
  );
  await received.click();
  await expect(
    recipient.getByRole("heading", { name: "Gratin" }),
  ).toBeVisible();
  await expect(ingredient(recipient, "Pommes de terre")).toContainText("1 kg");
  await expect(ingredient(recipient, "Crème fraîche")).toContainText(
    fr.recipes.fixed,
  );
  await other.close();
});
