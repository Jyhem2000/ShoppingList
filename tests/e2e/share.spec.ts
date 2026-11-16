import { devices, expect, test, type Page } from "@playwright/test";
import { addToList, enterApp, line, tapUntil } from "./app";
import { fr } from "./texts";

/** Scénario de bout en bout du partage (docs/08 § 3 : 8). */

const t = fr.share;

/** Article inconnu : la fiche rapide de création, validée telle quelle. */
async function createUnknown(page: Page, text: string) {
  await addToList(page, text);
  await page
    .getByRole("dialog", { name: fr.list.createSheet.title })
    .getByRole("button", { name: fr.list.createSheet.submit })
    .click();
}

/**
 * Ouvre le lien reçu. Dans le navigateur de l'iPhone, la page explique d'abord comment
 * l'ouvrir dans l'app ; on importe ici quand même (profil de test sans app installée).
 */
async function openLink(page: Page, link: string) {
  await page.goto(link);
  const here = page.getByRole("button", { name: t.importHere });
  const title = page.getByRole("heading", { name: t.titleShared });
  await expect(here.or(title)).toBeVisible();
  if (await here.isVisible()) await here.click();
  await expect(title).toBeVisible();
}

test("8. partage puis import dans un profil vierge : aperçu, association mémorisée, articles créés", async ({
  browser,
  page,
}) => {
  // Expéditeur : la feuille de partage du téléphone est remplacée par une capture.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: (data: ShareData) => {
        (window as { shared?: string }).shared = data.text;
        return Promise.resolve();
      },
    });
  });
  await enterApp(page);
  await addToList(page, "3 tomates, du beurre");
  await createUnknown(page, "sirop de sureau maison");
  await createUnknown(page, "gâteau de mamie");
  await expect(line(page, "Gâteau de mamie")).toBeVisible();
  await page.getByRole("button", { name: fr.list.menu }).click();
  await page.getByRole("button", { name: t.send }).click();
  await expect
    .poll(() => page.evaluate(() => (window as { shared?: string }).shared))
    .toContain("#/import?d=");
  const message =
    (await page.evaluate(() => (window as { shared?: string }).shared)) ?? "";
  expect(message).toContain("• Tomates × 3");
  const link = message.slice(message.indexOf("http"));

  // Destinataire : un autre téléphone, données de départ seulement.
  const device =
    devices[test.info().project.name === "iphone" ? "iPhone 15" : "Pixel 7"];
  const other = await browser.newContext({
    ...device,
    baseURL: test.info().project.use.baseURL,
    locale: "fr-FR",
  });
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
