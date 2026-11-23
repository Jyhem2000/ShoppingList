import { useSyncExternalStore } from "react";

/**
 * Accès partagé à l'enregistrement du service worker (docs/07 § 6), utilisé par
 * le bandeau de mise à jour et l'écran « À propos ».
 * Toutes les vérifications ont un délai maximal : un réseau de magasin très lent
 * ne doit jamais laisser une vérification en suspens.
 */
const TIMEOUT_MS = 10_000;

let registration: ServiceWorkerRegistration | undefined;

export function setRegistration(
  value: ServiceWorkerRegistration | undefined,
): void {
  registration = value;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

/**
 * Nouvelle version prête (bandeau de mise à jour) : partagé avec « À propos », qui
 * ne dit jamais « à jour » quand le bandeau propose de mettre à jour.
 */
export interface UpdateState {
  phase: "none" | "available" | "updating";
  version: string | null;
  /** Active la nouvelle version (absent tant qu'aucune n'est prête). */
  apply?: () => void;
}

let state: UpdateState = { phase: "none", version: null };
const listeners = new Set<() => void>();

export function setUpdateState(next: Partial<UpdateState>): void {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updateState(): UpdateState {
  return state;
}

export function useUpdateState(): UpdateState {
  return useSyncExternalStore(subscribe, () => state);
}

export type UpdateCheckResult =
  "available" | "upToDate" | "failed" | "unavailable";

/**
 * Demande au navigateur de vérifier s'il existe une nouvelle version.
 * « failed » si le serveur ne répond pas dans le délai (hors ligne, réseau lent).
 */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
  if (!registration) return "unavailable";
  try {
    await withTimeout(registration.update(), TIMEOUT_MS);
  } catch {
    return "failed";
  }
  return registration.waiting || registration.installing
    ? "available"
    : "upToDate";
}

/** Numéro de la version publiée sur le serveur (fichier `version.json`, jamais mis en cache). */
export async function fetchPublishedVersion(): Promise<string | null> {
  try {
    const response = await withTimeout(
      fetch(`${import.meta.env.BASE_URL}version.json`, { cache: "no-store" }),
      TIMEOUT_MS,
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}
