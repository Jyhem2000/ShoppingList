import { expect, type Page, test } from "@playwright/test";
import { addToList, enterApp, line } from "./app";

/** Scénario de bout en bout du mode courses (docs/08 § 3 : 4). */

function aisle(page: Page, name: string) {
  return page.locator(`main section[aria-label^="${name}"]`);
}

async function finish(page: Page) {
  await page.getByRole("button", { name: "Terminer les courses" }).click();
  await page
    .getByRole("dialog", { name: "Terminer les courses ?" })
    .getByRole("button", { name: "Terminer", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Courses terminées" }),
  ).toBeVisible();
}

test("4. mode courses : rayon replié, « À récupérer », clôture, réouverture", async ({
  page,
}) => {
  await enterApp(page);
  await addToList(page, "pommes, lait, beurre");
  await expect(line(page, "Beurre")).toBeVisible();

  await page.getByRole("button", { name: "C'est parti" }).click();
  await page
    .getByRole("dialog", { name: "Faire les courses" })
    .getByRole("button", { name: "C'est parti" })
    .click();
  await expect(page.getByTestId("shopping-progress")).toHaveText("0 / 3");
  await expect(
    page.getByRole("navigation", { name: "Navigation principale" }),
  ).toBeHidden();

  // Cocher tout un rayon : il se replie, avec une coche.
  await line(page, "Pommes").click();
  await expect(page.getByTestId("shopping-progress")).toHaveText("1 / 3");
  await expect(
    aisle(page, "Fruits & Légumes").getByRole("button", {
      expanded: false,
    }),
  ).toBeVisible();

  // On passe en Crèmerie, puis on pense aux carottes : leur rayon est passé.
  await line(page, "Lait").click();
  await addToList(page, "carottes");
  const added = page.getByRole("dialog", { name: "Carottes ajouté" });
  await expect(added).toContainText("déjà passé");
  await added.getByRole("button", { name: "OK, à prendre" }).click();
  await expect(
    aisle(page, "À récupérer").getByRole("button", { name: /^Carottes/ }),
  ).toBeVisible();

  // Terminer : les lignes cochées quittent la liste.
  await finish(page);
  await expect(page.getByText("2 articles achetés")).toBeVisible();
  await page.getByRole("button", { name: "Retour à la liste" }).click();
  await expect(line(page, "Beurre")).toBeVisible();
  await expect(line(page, "Carottes")).toBeVisible();
  await expect(line(page, "Lait")).toBeHidden();
  await expect(line(page, "Pommes")).toBeHidden();

  // Rouvrir : les achats réapparaissent cochés ; on coche un oubli et on termine à nouveau.
  await page.getByRole("button", { name: /Rouvrir les courses/ }).click();
  await expect(line(page, "Lait")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("shopping-progress")).toHaveText("2 / 4");
  await line(page, "Beurre").click();
  await finish(page);
  await expect(page.getByText("3 articles achetés")).toBeVisible();
});
