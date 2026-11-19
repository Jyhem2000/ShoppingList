import { expect, test, type Page } from "@playwright/test";
import {
  addIngredients,
  addToList,
  createRecipe,
  enterApp,
  ingredient,
  line,
} from "./app";
import { fr } from "./texts";

/** Scénario de bout en bout des recettes (docs/08 § 3 : 7). */

const t = fr.recipes;

/** Fin de la modification, puis « Ajouter à une liste » : le panneau s'ouvre. */
async function openAddSheet(page: Page, name: string) {
  await page.getByRole("button", { name: t.editDone, exact: true }).click();
  await page.getByRole("button", { name: t.addToList }).click();
  return page.getByRole("dialog", { name: t.add.title(name) });
}

async function backToList(page: Page) {
  await page
    .getByRole("navigation", { name: fr.tabs.navigation })
    .getByRole("link", { name: fr.tabs.list })
    .click();
}

test("7. recette ajoutée pour un autre rendement (personnes et cakes)", async ({
  page,
}) => {
  await enterApp(page);
  await addToList(page, "1 kg de farine");
  await expect(line(page, "Farine")).toContainText("1 kg");

  // Pour 4 personnes, avec un pot de crème à quantité fixe.
  await createRecipe(page, "Tarte à l'oignon", {
    quantity: 4,
    unit: "personnes",
  });
  // Un nombre seul compte des objets : 2 oignons, pas 2 kg (docs/03 A2).
  await addIngredients(page, "2 oignons, 500 g de farine, 1 crème fraîche");
  await expect(ingredient(page, "Oignons")).toContainText("× 2");
  await expect(page.locator("main li")).toHaveCount(3);
  await ingredient(page, "Crème fraîche").getByRole("button").click();
  const crème = page.getByRole("dialog", { name: "Crème fraîche" });
  // Case enregistrée tout de suite dans la base, puis cochée : un toucher, puis attendre.
  const fixed = crème.getByRole("checkbox", {
    name: new RegExp(t.ingredient.fixed),
  });
  await fixed.click();
  await expect(fixed).toBeChecked();
  await crème.getByRole("button", { name: t.ingredient.done }).click();
  await expect(ingredient(page, "Crème fraîche")).toContainText(t.fixed);

  // Ajoutée pour 6 : 3 oignons, 750 g de farine fusionnés avec 1 kg, toujours 1 crème.
  const tarte = await openAddSheet(page, "Tarte à l'oignon");
  await tarte.getByRole("button", { name: t.add.more }).click();
  await tarte.getByRole("button", { name: t.add.more }).click();
  await expect(tarte).toContainText("6 personnes");
  await expect(tarte).toContainText(t.add.merged("1 kg", "1,75 kg"));
  await tarte.getByRole("button", { name: t.add.apply(3) }).click();
  await expect(tarte).toBeHidden();

  // Un cake avec 3 œufs, demandé pour 2 cakes.
  await createRecipe(page, "Cake", { quantity: 1, unit: "cake" });
  await addIngredients(page, "3 œufs");
  await expect(ingredient(page, "Œufs")).toBeVisible();

  // Étapes mises en forme pendant qu'on les écrit, par la barre.
  const steps = page.getByRole("textbox", { name: t.steps });
  const toolbar = page.getByRole("toolbar", { name: fr.markdown.toolbar });
  await steps.click();
  await toolbar.getByRole("button", { name: fr.markdown.numbers }).click();
  await steps.pressSequentially("Battre les œufs");
  await steps.press("Enter");
  await steps.pressSequentially("Cuire ");
  await toolbar.getByRole("button", { name: fr.markdown.bold }).click();
  await steps.pressSequentially("40 min");
  await expect(steps.locator("ol > li")).toHaveCount(2);
  await expect(steps.locator("strong")).toHaveText("40 min");

  const cake = await openAddSheet(page, "Cake");
  await cake.getByRole("button", { name: t.add.more }).click();
  await expect(cake).toContainText("2 cakes");
  await cake.getByRole("button", { name: t.add.apply(1) }).click();
  await expect(cake).toBeHidden();
  // Enregistrées (en Markdown) et relues mises en forme sur la fiche.
  await expect(page.locator("main ol > li")).toHaveText([
    "Battre les œufs",
    "Cuire 40 min",
  ]);
  await expect(page.locator("main ol strong")).toHaveText("40 min");

  await backToList(page);
  await expect(line(page, "Oignons")).toContainText("× 3");
  await expect(line(page, "Farine")).toContainText("1,75 kg");
  await expect(line(page, "Crème fraîche")).toContainText("× 1");
  await expect(line(page, "Œufs")).toContainText("× 6");
  await expect(line(page, "Oignons")).toContainText(
    fr.list.via(["Tarte à l'oignon"]),
  );
  await expect(line(page, "Œufs")).toContainText(fr.list.via(["Cake"]));
});
