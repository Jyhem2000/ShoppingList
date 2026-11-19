import { readFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import type { Plugin } from "vite";

/**
 * Dessins du pack d'icônes (docs/05 § 4) préparés au build plutôt que dans le
 * téléphone : `import "./drawn/pomme.svg?icon"` donne le contenu du SVG, sans sa
 * balise `<svg>`, prêt à être affiché. Utilisé par Vite et par Vitest.
 */

/** Les identifiants internes du SVG sont préfixés pour rester uniques dans la page. */
const prefixIds = (body: string, prefix: string) =>
  body
    .replace(/id="([^"]+)"/g, `id="${prefix}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${prefix}-$1"`);

/**
 * Le filet sombre qui détache deux objets (docs/05 § 4) est dessiné dans la couleur du
 * fond des cartes, #18181d en thème sombre (`--icon-gap`) ; en thème clair, il prend le
 * fond de la ligne (`--row-bg`) ou des cartes (`--surface`), sinon il ferait un trait
 * noir sur fond blanc.
 */
const GAP = "#18181d";
const themeGap = (body: string) =>
  body.replace(/<[^>]+>/g, (tag) => {
    if (!tag.includes(GAP)) return tag;
    const styles: string[] = [];
    const cleaned = tag.replace(
      /\s(fill|stroke)="#18181d"/g,
      (_, prop: string) => {
        styles.push(`${prop}:var(--icon-gap,var(--row-bg,var(--surface)))`);
        return "";
      },
    );
    return cleaned.replace(/^<(\w+)/, `<$1 style="${styles.join(";")}"`);
  });

export function iconSvg(): Plugin {
  return {
    name: "shoppinglist-icon-svg",
    enforce: "pre",
    async load(id) {
      const [file, query] = id.split("?");
      if (query !== "icon" || !file) return null;
      const svg = await readFile(file, "utf8");
      const body = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(svg)?.[1];
      if (!body) this.error(`${file} : SVG illisible`);
      // Préfixe : dossier et nom du dessin (« drawn-pomme », « dishes-lasagnes »).
      const prefix = `${basename(dirname(file))}-${basename(file, ".svg")}`;
      const ready = themeGap(
        prefixIds(body.replace(/>\s+</g, "><").trim(), prefix),
      );
      return `export default ${JSON.stringify(ready)};`;
    },
  };
}
