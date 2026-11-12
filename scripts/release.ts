/**
 * Publication d'une version (docs/07 § 9) : `npm run release [-- <version|patch|minor|major>] [--dry-run]`.
 *
 * 1. Vérifie qu'on est sur `dev`, à jour, sans modification en cours.
 * 2. Calcule la version (déduite des commits depuis la dernière version, ou imposée).
 * 3. Vérifie que ses nouveautés sont écrites (src/i18n/fr.ts → releaseNotes).
 * 4. Lance tous les contrôles : format, lint, types, tests unitaires et E2E.
 * 5. Fige la version (package.json, commit « chore: version X », tag vX).
 * 6. Pousse `dev` puis avance `main` : Cloudflare met la production à jour.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { nextVersion } from "./versioning.ts";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const forced = args.find((arg) => !arg.startsWith("--"));

const run = (command: string) => execSync(command, { stdio: "inherit" });
const read = (command: string) =>
  execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
const succeeds = (command: string) => {
  try {
    execSync(command, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
const fail = (message: string): never => {
  console.error(`\n✖ ${message}`);
  process.exit(1);
};

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
if (hasMain && !succeeds("git merge-base --is-ancestor origin/main HEAD"))
  fail(
    "main contient des commits absents de dev : à fusionner dans dev d'abord.",
  );

// 2. Version
const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  version: string;
};
const lastTag = succeeds("git describe --tags --abbrev=0 --match v*")
  ? read("git describe --tags --abbrev=0 --match v*")
  : "";
const range = lastTag ? `${lastTag}..HEAD` : "HEAD";
const log = read(`git log ${range} --format=%B%x1e`);
const messages = log
  .split("\x1e")
  .map((message) => message.trim())
  .filter(Boolean);
if (lastTag && messages.length === 0)
  fail(`Aucun commit depuis ${lastTag} : rien à publier.`);

let version = "";
try {
  // Première publication : la version de package.json n'a encore jamais été publiée.
  version =
    !lastTag && !forced
      ? pkg.version
      : nextVersion(pkg.version, messages, forced);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
console.log(
  `\nVersion ${version} (actuelle : ${pkg.version}, ${messages.length} commit(s) depuis ${lastTag || "le début"})`,
);

// 3. Nouveautés
if (!readFileSync("src/i18n/fr.ts", "utf8").includes(`version: "${version}"`))
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
if (version !== pkg.version) {
  run(`npm version ${version} --no-git-tag-version`);
  run("git add package.json package-lock.json");
  run(`git commit -m "chore: version ${version}"`);
}
run(`git tag -a v${version} -m "Version ${version}"`);

// 6. Publier
run("git push origin dev --follow-tags");
run("git push origin dev:main");
console.log(
  `\n✔ Version ${version} publiée : Cloudflare met la production à jour.`,
);
