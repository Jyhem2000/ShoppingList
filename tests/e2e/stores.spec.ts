import { expect, test } from "@playwright/test";
import { addToList, aisleNames, enterApp, line, startShopping } from "./app";

/** Scénario de bout en bout de l'édition d'un magasin (docs/08 § 3 : 5). */

test("5. modifier un magasin : réordonner les rayons, rendre un rayon principal pour une catégorie → les courses suivent", async ({
  page,
}) => {
  await enterApp(page);
  await addToList(page, "pommes, lait");
  await expect(line(page, "Lait")).toBeVisible();

  // Réglages → Magasins & rayons → Mon supermarché.
  await page.getByRole("link", { name: "Réglages" }).click();
  await page.getByRole("link", { name: /Magasins & rayons/ }).click();
  await page.getByRole("link", { name: /^Mon supermarché/ }).click();

  // Crèmerie tout en haut, au clavier (poignée de glisser-déposer).
  const grip = page.getByRole("button", { name: "Déplacer Crèmerie" });
  await grip.focus();
  // Une courte pause entre les touches : dnd-kit mesure les positions à chaque pas.
  await page.keyboard.press("Space");
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(150);
    await page.keyboard.press("ArrowUp");
  }
  await page.waitForTimeout(150);
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("list", { name: "Rayons" }).getByRole("listitem").first(),
  ).toContainText("Crèmerie");

  // Les fruits deviennent principaux en Boulangerie.
  await page.getByRole("button", { name: /^Boulangerie/ }).click();
  const sheet = page.getByRole("dialog", { name: "Boulangerie" });
  await sheet
    .getByLabel("Ajouter une catégorie")
    .selectOption({ label: "Fruits" });
  await sheet
    .getByRole("button", { name: "Fruits : rendre principale" })
    .click();
  await expect(
    sheet.getByRole("button", { name: "Fruits : rendre secondaire" }),
  ).toBeVisible();
  await sheet.getByRole("button", { name: "Terminé" }).click();

  await page.getByRole("link", { name: "Liste" }).click();
  await startShopping(page, "Mon supermarché");
  await expect(line(page, "Pommes")).toBeVisible();
  await expect
    .poll(() => aisleNames(page))
    .toEqual(["Crèmerie", "Boulangerie"]);
});
