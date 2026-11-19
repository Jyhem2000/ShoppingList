/**
 * Publication d'une version (docs/07 § 9) : `npm run release -- <major|minor|patch> [--dry-run]`.
 *
 * 1. Vérifie qu'on est sur `dev`, à jour, sans modification en cours.
 * 2. Calcule la version à partir du type demandé (jamais des messages de commit).
 * 3. Vérifie que ses nouveautés sont écrites (src/i18n/fr.ts → releaseNotes).
 * 4. Lance tous les contrôles : format, lint, types, tests unitaires et E2E.
 * 5. Fige la version sur `dev` (package.json, commit « Release MINOR X.Y.0 », tag vX.Y.0).
 * 6. Pousse `dev`, puis ajoute sur `main` un seul commit, copie exacte de `dev` à cette
 *    version : `main` ne contient qu'un commit par version, `dev` garde l'historique.
 *    Cloudflare met la production à jour.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fr } from "../src/i18n/fr.ts";
import { isBump, nextVersion, releaseTitle } from "./versioning.ts";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const bump = args.find((arg) => !arg.startsWith("--"));

const run = (command: string) => execSync(command, { stdio: "inherit" });
const read = (command: string) =>
  execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
/** Arbre (contenu complet) d'un commit ; sans `^{tree}`, que cmd.exe déforme. */
const treeOf = (rev: string) => read(`git log -1 --format=%T ${rev}`);
const succeeds = (command: string) => {
  try {
    execSync(command, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
function fail(message: string): never {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

if (!isBump(bump))
  fail(
    "Indique le type de version : npm run release -- major | minor | patch (--dry-run pour simuler).",
  );

// 1. État du dépôt
if (read("git rev-parse --abbrev-ref HEAD") !== "dev")
  fail("La publication se fait depuis la branche dev.");
if (read("git status --porcelain"))
  fail("Il reste des modifications non commitées.");
run("git fetch origin --tags --quiet");
if (succeeds("git rev-parse --verify --quiet origin/dev")) {
  if (read("git rev-list --count HEAD..origin/dev") !== "0")
    fail("dev est en retard sur origin/dev : fais un git pull.");
}
const hasMain = succeeds("git rev-parse --verify --quiet origin/main");
const lastTag = succeeds("git describe --tags --abbrev=0 --match v*")
  ? read("git describe --tags --abbrev=0 --match v*")
  : "";
// `main` doit être exactement la dernière version publiée : rien n'y est fait à la main.
if (hasMain && lastTag && treeOf("origin/main") !== treeOf(lastTag))
  fail(
    `main ne correspond pas à ${lastTag} : quelque chose y a été poussé hors de npm run release.`,
  );

// 2. Version
const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  version: string;
};
const commits = Number(
  read(`git rev-list --count ${lastTag ? `${lastTag}..HEAD` : "HEAD"}`),
);
if (lastTag && commits === 0)
  fail(`Aucun commit depuis ${lastTag} : rien à publier.`);

let version = "";
try {
  version = nextVersion(pkg.version, bump);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
console.log(
  `\nVersion ${version} (${bump} ; actuelle : ${pkg.version}, ${commits} commit(s) depuis ${lastTag || "le début"})`,
);

// 3. Nouveautés
if (!fr.releaseNotes.versions.some((notes) => notes.version === version))
  fail(
    `Écris d'abord les nouveautés de la version ${version} dans src/i18n/fr.ts (releaseNotes).`,
  );

if (dryRun) {
  console.log("Simulation (--dry-run) : rien n'a été modifié.");
  process.exit(0);
}

// 4. Contrôles
run("npm run check");
run("npm run e2e");

// 5. Figer la version
const title = releaseTitle(bump, version);
run(`npm version ${version} --no-git-tag-version`);
run("git add package.json package-lock.json");
run(`git commit -m "${title}"`);
run(`git tag -a v${version} -m "${title}"`);

// 6. Publier : dev avec son historique, puis un seul commit sur main.
run("git push origin dev --follow-tags");
const release = read(
  [
    `git commit-tree ${treeOf("HEAD")}`,
    hasMain ? "-p origin/main" : "",
    `-m "${title}" -m "Copie de dev (commit ${read("git rev-parse --short HEAD")}, tag v${version})."`,
  ].join(" "),
);
run(`git push origin ${release}:refs/heads/main`);
console.log(
  `\n✔ Version ${version} publiée : Cloudflare met la production à jour.`,
);
