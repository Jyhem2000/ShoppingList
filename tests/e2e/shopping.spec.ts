import { expect, type Page, test } from "@playwright/test";
import {
  addToList,
  check,
  enterApp,
  finishShopping,
  line,
  nextAisle,
  startShopping,
} from "./app";

/** Scénario de bout en bout du mode courses (docs/08 § 3 : 4). */

function aisle(page: Page, name: string) {
  return page.locator(`main section[aria-label^="${name}"]`);
}

test("4. mode courses : rayon replié, « À récupérer », clôture, réouverture", async ({
  page,
}) => {
  await enterApp(page);
  await addToList(page, "pommes, lait, beurre");
  await expect(line(page, "Beurre")).toBeVisible();

  // Premières courses dans ce magasin : ses rayons se rangent en cochant.
  await startShopping(page, "Supermarché", { create: true });
  await expect(page.getByTestId("shopping-progress")).toHaveText("0 / 3");
  await expect(
    page.getByRole("navigation", { name: "Navigation principale" }),
  ).toBeHidden();

  // Cocher tout un rayon puis passer au suivant : il se replie, avec une coche.
  await check(page, "Pommes");
  await expect(page.getByTestId("shopping-progress")).toHaveText("1 / 3");
  await nextAisle(page);
  await expect(
    aisle(page, "Rayon : Fruits").getByRole("button", { expanded: false }),
  ).toBeVisible();

  // Au rayon du lait : le beurre, même catégorie, reste « À placer » jusqu'à sa coche
  // (rien ne saute ailleurs à l'écran). On pense aux bananes : leur rayon est passé.
  await check(page, "Lait");
  await expect(
    aisle(page, "Rayon : Lait")
      .getByRole("button", { name: /^Lait/ })
      .and(page.locator("button:not([aria-expanded])")),
  ).toBeVisible();
  await expect(
    aisle(page, "À placer").getByRole("button", { name: /^Beurre/ }),
  ).toBeVisible();
  await addToList(page, "bananes");
  const added = page.getByRole("dialog", { name: "Bananes ajouté" });
  await expect(added).toContainText("déjà passé");
  await added.getByRole("button", { name: "OK, à prendre" }).click();
  await expect(
    aisle(page, "À récupérer").getByRole("button", { name: /^Bananes/ }),
  ).toBeVisible();

  // Terminer : les lignes cochées quittent la liste.
  await finishShopping(page);
  await expect(page.getByText("2 articles achetés")).toBeVisible();
  await page.getByRole("button", { name: "Retour à la liste" }).click();
  await expect(line(page, "Beurre")).toBeVisible();
  await expect(line(page, "Bananes")).toBeVisible();
  await expect(line(page, "Lait")).toBeHidden();
  await expect(line(page, "Pommes")).toBeHidden();

  // Rouvrir : les achats réapparaissent cochés ; on coche un oubli et on termine à nouveau.
  await page.getByRole("button", { name: /Rouvrir les courses/ }).click();
  await expect(line(page, "Lait")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("shopping-progress")).toHaveText("2 / 4");
  await line(page, "Beurre").click();
  await finishShopping(page);
  await expect(page.getByText("3 articles achetés")).toBeVisible();
});
