/**
 * Prochain numéro de version (docs/07 § 9) : le type de version est donné à
 * `npm run release`, jamais déduit des messages de commit.
 * - `major` : changement incompatible → 2.0.0 ;
 * - `minor` : nouvelle fonctionnalité → 1.1.0 ;
 * - `patch` : corrections → 1.0.1.
 */
export type Bump = "major" | "minor" | "patch";

const VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

export function isBump(value: string | undefined): value is Bump {
  return value === "major" || value === "minor" || value === "patch";
}

/** Titre du commit et du tag d'une version : « Release MINOR 1.1.0 ». */
export function releaseTitle(bump: Bump, version: string): string {
  return `Release ${bump.toUpperCase()} ${version}`;
}

export function nextVersion(current: string, bump: Bump): string {
  const match = VERSION.exec(current);
  if (!match) throw new Error(`Version invalide : ${current}`);
  const [major, minor, patch] = match.slice(1).map(Number) as [
    number,
    number,
    number,
  ];
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}
