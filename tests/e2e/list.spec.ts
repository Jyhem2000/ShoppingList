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
    "Lait, Crème & Beurre",
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
    .toEqual(["Rayon : Fruits", "Rayon : Pain", "Rayon : Lait"]);
  await finishShopping(page);
  const stored = page.getByRole("dialog", {
    name: /Ton magasin est enregistré/,
  });
  await expect(stored).toBeVisible();
  await stored.click();
  await page.getByRole("button", { name: "Retour à la liste" }).click();

  // La course suivante : rangée par rayon, dans l'ordre du parcours, rien à placer.
  await addToList(page, "beurre, bananes");
  await startShopping(page, "Marché");
  await expect(line(page, "Bananes")).toBeVisible();
  await expect
    .poll(() => aisleNames(page))
    .toEqual(["Rayon : Fruits", "Rayon : Lait"]);
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
