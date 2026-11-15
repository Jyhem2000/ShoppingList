import { useEffect, useRef, useSyncExternalStore } from "react";

/**
 * Ligne qui « pulse » (docs/05 § 6) : quand on ajoute un article déjà dans la liste,
 * sa ligne se montre et grossit un instant (PulseLine.tsx). Un signal à la fois, comme
 * les messages (toast.ts). Si la ligne est dans un groupe replié, l'écran le déplie
 * (`useOnPulse`) : la ligne apparaît alors et prend le signal à ce moment-là.
 */
export interface PulseSignal {
  id: string;
  count: number;
  at: number;
}

/** Au-delà, un signal pas encore pris est oublié (ligne jamais affichée). */
const FRESH_MS = 2000;

let current: PulseSignal | undefined;
let taken = 0;
const listeners = new Set<() => void>();
const revealers = new Set<(id: string) => void>();

export function pulse(id: string): void {
  current = { id, count: (current?.count ?? 0) + 1, at: Date.now() };
  for (const reveal of revealers) reveal(id);
  for (const listener of listeners) listener();
}

/** Appelé à chaque signal, avec la ligne visée : l'écran déplie son groupe. */
export function useOnPulse(reveal: (id: string) => void): void {
  const latest = useRef(reveal);
  useEffect(() => {
    latest.current = reveal;
  });
  useEffect(() => {
    const listener = (id: string) => {
      latest.current(id);
    };
    revealers.add(listener);
    return () => {
      revealers.delete(listener);
    };
  }, []);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Le dernier signal (PulseLine). */
export function usePulse(): PulseSignal | undefined {
  return useSyncExternalStore(subscribe, () => current);
}

/** La ligne visée prend le signal, une seule fois et tant qu'il est récent. */
export function takePulse(
  signal: PulseSignal | undefined,
  id: string,
): boolean {
  if (
    signal?.id !== id ||
    signal.count <= taken ||
    Date.now() - signal.at > FRESH_MS
  )
    return false;
  taken = signal.count;
  return true;
}
