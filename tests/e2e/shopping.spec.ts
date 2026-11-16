import { expect, type Page, test } from "@playwright/test";
import {
  addToList,
  backToList,
  check,
  enterApp,
  finishShopping,
  line,
  nextAisle,
  startShopping,
} from "./app";
import { aisle as aisleTitle, fr, short } from "./texts";

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
    page.getByRole("navigation", { name: fr.tabs.navigation }),
  ).toBeHidden();

  // Cocher tout un rayon puis passer au suivant : il se replie, avec une coche.
  await check(page, "Pommes");
  await expect(page.getByTestId("shopping-progress")).toHaveText("1 / 3");
  await nextAisle(page);
  await expect(
    aisle(page, aisleTitle("fruits")).getByRole("button", { expanded: false }),
  ).toBeVisible();
  // Le changement se voit : message, et « Tu es ici » sur le nouveau rayon, vide.
  await expect(page.getByText(fr.shopping.aisleOpened)).toBeVisible();
  const here = page.locator("main section[aria-current]");
  await expect(here).toHaveCount(1);
  await expect(here).toContainText(fr.shopping.current);
  await expect(here).toContainText(fr.shopping.emptyAisle);
  // Retoucher « Rayon suivant » sur ce rayon encore vide : on le dit.
  await page.getByRole("button", { name: fr.shopping.nextAisle }).click();
  await expect(page.getByText(fr.shopping.aisleStillEmpty)).toBeVisible();

  // Au rayon du lait : le beurre, même catégorie, reste « À placer » jusqu'à sa coche
  // (rien ne saute ailleurs à l'écran). On pense aux bananes : leur rayon est passé.
  await check(page, "Lait");
  await expect(
    aisle(page, aisleTitle("lait-creme-beurre"))
      .getByRole("button", { name: /^Lait/ })
      .and(page.locator("button:not([aria-expanded])")),
  ).toBeVisible();
  await expect(
    aisle(page, fr.aisles.unplaced).getByRole("button", { name: /^Beurre/ }),
  ).toBeVisible();
  await addToList(page, "bananes", fr.shopping.addPlaceholder);
  const added = page.getByRole("dialog", {
    name: fr.shopping.added.title("Bananes"),
  });
  await expect(added).toContainText(
    fr.shopping.aislePassed(fr.aisles.label(short("fruits"))),
  );
  await added.getByRole("button", { name: fr.shopping.added.ok }).click();
  await expect(
    aisle(page, fr.shopping.pickUp).getByRole("button", { name: /^Bananes/ }),
  ).toBeVisible();

  // Terminer : les lignes cochées quittent la liste.
  await finishShopping(page);
  await expect(page.getByText(fr.shopping.recap.bought(2))).toBeVisible();
  await backToList(page);
  await expect(line(page, "Beurre")).toBeVisible();
  await expect(line(page, "Bananes")).toBeVisible();
  await expect(line(page, "Lait")).toBeHidden();
  await expect(line(page, "Pommes")).toBeHidden();

  // Rouvrir : les achats réapparaissent cochés ; on coche un oubli et on termine à nouveau.
  await page
    .getByRole("button", { name: new RegExp(fr.shopping.recap.reopen) })
    .click();
  await expect(line(page, "Lait")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("shopping-progress")).toHaveText("2 / 4");
  await line(page, "Beurre").click();
  await finishShopping(page);
  await expect(page.getByText(fr.shopping.recap.bought(3))).toBeVisible();
});
