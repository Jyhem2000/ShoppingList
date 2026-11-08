import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/** Informations de version injectées dans l'app (docs/07 § 9). */
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};

function gitCommit(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "local";
  }
}

const buildInfo = {
  version: pkg.version,
  commit: gitCommit(),
  channel: process.env.APP_CHANNEL ?? "dev",
  buildDate: new Date().toISOString(),
};

/** Publie `version.json` (non mis en cache) pour annoncer le numéro d'une nouvelle version. */
function versionFile(): Plugin {
  return {
    name: "shoppinglist-version-file",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify(buildInfo, null, 2),
      });
    },
  };
}

/**
 * Publie `licences.txt` : nom, version, licence et texte de licence de chaque
 * bibliothèque réellement incluse dans l'app (exigence des licences MIT, ISC, OFL…).
 * Généré à chaque build : aucune liste à tenir à jour à la main.
 */
function licencesFile(): Plugin {
  /** Inclus via le CSS ou le service worker, donc absents des modules JavaScript. */
  const extraPackages = ["@fontsource-variable/nunito", "workbox-window"];

  const packageRoot = (id: string): string | null => {
    const file = id.replaceAll("\\", "/");
    const index = file.lastIndexOf("/node_modules/");
    if (index === -1) return null;
    const rest = file.slice(index + "/node_modules/".length).split("/");
    const name = rest[0]?.startsWith("@") ? `${rest[0]}/${rest[1]}` : rest[0];
    return name ? join(file.slice(0, index), "node_modules", name) : null;
  };

  return {
    name: "shoppinglist-licences-file",
    apply: "build",
    generateBundle(_options, bundle) {
      const roots = new Set<string>();
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk") continue;
        for (const id of chunk.moduleIds) {
          const root = packageRoot(id.replace(/^\0/, ""));
          if (root) roots.add(root);
        }
      }
      for (const name of extraPackages) roots.add(join(process.cwd(), "node_modules", name));

      const entries = [...roots]
        .filter((root) => existsSync(join(root, "package.json")))
        .map((root) => {
          const meta = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
            name: string;
            version: string;
            license?: string;
          };
          const licenceFile = readdirSync(root).find((file) => /^(licen[cs]e|copying)/i.test(file));
          const text = licenceFile ? readFileSync(join(root, licenceFile), "utf8").trim() : "";
          return { ...meta, text };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      const unique = entries.filter(
        (entry, i) => entries.findIndex((e) => e.name === entry.name) === i,
      );
      const rule = "=".repeat(72);
      const source = [
        "ShoppingList — bibliothèques incluses et leurs licences",
        "",
        ...unique.flatMap((entry) => [
          rule,
          `${entry.name} ${entry.version} — ${entry.license ?? "?"}`,
          rule,
          entry.text,
          "",
        ]),
      ].join("\n");
      this.emitFile({ type: "asset", fileName: "licences.txt", source });
    },
  };
}

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  define: {
    __APP_VERSION__: JSON.stringify(buildInfo.version),
    __APP_COMMIT__: JSON.stringify(buildInfo.commit),
    __APP_CHANNEL__: JSON.stringify(buildInfo.channel),
    __APP_BUILD_DATE__: JSON.stringify(buildInfo.buildDate),
  },
  plugins: [
    react(),
    tailwindcss(),
    versionFile(),
    licencesFile(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png"],
      manifest: {
        id: "/",
        name: "ShoppingList",
        short_name: "ShoppingList",
        description: "Liste de courses triée par rayon, dans l'ordre de ton magasin.",
        lang: "fr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0f0f12",
        theme_color: "#0f0f12",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2,mp3,m4a,txt}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
});
