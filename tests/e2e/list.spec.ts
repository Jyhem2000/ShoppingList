import { expect, test } from "@playwright/test";
import {
  addToList,
  aisleNames,
  backToList,
  check,
  enterApp,
  finishShopping,
  line,
  nextAisle,
  startShopping,
} from "./app";
import { aisle, category, fr } from "./texts";

/** Scénarios de bout en bout de la liste (docs/08 § 3 : 1, 2, 3 et 6). */

test("1. premier lancement : données de départ créées, liste vide", async ({
  page,
}) => {
  await enterApp(page);
  await expect(
    page.getByRole("heading", { name: fr.defaults.listName, exact: true }),
  ).toBeVisible();
  await expect(page.getByText(fr.list.emptyTitle)).toBeVisible();
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
  await expect(sheet).toContainText(fr.list.exists.text("3 kilogrammes"));
  await sheet.getByRole("button", { name: fr.list.exists.nothing }).click();
  await expect(sheet).toBeHidden();
  await expect(line(page, "Tomates")).toContainText("3 kg");

  // Article inconnu : fiche rapide, catégorie et unité devinées.
  await addToList(page, "sauce nuoc-mâm");
  const create = page.getByRole("dialog", { name: fr.list.createSheet.title });
  await expect(create.getByLabel(fr.list.createSheet.category)).toHaveValue(
    /.+/,
  );
  await create
    .getByRole("button", { name: fr.list.createSheet.submit })
    .click();
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
    line(page, "Pommes").filter({ hasText: fr.list.typesOne("Golden") }),
  ).toContainText("2");
  await expect(
    line(page, "Pommes").filter({ hasText: fr.list.typesOne("Granny Smith") }),
  ).toContainText("3");

  // Suggestion par type : « pommes gal » propose « Pommes · Gala ».
  await page
    .getByRole("textbox", { name: fr.list.addPlaceholder })
    .fill("pommes gal");
  await page
    .getByRole("button", {
      name: new RegExp(`^${fr.list.withType("Pommes", "Gala")}`),
    })
    .click();
  await expect(
    line(page, "Pommes").filter({ hasText: fr.list.typesOne("Gala") }),
  ).toBeVisible();

  // Catalogue : toucher un article déjà présent montre toutes ses lignes ; une autre sorte
  // s'y ajoute avec la quantité par défaut, réglable sur place.
  await page.getByRole("link", { name: fr.tabs.catalog }).click();
  await page
    .getByRole("button", {
      name: new RegExp(`^${category("fruits")}`),
    })
    .click();
  const apples = page.getByRole("button", { name: /Pommes$/ });
  const quantity = page.getByRole("dialog", { name: "Pommes" });
  // L'écran de la catégorie arrive en animation : un toucher trop tôt peut se perdre
  // (WebKit) ; l'article est déjà dans la liste, retoucher ne fait qu'ouvrir le panneau.
  await expect(async () => {
    if (!(await quantity.isVisible())) await apples.click();
    await expect(quantity).toBeVisible({ timeout: 1000 });
  }).toPass();
  await quantity.getByRole("button", { name: "Pink Lady" }).click();
  const pinkLady = quantity
    .getByRole("listitem")
    .filter({ hasText: "Pink Lady" });
  await expect(pinkLady).toContainText("1 kg");
  await pinkLady.getByRole("button", { name: fr.list.line.more }).click();
  await expect(pinkLady).toContainText("1,5 kg");
  await quantity.getByRole("button", { name: fr.catalog.done }).click();
  await expect(quantity).toBeHidden();

  // Appui long → fiche de l'article ; la flèche revient au catalogue, pas aux réglages.
  await apples.hover();
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  await expect(page.getByRole("heading", { name: "Pommes" })).toBeVisible();
  await page.getByRole("link", { name: fr.sheet.back }).click();
  await expect(
    page.getByRole("heading", { name: category("fruits") }),
  ).toBeVisible();

  await page.getByRole("link", { name: fr.tabs.list }).click();
  await expect(line(page, "Pommes")).toHaveCount(4);
});

test("3. liste par catégorie ; la première course construit le magasin, la suivante suit ce parcours", async ({
  page,
}) => {
  await enterApp(page, { tips: true });
  await addToList(page, "lait, pommes, pain");
  await expect(line(page, "Pain")).toBeVisible();
  expect(await aisleNames(page)).toEqual([
    category("fruits"),
    category("pain-viennoiseries"),
    category("lait-creme-beurre"),
  ]);

  // Aucun magasin au départ : on le nomme en partant.
  await startShopping(page, "Marché", { create: true });
  await expect.poll(() => aisleNames(page)).toEqual([fr.aisles.unplaced]);
  const place = page.getByRole("dialog", {
    name: fr.tips.place,
  });
  await expect(place).toBeVisible();
  await place.click();

  // On coche dans l'ordre du parcours, « Rayon suivant » à chaque changement de rayon.
  await line(page, "Pommes").click();
  const next = page.getByRole("dialog", { name: fr.tips.next });
  await expect(next).toBeVisible();
  await next.click();
  await nextAisle(page);
  await check(page, "Pain");
  await nextAisle(page);
  await check(page, "Lait");
  await expect
    .poll(() => aisleNames(page))
    .toEqual([
      aisle("fruits"),
      aisle("pain-viennoiseries"),
      aisle("lait-creme-beurre"),
    ]);
  await finishShopping(page);
  const stored = page.getByRole("dialog", {
    name: fr.tips.stored,
  });
  await expect(stored).toBeVisible();
  await stored.click();
  await backToList(page);

  // La course suivante : rangée par rayon, dans l'ordre du parcours, rien à placer.
  await addToList(page, "beurre, bananes");
  // Les deux lignes d'abord : chacune décale « C'est parti », qui raterait le clic.
  await expect(line(page, "Bananes")).toBeVisible();
  await startShopping(page, "Marché");
  await expect(line(page, "Bananes")).toBeVisible();
  await expect
    .poll(() => aisleNames(page))
    .toEqual([aisle("fruits"), aisle("lait-creme-beurre")]);
  await expect(
    page.getByRole("button", { name: fr.shopping.nextAisle }),
  ).toBeHidden();
});
test("6. les données restent après un rechargement", async ({ page }) => {
  await enterApp(page);
  await addToList(page, "1,5 kg pommes");
  await expect(line(page, "Pommes")).toContainText("1,5 kg");
  await page.reload();
  await expect(line(page, "Pommes")).toContainText("1,5 kg");
});
