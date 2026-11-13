/**
 * Presse-papiers (docs/03 H4) : copier et coller une sauvegarde en texte, en plus du
 * fichier. Fonctionnalité de confort : détectée, jamais d'erreur là où elle manque
 * (docs/01, règle d'utilisation des fonctionnalités du navigateur).
 */

export function canCopyText(): boolean {
  return typeof navigator !== "undefined" && "clipboard" in navigator;
}

/**
 * Copie un texte produit après coup (`text` est une promesse). Sur iPhone, la copie
 * doit partir du toucher lui-même : `ClipboardItem` accepte une promesse et garde ce
 * lien ; sinon, `writeText` une fois le texte prêt. Renvoie `false` si c'est refusé.
 */
export async function copyText(text: Promise<string>): Promise<boolean> {
  if (!canCopyText()) return false;
  try {
    if (
      typeof ClipboardItem !== "undefined" &&
      "write" in navigator.clipboard
    ) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": text.then(
            (value) => new Blob([value], { type: "text/plain" }),
          ),
        }),
      ]);
      return true;
    }
  } catch {
    // Promesse refusée par ce navigateur : on essaie la voie simple.
  }
  try {
    await navigator.clipboard.writeText(await text);
    return true;
  } catch {
    return false;
  }
}

/** Lit le presse-papiers ; `undefined` si c'est refusé ou impossible (on fera coller à la main). */
export async function pasteText(): Promise<string | undefined> {
  if (!canCopyText() || !("readText" in navigator.clipboard)) return undefined;
  try {
    return await navigator.clipboard.readText();
  } catch {
    return undefined;
  }
}
