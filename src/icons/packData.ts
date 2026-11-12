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
    b: prefixIds(body.replace(/>\s+</g, "><").trim(), name),
    l: article.name.fr.toLocaleLowerCase("fr"),
    k: [...keywords].sort((a, b) => a.localeCompare(b, "fr")),
    c: article.category,
  };
}

export default pack;
