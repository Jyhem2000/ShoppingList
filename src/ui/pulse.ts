import { useSyncExternalStore } from "react";

/**
 * Ligne qui « pulse » (docs/05 § 6) : quand on ajoute un article déjà dans la liste,
 * sa ligne se montre et grossit un instant (PulseLine.tsx). Un signal à la fois, comme
 * les messages (toast.ts).
 */
let current: { id: string; count: number } | undefined;
const listeners = new Set<() => void>();

export function pulse(id: string): void {
  current = { id, count: (current?.count ?? 0) + 1 };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Numéro du dernier signal adressé à cette ligne (0 : aucun). */
export function usePulse(id: string): number {
  return useSyncExternalStore(subscribe, () =>
    current?.id === id ? current.count : 0,
  );
}
