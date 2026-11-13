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

/** Scénario de bout en bout de l'édition d'un magasin (docs/08 § 3 : 5). */

test("5. modifier un magasin : réordonner les rayons, rendre un rayon principal pour une catégorie → les courses suivent", async ({
  page,
}) => {
  // Un magasin construit pendant une première course : fruits, pain, lait.
  await enterApp(page);
  await addToList(page, "pommes, pain, lait");
  await expect(line(page, "Lait")).toBeVisible();
  await startShopping(page, "Mon magasin", { create: true });
  await check(page, "Pommes");
  await nextAisle(page);
  await check(page, "Pain");
  await nextAisle(page);
  await check(page, "Lait");
  await finishShopping(page);
  await page.getByRole("button", { name: "Retour à la liste" }).click();

  // Réglages → Magasins & rayons → Mon magasin.
  await page.getByRole("link", { name: "Réglages" }).click();
  await page.getByRole("link", { name: /Magasins & rayons/ }).click();
  await page.getByRole("link", { name: /^Mon magasin/ }).click();

  // Le rayon du lait tout en haut, au clavier (poignée de glisser-déposer).
  const aisles = page.getByRole("list", { name: "Rayons" });
  const grip = page.getByRole("button", { name: "Déplacer Rayon Lait" });
  await grip.focus();
  // Une courte pause entre les touches : dnd-kit mesure les positions à chaque pas.
  await page.keyboard.press("Space");
  for (let i = 0; i < 2; i++) {
    await page.waitForTimeout(150);
    await page.keyboard.press("ArrowUp");
  }
  await page.waitForTimeout(150);
  await page.keyboard.press("Space");
  await expect(aisles.getByRole("listitem").first()).toContainText("Lait");

  // Les fruits deviennent principaux au rayon du pain.
  await aisles.getByRole("button", { name: /^Pain/ }).click();
  const sheet = page.getByRole("dialog", { name: "Rayon Pain" });
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

  // Les courses suivantes suivent : lait d'abord, puis pain et fruits ensemble.
  await page.getByRole("link", { name: "Liste" }).click();
  await addToList(page, "bananes, beurre");
  await startShopping(page, "Mon magasin");
  await expect(line(page, "Bananes")).toBeVisible();
  await expect
    .poll(() => aisleNames(page))
    .toEqual(["Rayon : Lait", "Rayon : Pain · Fruits"]);
});
