import { expect, type Page } from "@playwright/test";

/** Passe l'écran d'installation, comme le ferait « Continuer dans le navigateur ». */
export async function enterApp(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Continuer dans le navigateur" })
    .click();
  await expect(
    page.getByRole("navigation", { name: "Navigation principale" }),
  ).toBeVisible();
}

/** Saisie dans la barre d'ajout de la liste, validée par Entrée. */
export async function addToList(page: Page, text: string) {
  const input = page.getByRole("textbox", { name: "Ajouter un article…" });
  await input.fill(text);
  await input.press("Enter");
}

/** Noms des groupes affichés (catégories de la liste, rayons des courses), dans l'ordre. */
export async function aisleNames(page: Page): Promise<string[]> {
  return page
    .locator("main section[aria-label]")
    .evaluateAll((sections) =>
      sections.map(
        (section) =>
          (section.getAttribute("aria-label") ?? "").split(" — ")[0] ?? "",
      ),
    );
}

/** « C'est parti » dans ce magasin. */
export async function startShopping(page: Page, store: string) {
  await page.getByRole("button", { name: "C'est parti" }).click();
  const sheet = page.getByRole("dialog", { name: "Faire les courses" });
  await sheet.getByRole("radio", { name: store, exact: true }).click();
  await sheet.getByRole("button", { name: "C'est parti" }).click();
  await expect(page.getByTestId("shopping-progress")).toBeVisible();
}

/** Ligne d'un article dans la liste (pas l'en-tête d'une catégorie au nom voisin). */
export function line(page: Page, name: string) {
  return page
    .locator("main section")
    .getByRole("button", { name: new RegExp(`^${name}`) })
    .and(page.locator("button:not([aria-expanded])"));
}
