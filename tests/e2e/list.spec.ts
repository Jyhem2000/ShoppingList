import { expect, test } from "@playwright/test";
import {
  addToList,
  aisleNames,
  check,
  enterApp,
  finishShopping,
  line,
  nextAisle,
  startShopping,
} from "./app";

/** Scénarios de bout en bout de la liste (docs/08 § 3 : 1, 2, 3 et 6). */

test("1. premier lancement : données de départ créées, liste vide", async ({
  page,
}) => {
  await enterApp(page);
  await expect(
    page.getByRole("heading", { name: "Liste 1", exact: true }),
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

  // Un même article avec des types différents : une ligne par choix de types.
  await addToList(page, "2 pommes golden, 3 pommes granny smith");
  await expect(line(page, "Pommes")).toHaveCount(2);
  await expect(
    line(page, "Pommes").filter({ hasText: "Golden uniquement" }),
  ).toContainText("2");
  await expect(
    line(page, "Pommes").filter({ hasText: "Granny Smith uniquement" }),
  ).toContainText("3");

  // Suggestion par type : « pommes gal » propose « Pommes · Gala ».
  await page
    .getByRole("textbox", { name: "Ajouter un article…" })
    .fill("pommes gal");
  await page.getByRole("button", { name: /^Pommes · Gala/ }).click();
  await expect(
    line(page, "Pommes").filter({ hasText: "Gala uniquement" }),
  ).toBeVisible();

  // Catalogue : toucher un article déjà présent propose une autre sorte, sur une ligne à part.
  await page.getByRole("link", { name: "Catalogue" }).click();
  await page.getByRole("button", { name: /^Fruits/ }).click();
  const apples = page.getByRole("button", { name: /Pommes$/ });
  await apples.click();
  const quantity = page.getByRole("dialog", { name: "Pommes" });
  await quantity.getByRole("button", { name: "Pink Lady" }).click();
  await expect(quantity).toBeHidden();

  // Appui long → fiche de l'article ; la flèche revient au catalogue, pas aux réglages.
  await apples.hover();
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  await expect(page.getByRole("heading", { name: "Pommes" })).toBeVisible();
  await page.getByRole("link", { name: "Retour" }).click();
  await expect(page.getByRole("heading", { name: "Fruits" })).toBeVisible();

  await page.getByRole("link", { name: "Liste" }).click();
  await expect(line(page, "Pommes")).toHaveCount(4);
});

test("3. liste par catégorie ; la première course construit le magasin, la suivante suit ce parcours", async ({
  page,
}) => {
  await enterApp(page, { tips: true });
  await addToList(page, "lait, pommes, pain");
  await expect(line(page, "Pain")).toBeVisible();
  expect(await aisleNames(page)).toEqual([
    "Fruits",
    "Pain & Viennoiseries",
    "Crèmerie & Œufs",
  ]);

  // Aucun magasin au départ : on le nomme en partant.
  await startShopping(page, "Marché", { create: true });
  await expect.poll(() => aisleNames(page)).toEqual(["À placer"]);
  const place = page.getByRole("dialog", {
    name: /Touche un article quand il est dans le caddie/,
  });
  await expect(place).toBeVisible();
  await place.click();

  // On coche dans l'ordre du parcours, « Rayon suivant » à chaque changement de rayon.
  await line(page, "Pommes").click();
  const next = page.getByRole("dialog", { name: /Tu changes de rayon/ });
  await expect(next).toBeVisible();
  await next.click();
  await nextAisle(page);
  await check(page, "Pain");
  await nextAisle(page);
  await check(page, "Lait");
  await expect
    .poll(() => aisleNames(page))
    .toEqual(["Rayon : Fruits", "Rayon : Pain", "Rayon : Crèmerie & Œufs"]);
  await finishShopping(page);
  const stored = page.getByRole("dialog", {
    name: /Ton magasin est enregistré/,
  });
  await expect(stored).toBeVisible();
  await stored.click();
  await page.getByRole("button", { name: "Retour à la liste" }).click();

  // La course suivante : rangée par rayon, dans l'ordre du parcours, rien à placer.
  await addToList(page, "beurre, bananes");
  // Les deux lignes d'abord : chacune décale « C'est parti », qui raterait le clic.
  await expect(line(page, "Bananes")).toBeVisible();
  await startShopping(page, "Marché");
  await expect(line(page, "Bananes")).toBeVisible();
  await expect
    .poll(() => aisleNames(page))
    .toEqual(["Rayon : Fruits", "Rayon : Crèmerie & Œufs"]);
  await expect(
    page.getByRole("button", { name: "Rayon suivant" }),
  ).toBeHidden();
});
test("6. les données restent après un rechargement", async ({ page }) => {
  await enterApp(page);
  await addToList(page, "1,5 kg pommes");
  await expect(line(page, "Pommes")).toContainText("1,5 kg");
  await page.reload();
  await expect(line(page, "Pommes")).toContainText("1,5 kg");
});
