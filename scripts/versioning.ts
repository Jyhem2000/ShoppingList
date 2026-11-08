/**
 * Calcul du prochain numéro de version à partir des messages de commit
 * (Conventional Commits, docs/07 § 9) :
 * - changement incompatible (`feat!:` ou « BREAKING CHANGE ») → majeure ;
 * - au moins une fonctionnalité (`feat:`) → mineure ;
 * - sinon (`fix:`, `docs:`, `chore:`…) → correctif.
 * Tant que la version est en 0.x, un changement incompatible ne donne qu'une mineure.
 */
export type Bump = "major" | "minor" | "patch";

const VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

export function isVersion(value: string): boolean {
  return VERSION.test(value);
}

export function detectBump(messages: readonly string[]): Bump {
  const breaking = messages.some(
    (message) =>
      /^\w+(\([^)]*\))?!:/.test(message) || message.includes("BREAKING CHANGE"),
  );
  if (breaking) return "major";
  if (messages.some((message) => /^feat(\([^)]*\))?:/.test(message)))
    return "minor";
  return "patch";
}

export function applyBump(current: string, bump: Bump): string {
  const match = VERSION.exec(current);
  if (!match) throw new Error(`Version invalide : ${current}`);
  const [major, minor, patch] = match.slice(1).map(Number) as [
    number,
    number,
    number,
  ];
  const effective = bump === "major" && major === 0 ? "minor" : bump;
  if (effective === "major") return `${major + 1}.0.0`;
  if (effective === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/**
 * Prochaine version : imposée (`1.0.0`, `minor`…) ou déduite des commits.
 * Refuse de revenir en arrière.
 */
export function nextVersion(
  current: string,
  messages: readonly string[],
  forced?: string,
): string {
  let next: string;
  if (forced && isVersion(forced)) next = forced;
  else if (forced === "major" || forced === "minor" || forced === "patch")
    next = applyBump(current, forced);
  else if (forced) throw new Error(`Argument inconnu : ${forced}`);
  else next = applyBump(current, detectBump(messages));

  // Comparaison numérique : chaque partie pèse plus que les suivantes (< 10 000).
  const weight = (v: string) =>
    v.split(".").reduce((total, part) => total * 10_000 + Number(part), 0);
  if (weight(next) <= weight(current))
    throw new Error(`${next} n'est pas plus récente que ${current}`);
  return next;
}
