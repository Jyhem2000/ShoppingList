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
import { aisle, category, fr, short } from "./texts";

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
  await backToList(page);

  // Réglages → Magasins & rayons → Mon magasin.
  await page.getByRole("link", { name: fr.tabs.settings }).click();
  await page
    .getByRole("link", { name: new RegExp(fr.manage.stores.title) })
    .click();
  await page.getByRole("link", { name: /^Mon magasin/ }).click();

  // Le rayon de la crèmerie tout en haut, au clavier (poignée de glisser-déposer).
  const dairy = short("lait-creme-beurre");
  const aisles = page.getByRole("list", { name: fr.manage.store.aisles });
  const grip = page.getByRole("button", {
    name: fr.manage.store.reorder(fr.aisles.label(dairy)),
  });
  await grip.focus();
  // Une courte pause entre les touches : dnd-kit mesure les positions à chaque pas.
  await page.keyboard.press("Space");
  for (let i = 0; i < 2; i++) {
    await page.waitForTimeout(150);
    await page.keyboard.press("ArrowUp");
  }
  await page.waitForTimeout(150);
  await page.keyboard.press("Space");
  await expect(aisles.getByRole("listitem").first()).toContainText(dairy);

  // Les fruits deviennent principaux au rayon du pain.
  const fruits = category("fruits");
  const bread = short("pain-viennoiseries");
  await aisles.getByRole("button", { name: new RegExp(`^${bread}`) }).click();
  const sheet = page.getByRole("dialog", { name: fr.aisles.label(bread) });
  await sheet
    .getByLabel(fr.manage.aisle.addCategory)
    .selectOption({ label: fruits });
  await sheet
    .getByRole("button", { name: fr.manage.aisle.makePrimary(fruits) })
    .click();
  await expect(
    sheet.getByRole("button", { name: fr.manage.aisle.makeSecondary(fruits) }),
  ).toBeVisible();
  await sheet.getByRole("button", { name: fr.manage.aisle.done }).click();

  // Les courses suivantes suivent : lait d'abord, puis pain et fruits ensemble.
  await page.getByRole("link", { name: fr.tabs.list }).click();
  await addToList(page, "bananes, beurre");
  await startShopping(page, "Mon magasin");
  await expect(line(page, "Bananes")).toBeVisible();
  await expect
    .poll(() => aisleNames(page))
    .toEqual([
      aisle("lait-creme-beurre"),
      aisle("pain-viennoiseries", "fruits"),
    ]);
});
