import { expect, type Page } from "@playwright/test";

/**
 * Passe l'écran d'installation, comme le ferait « Continuer dans le navigateur ».
 * Les bulles d'aide (docs/03 H12) sont marquées vues, sauf `tips: true` : le scénario
 * qui les vérifie.
 */
export async function enterApp(page: Page, { tips = false } = {}) {
  if (!tips)
    await page.addInitScript(() => {
      const key = "shoppinglist.preferences";
      let preferences: Record<string, unknown> = {};
      try {
        preferences = JSON.parse(localStorage.getItem(key) ?? "{}") as Record<
          string,
          unknown
        >;
      } catch {
        // Préférences illisibles : on repart de zéro.
      }
      preferences.seenTips = [
        "shopping-place",
        "shopping-next",
        "shopping-stored",
      ];
      localStorage.setItem(key, JSON.stringify(preferences));
    });
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

/**
 * « C'est parti » dans ce magasin ; `create` : un nouveau magasin, vide (ses rayons se
 * rangent pendant les courses).
 */
export async function startShopping(
  page: Page,
  store: string,
  { create = false } = {},
) {
  await page.getByRole("button", { name: "C'est parti" }).click();
  const sheet = page.getByRole("dialog", { name: "Faire les courses" });
  if (create) {
    const other = sheet.getByRole("radio", { name: "Un autre magasin" });
    if (await other.isVisible()) await other.click();
    await sheet.getByRole("textbox", { name: "Nom du magasin" }).fill(store);
  } else await sheet.getByRole("radio", { name: store, exact: true }).click();
  await sheet.getByRole("button", { name: "C'est parti" }).click();
  await expect(page.getByTestId("shopping-progress")).toBeVisible();
}

/** « Rayon suivant » : les articles cochés ensuite iront dans un nouveau rayon. */
export async function nextAisle(page: Page) {
  await page.getByRole("button", { name: "Rayon suivant" }).click();
  // Le nouveau rayon, encore vide, s'affiche avec son explication.
  await expect(
    page.getByText("Touche un article de « À placer » quand il est"),
  ).toBeVisible();
}

/** « Terminer » puis confirmer : le bilan s'affiche. */
export async function finishShopping(page: Page) {
  await page.getByRole("button", { name: "Terminer les courses" }).click();
  await page
    .getByRole("dialog", { name: "Terminer les courses ?" })
    .getByRole("button", { name: "Terminer", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Courses terminées" }),
  ).toBeVisible();
}

/** Ligne d'un article dans la liste (pas l'en-tête d'une catégorie au nom voisin). */
export function line(page: Page, name: string) {
  return page
    .locator("main section")
    .getByRole("button", { name: new RegExp(`^${name}`) })
    .and(page.locator("button:not([aria-expanded])"));
}
