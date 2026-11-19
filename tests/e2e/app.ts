import { expect, type Page } from "@playwright/test";
import { fr } from "./texts";

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
  await page.getByRole("button", { name: fr.install.continue }).click();
  await expect(
    page.getByRole("navigation", { name: fr.tabs.navigation }),
  ).toBeVisible();
  // La barre d'ajout n'apparaît qu'une fois les données de départ créées.
  await expect(
    page.getByRole("textbox", { name: fr.list.addPlaceholder }),
  ).toBeVisible({ timeout: FIRST_LAUNCH_TIMEOUT });
}

/**
 * Premier lancement : une écriture IndexedDB par unité, catégorie et article (environ
 * 540). Le WebKit de Playwright sous Windows met environ 15,6 ms par écriture, un tic
 * de l'horloge de Windows, quelle que soit la taille de l'objet : environ 8,5 s
 * d'écritures, 11 s en tout, au-delà des 10 s d'une attente ordinaire (docs/08 § 3).
 * Quelques millisecondes sous Chromium. 30 s laissent de la marge au catalogue.
 */
const FIRST_LAUNCH_TIMEOUT = 30_000;

/**
 * Saisie dans la barre d'ajout de la liste, validée par Entrée. En mode courses, le
 * champ porte un libellé plus court (`fr.shopping.addPlaceholder`).
 */
export async function addToList(
  page: Page,
  text: string,
  label: string = fr.list.addPlaceholder,
) {
  const input = page.getByRole("textbox", { name: label });
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
 * Toucher jusqu'à obtenir l'effet attendu. Sous WebKit, un toucher peut se perdre : la
 * ligne visée bouge juste après que Playwright l'a jugée immobile (une ligne qui change
 * de rayon, un rayon qui s'ouvre), ou la page cesse un moment de se redessiner (docs/08
 * § 3). À réserver aux actions qu'un second toucher ne défait pas.
 */
export async function tapUntil(
  tap: () => Promise<unknown>,
  done: (timeout: number) => Promise<unknown>,
) {
  let first = true;
  await expect(async () => {
    if (!first)
      try {
        // Le toucher précédent a peut-être fini par porter : ne pas le défaire.
        await done(500);
        return;
      } catch {
        // Toujours rien : on retouche.
      }
    first = false;
    await tap();
    await done(2000);
  }).toPass({ intervals: [250, 500, 1000] });
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
  await page.getByRole("button", { name: fr.shopping.start }).click();
  const sheet = page.getByRole("dialog", { name: fr.shopping.startTitle });
  if (create) {
    const other = sheet.getByRole("radio", { name: fr.shopping.newStore });
    if (await other.isVisible()) await other.click();
    await sheet
      .getByRole("textbox", { name: fr.shopping.newStoreName })
      .fill(store);
  } else await sheet.getByRole("radio", { name: store, exact: true }).click();
  await sheet.getByRole("button", { name: fr.shopping.go }).click();
  await expect(page.getByTestId("shopping-progress")).toBeVisible();
}

/**
 * « Rayon suivant » : les articles cochés ensuite iront dans un nouveau rayon. Le
 * retoucher sur un rayon neuf et vide ne fait rien de plus (src/db/sessions.ts).
 */
export async function nextAisle(page: Page) {
  await tapUntil(
    () =>
      page
        .getByRole("button", { name: fr.shopping.nextAisle })
        .click({ timeout: 3000 }),
    // Le nouveau rayon, encore vide, s'affiche avec son explication.
    (timeout) =>
      expect(page.getByText(fr.shopping.emptyAisle)).toBeVisible({ timeout }),
  );
}

/** « Terminer » puis confirmer : le bilan s'affiche. */
export async function finishShopping(page: Page) {
  const confirm = page.getByRole("dialog", {
    name: fr.shopping.finishTitle,
  });
  await tapUntil(
    () =>
      page
        .getByRole("button", { name: fr.shopping.finishLong })
        .click({ timeout: 3000 }),
    (timeout) => expect(confirm).toBeVisible({ timeout }),
  );
  await confirm
    .getByRole("button", { name: fr.shopping.finishConfirm, exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: fr.shopping.recap.title }),
  ).toBeVisible();
}

/** Bilan des courses → « Retour à la liste ». */
export async function backToList(page: Page) {
  const add = page.getByRole("textbox", { name: fr.list.addPlaceholder });
  await tapUntil(
    () =>
      page
        .getByRole("button", { name: fr.shopping.recap.back })
        .click({ timeout: 3000 }),
    (timeout) => expect(add).toBeVisible({ timeout }),
  );
}

/** Ligne d'un article dans la liste (pas l'en-tête d'une catégorie au nom voisin). */
export function line(page: Page, name: string) {
  return page
    .locator("main section")
    .getByRole("button", { name: new RegExp(`^${name}`) })
    .and(page.locator("button:not([aria-expanded])"));
}

/** En mode courses : toucher un article et attendre qu'il soit coché (enregistré). */
export async function check(page: Page, name: string) {
  await tapUntil(
    () => line(page, name).click({ timeout: 3000 }),
    (timeout) =>
      expect(line(page, name)).toHaveAttribute("aria-pressed", "true", {
        timeout,
      }),
  );
}

/** Onglet Recettes → « Nouvelle recette » : nom et rendement, puis la fiche en modification. */
export async function createRecipe(
  page: Page,
  name: string,
  { quantity, unit }: { quantity: number; unit: string },
) {
  await page
    .getByRole("navigation", { name: fr.tabs.navigation })
    .getByRole("link", { name: fr.tabs.recipes })
    .click();
  // Sans recette, le bouton de l'écran vide ; sinon le menu ⋯.
  const empty = page.getByText(fr.recipes.emptyTitle);
  const search = page.getByRole("searchbox", { name: fr.recipes.search });
  await expect(empty.or(search)).toBeVisible();
  if (await empty.isVisible()) {
    await page.getByRole("button", { name: fr.recipes.create }).click();
  } else {
    await page.getByRole("button", { name: fr.recipes.menu }).click();
    await page
      .getByRole("dialog", { name: fr.recipes.title })
      .getByRole("button", { name: fr.recipes.create })
      .click();
  }
  const sheet = page.getByRole("dialog", { name: fr.recipes.newTitle });
  await sheet.getByRole("textbox", { name: fr.recipes.name }).fill(name);
  await sheet
    .getByRole("textbox", { name: fr.list.line.quantity })
    .fill(String(quantity));
  await sheet.getByRole("button", { name: unit, exact: true }).click();
  await sheet.getByRole("button", { name: fr.recipes.createSubmit }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

/** Barre d'ajout des ingrédients de la fiche en modification. */
export async function addIngredients(page: Page, text: string) {
  const input = page.getByRole("textbox", { name: fr.recipes.addPlaceholder });
  await input.fill(text);
  await input.press("Enter");
}

/** Ingrédient de la fiche (en modification : une ligne à toucher). */
export function ingredient(page: Page, name: string) {
  return page.locator("main li").filter({ hasText: name });
}
