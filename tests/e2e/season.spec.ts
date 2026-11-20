import { expect, test } from "@playwright/test";
import { enterApp } from "./app";
import { fr } from "./texts";

test("10. saison : filtre du catalogue, pastille dans la liste, mois de la fiche article", async ({
  page,
}) => {
  // Mi-novembre : poireaux de saison, fraises non.
  await page.clock.setFixedTime(new Date(2026, 10, 19, 10));
  await enterApp(page);

  await page
    .getByRole("navigation", { name: fr.tabs.navigation })
    .getByRole("link", { name: fr.tabs.catalog })
    .click();
  await page.getByRole("button", { name: fr.catalog.seasonFilter }).click();
  await expect(
    page.getByText(fr.catalog.seasonTitle("novembre")),
  ).toBeVisible();
  const main = page.getByRole("main");
  await expect(
    main.getByRole("button", { name: /Poireaux/ }).first(),
  ).toBeVisible();
  await expect(main.getByRole("button", { name: /Fraises/ })).toHaveCount(0);

  // Ajouté depuis le filtre : la ligne porte la pastille.
  await main
    .getByRole("button", { name: /Poireaux/ })
    .first()
    .click();
  await page
    .getByRole("navigation", { name: fr.tabs.navigation })
    .getByRole("link", { name: fr.tabs.list })
    .click();
  await expect(
    main
      .getByRole("button", { name: /Poireaux/ })
      .getByRole("img", { name: fr.season.badge }),
  ).toBeVisible();

  // Fiche article : novembre ajouté aux fraises, elles deviennent de saison.
  await page.goto("/#/reglages/articles");
  await page
    .getByRole("searchbox", { name: fr.manage.articles.search })
    .fill("fraises");
  await main.getByRole("link", { name: /^Fraises/ }).click();
  const november = page.getByRole("button", { name: "novembre" });
  await expect(november).toHaveAttribute("aria-pressed", "false");
  await november.click();
  await expect(november).toHaveAttribute("aria-pressed", "true");

  await page
    .getByRole("navigation", { name: fr.tabs.navigation })
    .getByRole("link", { name: fr.tabs.catalog })
    .click();
  await page.getByRole("button", { name: fr.catalog.seasonFilter }).click();
  await expect(
    main.getByRole("button", { name: /Fraises/ }).first(),
  ).toBeVisible();
});
