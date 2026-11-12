import { catalogData } from "@/data/catalog";
import type { IconPack } from "./pack";

/**
 * Pack d'icônes d'articles (docs/05 § 4), assemblé par Vite au build à partir des
 * dessins `src/icons/drawn/<clé d'article>.svg` : aucun fichier généré à versionner.
 * Libellé et mots-clés français viennent de l'article de même clé (nom, alias, types).
 * Importé à la demande par `pack.ts` : il forme un fichier à part.
 */
const drawings = import.meta.glob<string>("./drawn/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

const words = (text: string) =>
  text
    .toLowerCase()
    .split(/[\s,:’'()-]+/)
    .filter((word) => word.length > 1);

/** Les identifiants internes du SVG sont préfixés pour rester uniques dans la page. */
const prefixIds = (body: string, name: string) =>
  body
    .replace(/id="([^"]+)"/g, `id="${name}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${name}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${name}-$1"`);

/**
 * Le filet sombre qui détache deux objets (docs/05 § 4) est dessiné dans la couleur du
 * fond des cartes, #18181d en thème sombre : il suit le thème (--surface), sinon il
 * ferait un trait noir sur fond blanc.
 */
const GAP = "#18181d";
const themeGap = (body: string) =>
  body.replace(/<[^>]+>/g, (tag) => {
    if (!tag.includes(GAP)) return tag;
    const styles: string[] = [];
    const cleaned = tag.replace(
      /\s(fill|stroke)="#18181d"/g,
      (_, prop: string) => {
        styles.push(`${prop}:var(--surface)`);
        return "";
      },
    );
    return cleaned.replace(/^<(\w+)/, `<$1 style="${styles.join(";")}"`);
  });

const pack: IconPack = {};

for (const [path, svg] of Object.entries(drawings)) {
  const name = path.slice("./drawn/".length, -".svg".length);
  const article = catalogData.find((a) => a.key === name);
  if (!article) throw new Error(`${path} : aucun article n'a cette clé`);
  const body = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(svg)?.[1];
  if (!body) throw new Error(`${path} : SVG illisible`);
  const keywords = new Set(
    [
      article.name.fr,
      ...(article.aliases?.fr ?? []),
      ...(article.types?.fr ?? []),
    ].flatMap(words),
  );
  pack[name] = {
    b: themeGap(prefixIds(body.replace(/>\s+</g, "><").trim(), name)),
    l: article.name.fr.toLocaleLowerCase("fr"),
    k: [...keywords].sort((a, b) => a.localeCompare(b, "fr")),
    c: article.category,
  };
}

export default pack;
