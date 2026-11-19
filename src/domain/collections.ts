import type { ID } from "./model";

/**
 * Petites aides sur les tableaux, les tables et les ensembles, partagées par le domaine
 * et les écrans. Fonctions pures.
 */

/** Table `id → objet`. */
export function byId<T extends { id: ID }>(items: readonly T[]): Map<ID, T> {
  return new Map(items.map((item) => [item.id, item]));
}

/** Nombre d'éléments par clé (`key`). */
export function countBy<T, K>(
  items: Iterable<T>,
  key: (item: T) => K,
): Map<K, number> {
  const counts = new Map<K, number>();
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

/** Copie de l'ensemble avec `value` présent ou absent (état React immuable). */
export function withMember<T>(
  set: ReadonlySet<T>,
  value: T,
  present: boolean,
): ReadonlySet<T> {
  if (set.has(value) === present) return set;
  const next = new Set(set);
  if (present) next.add(value);
  else next.delete(value);
  return next;
}
