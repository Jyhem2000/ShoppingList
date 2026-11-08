/**
 * Contexte d'installation de la PWA (docs/04 § 2.11).
 * Sur iPhone, tous les navigateurs utilisent WebKit et l'installation est manuelle ;
 * sur Android, Chrome propose une invite native (`beforeinstallprompt`).
 */
export type InstallContext =
  | { kind: "installed" }
  | { kind: "ios"; browser: "chrome" | "safari" | "other" }
  | { kind: "android" }
  | { kind: "other" };

export interface InstallEnvironment {
  userAgent: string;
  maxTouchPoints: number;
  standalone: boolean;
}

/** iPhone ou iPad (un iPad récent se présente comme un Mac tactile). */
export function isAppleMobile(
  env: Pick<InstallEnvironment, "userAgent" | "maxTouchPoints">,
): boolean {
  return (
    /iPhone|iPad|iPod/.test(env.userAgent) ||
    (/Macintosh/.test(env.userAgent) && env.maxTouchPoints > 1)
  );
}

export function detectInstallContext(env: InstallEnvironment): InstallContext {
  if (env.standalone) return { kind: "installed" };
  const ua = env.userAgent;
  if (isAppleMobile(env)) {
    if (/CriOS/.test(ua)) return { kind: "ios", browser: "chrome" };
    if (/FxiOS|EdgiOS|OPiOS/.test(ua)) return { kind: "ios", browser: "other" };
    return { kind: "ios", browser: "safari" };
  }
  if (/Android/.test(ua)) return { kind: "android" };
  return { kind: "other" };
}

/** Lit l'environnement réel du navigateur. */
export function currentInstallEnvironment(): InstallEnvironment {
  const nav = navigator as Navigator & { standalone?: boolean };
  return {
    userAgent: nav.userAgent,
    maxTouchPoints: nav.maxTouchPoints ?? 0,
    standalone: window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true,
  };
}

// --- Invite d'installation Android ----------------------------------------

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

/** À appeler une seule fois au démarrage, avant le rendu : l'événement arrive tôt. */
export function captureInstallPrompt(): void {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function canPromptInstall(): boolean {
  return deferredPrompt !== null;
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  const event = deferredPrompt;
  deferredPrompt = null;
  notify();
  await event.prompt();
  const choice = await event.userChoice;
  return choice.outcome === "accepted";
}
