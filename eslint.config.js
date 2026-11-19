// Analyse du code (docs/08 § 4) : règles recommandées JavaScript, TypeScript strict
// avec les types, règles des hooks React. Le formatage est laissé à Prettier.
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import { readdirSync } from "node:fs";
import globals from "globals";
import tseslint from "typescript-eslint";

const featureDirs = readdirSync("src/features");
/** Imports interdits : ces modules, et tout dossier parent (« ../ »). */
const forbid = (modules) => ({
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: [...modules, "../**"],
          message:
            "Module partagé entre dossiers de features : le placer dans src/common.",
        },
      ],
    },
  ],
});

export default defineConfig([
  globalIgnores([
    "dist",
    "dev-dist",
    "tests/e2e/.results",
    "tests/e2e/.report",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // `() => sounds.add()` est lisible : on autorise les flèches courtes sans accolades.
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: true },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
    },
  },
  // Un dossier de features n'importe pas un autre dossier de features (src/app seul importe
  // leurs écrans) ; src/common, partagé entre elles, ne les importe jamais (CLAUDE.md).
  {
    files: ["src/common/**/*.{ts,tsx}"],
    rules: forbid(["@/features/**"]),
  },
  ...featureDirs.map((feature) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: forbid(
      featureDirs
        .filter((other) => other !== feature)
        .map((other) => `@/features/${other}/**`),
    ),
  })),
  prettier,
]);
