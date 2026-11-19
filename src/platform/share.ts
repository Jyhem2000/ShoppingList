/**
 * Partager un fichier (docs/07 § 3, Web Share) : la feuille de partage du téléphone
 * (Fichiers, Drive, mail…) quand elle accepte les fichiers, sinon un téléchargement.
 * Renvoie `false` si l'utilisateur a fermé la feuille sans rien choisir.
 */
export async function shareOrDownload(file: File): Promise<boolean> {
  if (
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError")
        return false;
      // Partage refusé par le navigateur : on télécharge à la place.
    }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10_000);
  return true;
}

/**
 * Partager un texte (docs/03 F1) : la feuille de partage du téléphone (Messages,
 * WhatsApp, Mail…). `unsupported` : pas de feuille de partage, on copiera le texte.
 */
export async function shareText(
  text: string,
): Promise<"shared" | "cancelled" | "unsupported"> {
  if (typeof navigator.share !== "function") return "unsupported";
  try {
    await navigator.share({ text });
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      return "cancelled";
    return "unsupported";
  }
}
