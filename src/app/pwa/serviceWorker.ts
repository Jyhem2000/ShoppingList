/**
 * Accès partagé à l'enregistrement du service worker (docs/07 § 6), utilisé par
 * le bandeau de mise à jour et l'écran de diagnostic.
 */
let registration: ServiceWorkerRegistration | undefined;

export function setRegistration(value: ServiceWorkerRegistration | undefined): void {
  registration = value;
}

export function hasRegistration(): boolean {
  return registration !== undefined;
}

/** Demande au navigateur de vérifier s'il existe une nouvelle version. */
export async function checkForUpdate(): Promise<void> {
  await registration?.update();
}

/** Numéro de la version publiée sur le serveur (fichier `version.json`, jamais mis en cache). */
export async function fetchPublishedVersion(): Promise<string | null> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}version.json`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}
