import { expect, test } from "@playwright/test";
import { addToList, aisleNames, enterApp, line } from "./app";
import { category, en, fr } from "./texts";

/** Scénario de bout en bout de l'anglais (docs/08 § 3 : 12). */

// Un téléphone en anglais : l'app démarre en anglais (docs/03 I3).
test.use({ locale: "en-GB" });

test("12. téléphone en anglais : interface, catalogue et saisie en anglais, puis passage en français", async ({
  page,
}) => {
  await enterApp(page, { t: en });
  await expect(
    page.getByRole("heading", { name: en.defaults.listName, exact: true }),
  ).toBeVisible();

  // Saisie naturelle en anglais (docs/03 A2) : « and », « then », « of », « half a dozen ».
  await addToList(
    page,
    "2 tins of chopped tomatoes and half a dozen eggs then some milk",
    en.list.addPlaceholder,
  );
  await expect(line(page, "Chopped tomatoes")).toContainText("2 tins");
  await expect(line(page, "Eggs")).toContainText("× 6");
  await expect(line(page, "Milk")).toBeVisible();
  expect(await aisleNames(page)).toEqual(
    expect.arrayContaining([
      category("conserves-bocaux", "en"),
      category("lait-creme-beurre", "en"),
    ]),
  );

  // Réglages → Préférences → Langue : le catalogue et la première liste passent en français.
  await page.getByRole("link", { name: en.tabs.settings }).click();
  await page
    .getByRole("link", {
      name: new RegExp(`^${en.settings.preferences.title}`),
    })
    .click();
  await page
    .getByRole("radiogroup", { name: en.settings.language.title })
    .getByRole("radio", { name: "Français" })
    .click();
  await page
    .getByRole("dialog", {
      name: en.settings.language.confirmTitle("Français"),
    })
    .getByRole("button", { name: en.settings.language.confirm })
    .click();

  // L'app redémarre en français ; les lignes de la liste suivent leur article. Le
  // renommage réécrit tout le catalogue (deux passes, environ 1 000 écritures) : comme
  // au premier lancement, une dizaine de secondes sous le WebKit de Playwright sous
  // Windows (docs/08 § 3).
  await expect(
    page.getByRole("heading", { name: fr.settings.sectionFeatures }),
  ).toBeVisible({ timeout: 30_000 });
  await page.getByRole("link", { name: fr.tabs.list }).click();
  await expect(
    page.getByRole("heading", { name: fr.defaults.listName, exact: true }),
  ).toBeVisible();
  await expect(line(page, "Tomates concassées")).toContainText("2 boîtes");
  await expect(line(page, "Œufs")).toContainText("× 6");
  await expect(line(page, "Lait")).toBeVisible();
  expect(await aisleNames(page)).toEqual(
    expect.arrayContaining([
      category("conserves-bocaux"),
      category("lait-creme-beurre"),
    ]),
  );
});
