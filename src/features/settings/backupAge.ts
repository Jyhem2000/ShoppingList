const DAY_MS = 24 * 60 * 60 * 1000;

/** Jours entiers depuis la dernière sauvegarde, `undefined` s'il n'y en a jamais eu. */
export function daysSince(
  at: number | undefined,
  now: number,
): number | undefined {
  return at === undefined ? undefined : Math.floor((now - at) / DAY_MS);
}
