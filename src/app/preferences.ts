import { useSyncExternalStore } from "react";

/**
 * Préférences propres à l'appareil (docs/07 § 5) : sons, écran allumé, thème.
 * Stockées dans `localStorage`, hors de la base et des sauvegardes : chaque téléphone
 * garde les siennes, même après l'import des données d'un autre.
 */
export const soundEvents = [
  "add",
  "check",
  "aisleDone",
  "done",
  "remove",
  "error",
] as const;
export type SoundEvent = (typeof soundEvents)[number];

/** Thème (docs/03 H11) : celui du téléphone, ou imposé. */
export type ThemePreference = "auto" | "dark" | "light";
export const themePreferences: readonly ThemePreference[] = [
  "auto",
  "dark",
  "light",
];

export interface DevicePreferences {
  /** Interrupteur général des sons. */
  sounds: boolean;
  /** Chaque son, activable séparément (pris en compte seulement si `sounds`). */
  soundEvents: Record<SoundEvent, boolean>;
  /** Garder l'écran allumé pendant les courses. */
  keepScreenOn: boolean;
  theme: ThemePreference;
}

export const defaultPreferences: DevicePreferences = {
  sounds: true,
  soundEvents: {
    add: true,
    check: true,
    aisleDone: true,
    done: true,
    remove: true,
    error: true,
  },
  keepScreenOn: true,
  theme: "auto",
};

/** Lue aussi par le petit script d'index.html qui pose le thème avant l'affichage. */
export const STORAGE_KEY = "shoppinglist.preferences";

/** Fusionne une valeur lue (éventuellement ancienne ou abîmée) avec les valeurs par défaut. */
export function parsePreferences(raw: string | null): DevicePreferences {
  if (!raw) return defaultPreferences;
  try {
    const data = JSON.parse(raw) as Partial<DevicePreferences>;
    const bool = (value: unknown, fallback: boolean) =>
      typeof value === "boolean" ? value : fallback;
    const events = { ...defaultPreferences.soundEvents };
    for (const name of soundEvents) {
      events[name] = bool(data.soundEvents?.[name], events[name]);
    }
    return {
      sounds: bool(data.sounds, defaultPreferences.sounds),
      soundEvents: events,
      keepScreenOn: bool(data.keepScreenOn, defaultPreferences.keepScreenOn),
      theme: themePreferences.find((t) => t === data.theme) ?? "auto",
    };
  } catch {
    return defaultPreferences;
  }
}

function load(): DevicePreferences {
  try {
    return parsePreferences(localStorage.getItem(STORAGE_KEY));
  } catch {
    return defaultPreferences;
  }
}

let current: DevicePreferences | null = null;
const listeners = new Set<() => void>();

export function getPreferences(): DevicePreferences {
  current ??= load();
  return current;
}

export function updatePreferences(
  change: (previous: DevicePreferences) => DevicePreferences,
): void {
  current = change(getPreferences());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Navigation privée ou stockage plein : le réglage vaut pour la session.
  }
  for (const listener of listeners) listener();
}

export function subscribePreferences(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePreferences(): DevicePreferences {
  return useSyncExternalStore(subscribePreferences, getPreferences);
}
