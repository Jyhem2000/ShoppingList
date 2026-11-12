import { useSyncExternalStore } from "react";

/**
 * Message bref en bas de l'écran, avec une action facultative (« Annuler »).
 * Un seul à la fois : un nouveau message remplace le précédent.
 * Ton (docs/05 § 5.7) : neutre (retrait annulable), réussite, information,
 * attention, erreur.
 */
export type ToastTone = "neutral" | "success" | "info" | "warning" | "error";

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  action?: { label: string; run: () => void };
}

export interface ToastOptions {
  tone?: ToastTone;
  action?: Toast["action"];
  duration?: number;
}

/** Un message à lire : 3 s ; avec une action (« Annuler »), le temps de la toucher : 5 s. */
const DURATION_MS = 3000;
const ACTION_DURATION_MS = 5000;

let current: Toast | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function dismissToast(): void {
  clearTimeout(timer);
  current = null;
  emit();
}

export function showToast(message: string, options: ToastOptions = {}): void {
  const {
    tone = "neutral",
    action,
    duration = action ? ACTION_DURATION_MS : DURATION_MS,
  } = options;
  clearTimeout(timer);
  current = { id: nextId++, message, tone, action };
  emit();
  timer = setTimeout(dismissToast, duration);
}

export function useToast(): Toast | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}
