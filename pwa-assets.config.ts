import {
  defineConfig,
  minimal2023Preset,
} from "@vite-pwa/assets-generator/config";

/**
 * Génère les icônes de l'app à partir de public/logo.svg (`npm run icons`).
 * Le logo a un fond plein (couleur `--surface`) : aucune marge transparente, et la
 * marge de l'icône Android (maskable) prend la même couleur que ce fond.
 */
const background = "#18181d";

export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0.1,
      resizeOptions: { background },
    },
    apple: {
      ...minimal2023Preset.apple,
      padding: 0,
      resizeOptions: { background },
    },
  },
  images: ["public/logo.svg"],
});
