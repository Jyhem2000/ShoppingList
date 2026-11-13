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

  // Les rayons sont numérotés dans l'ordre de passage et désignés par leurs catégories.
  // La crèmerie (rayon 6) tout en haut, au clavier (poignée de glisser-déposer).
  const aisles = page.getByRole("list", { name: "Rayons" });
  const grip = page.getByRole("button", { name: "Déplacer Rayon 6" });
  await grip.focus();
  // Une courte pause entre les touches : dnd-kit mesure les positions à chaque pas.
  await page.keyboard.press("Space");
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(150);
    await page.keyboard.press("ArrowUp");
  }
  await page.waitForTimeout(150);
  await page.keyboard.press("Space");
  await expect(aisles.getByRole("listitem").first()).toContainText(
    "Rayon 1Œufs · Lait, Crème & Beurre",
  );

  // Les fruits deviennent principaux au rayon du pain (désormais le 3).
  await aisles.getByRole("button", { name: /Pain & Viennoiseries/ }).click();
  const sheet = page.getByRole("dialog", { name: "Rayon 3" });
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
    .toEqual([
      "Rayon 1 : Œufs · Lait, Crème & Beurre · Yaourts & Desserts frais",
      "Rayon 3 : Pain & Viennoiseries · Fruits",
    ]);
});
