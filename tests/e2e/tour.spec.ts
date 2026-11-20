import { expect, test } from "@playwright/test";
import {
  addToList,
  backToList,
  check,
  enterApp,
  finishShopping,
  line,
  startShopping,
} from "./app";
import { category, fr } from "./texts";

test("11. faire le tour : à racheter d'après le rythme des achats, puis les habituels par catégorie", async ({
  page,
}) => {
  // Trois courses complètes avant le tour : plus long qu'un scénario ordinaire.
  test.slow();
  // Trois courses à une semaine d'intervalle : lait et beurre ont un rythme.
  const day = (n: number) => new Date(2026, 9, n, 10);
  await page.clock.setFixedTime(day(1));
  await enterApp(page);
  for (const [index, date] of [1, 8, 15].entries()) {
    if (index > 0) await page.clock.setFixedTime(day(date));
    await addToList(page, "lait, beurre");
    await expect(line(page, "Beurre")).toBeVisible();
    await startShopping(page, "Super U", { create: index === 0 });
    await check(page, "Lait");
    await check(page, "Beurre");
    await finishShopping(page);
    await backToList(page);
  }

  // Une semaine après les dernières courses : il est temps d'en racheter.
  await page.clock.setFixedTime(day(23));
  await page.reload();
  await page.getByRole("button", { name: fr.tour.openHint(2) }).click();
  await expect(
    page.getByRole("heading", { name: fr.tour.restock }),
  ).toBeVisible();
  const main = page.getByRole("main");
  await page
    .getByRole("button", { name: fr.tour.notThisTimeLabel("Beurre") })
    .click();
  await expect(main.getByText("Beurre", { exact: true })).toHaveCount(0);
  await main.getByRole("button", { name: /^Lait/ }).click();
  await expect(
    page.getByRole("button", { name: fr.tour.notThisTimeLabel("Lait") }),
  ).toHaveCount(0);

  // Écran suivant : la catégorie, avec ses habituels (le lait, déjà ajouté).
  const dairy = category("lait-creme-beurre");
  await page.getByRole("button", { name: fr.tour.nextTo(dairy) }).click();
  await expect(page.getByRole("heading", { name: dairy })).toBeVisible();
  await expect(main.getByRole("button", { name: /Beurre/ })).toBeVisible();
  await page.getByRole("button", { name: fr.tour.finish }).click();

  // Retour à la liste : le lait y est, plus rien à racheter (le beurre est écarté).
  await expect(line(page, "Lait")).toBeVisible();
  await expect(line(page, "Beurre")).toHaveCount(0);
  await expect(page.getByText(fr.tour.openHint(1))).toHaveCount(0);
  await expect(page.getByText(fr.tour.openHint(2))).toHaveCount(0);
});
