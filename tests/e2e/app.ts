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

/** Noms des rayons affichés, dans l'ordre. */
export async function aisleNames(page: Page): Promise<string[]> {
  return page
    .locator("main section[aria-label]")
    .evaluateAll((sections) =>
      sections.map((section) => section.getAttribute("aria-label") ?? ""),
    );
}

/** Ligne d'un article dans la liste. */
export function line(page: Page, name: string) {
  return page
    .locator("main section")
    .getByRole("button", { name: new RegExp(`^${name}`) });
}
