import { expect, test } from "@playwright/test";
import { addToList, aisleNames, enterApp, line, startShopping } from "./app";

/** Scénarios de bout en bout de la liste (docs/08 § 3 : 1, 2, 3 et 6). */

test("1. premier lancement : données de départ créées, liste vide", async ({
  page,
}) => {
  await enterApp(page);
  await expect(
    page.getByRole("heading", { name: "Courses", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Ta liste est vide")).toBeVisible();
});

test("2. ajout éclair, article déjà présent, création d'un article inconnu", async ({
  page,
}) => {
  await enterApp(page);

  await addToList(page, "3 tom");
  await expect(line(page, "Tomates")).toContainText("3 kg");

  // Déjà dans la liste : « Ne rien faire » (Entrée) ne change rien.
  await addToList(page, "tomates");
  const sheet = page.getByRole("dialog", { name: "Tomates" });
  await expect(sheet).toContainText("Déjà dans la liste : 3 kilogrammes.");
  await sheet.getByRole("button", { name: "Ne rien faire" }).click();
  await expect(sheet).toBeHidden();
  await expect(line(page, "Tomates")).toContainText("3 kg");

  // Article inconnu : fiche rapide, catégorie et unité devinées.
  await addToList(page, "sauce nuoc-mâm");
  const create = page.getByRole("dialog", { name: "Nouvel article" });
  await expect(create.getByLabel("Catégorie")).toHaveValue(/.+/);
  await create.getByRole("button", { name: "Créer et ajouter" }).click();
  await expect(line(page, "Sauce nuoc-mâm")).toBeVisible();

  // Plusieurs articles d'un coup.
  await addToList(page, "2 baguettes, du beurre et 6 œufs");
  await expect(line(page, "Baguette")).toContainText("× 2");
  await expect(line(page, "Beurre")).toBeVisible();
  await expect(line(page, "Œufs")).toContainText("× 6");
});

test("3. liste par catégorie ; en courses, par rayon dans l'ordre du magasin choisi", async ({
  page,
}) => {
  await enterApp(page);
  await addToList(page, "lait, pommes, pain");
  await expect(line(page, "Pain")).toBeVisible();
  expect(await aisleNames(page)).toEqual([
    "Fruits",
    "Pain & Viennoiseries",
    "Lait, Crème & Beurre",
  ]);

  // Un deuxième magasin, rangé autrement (Réglages → Magasins & rayons).
  await page.getByRole("link", { name: "Réglages" }).click();
  await page.getByRole("link", { name: /Magasins & rayons/ }).click();
  await page.getByRole("button", { name: "Nouveau magasin" }).click();
  const sheet = page.getByRole("dialog", { name: "Nouveau magasin" });
  await sheet.getByRole("button", { name: "Marché", exact: true }).click();
  await sheet.getByRole("button", { name: "Créer le magasin" }).click();
  await expect(page.getByRole("heading", { name: "Marché" })).toBeVisible();

  await page.getByRole("link", { name: "Liste" }).click();
  await startShopping(page, "Marché");
  await expect
    .poll(() => aisleNames(page))
    .toEqual(["Primeur", "Fromager", "Boulanger"]);
});

test("6. les données restent après un rechargement", async ({ page }) => {
  await enterApp(page);
  await addToList(page, "1,5 kg pommes");
  await expect(line(page, "Pommes")).toContainText("1,5 kg");
  await page.reload();
  await expect(line(page, "Pommes")).toContainText("1,5 kg");
});
