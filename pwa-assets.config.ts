import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

/** Génère les icônes de l'app à partir de public/logo.svg (`npm run icons`). */
const background = "#16161a";

export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0.1, resizeOptions: { background } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background } },
  },
  images: ["public/logo.svg"],
});
