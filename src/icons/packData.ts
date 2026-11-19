import { catalogData } from "@/data/catalog";
import { fr } from "@/i18n/fr";
import { DISH_CATEGORY, DISH_PREFIX, type IconPack } from "./pack";
import { compareText, searchKey } from "@/domain/slug";

/**
 * Pack d'icônes d'articles (docs/05 § 4), assemblé par Vite au build à partir des
 * dessins `src/icons/drawn/<clé d'article>.svg` : aucun fichier généré à versionner.
 * Les dessins arrivent prêts à afficher (`?icon`, `scripts/iconSvg.ts`) ; libellé et
 * mots-clés français viennent de l'article de même clé (nom, alias, types).
 * Importé à la demande par `pack.ts` : il forme un fichier à part.
 */
const drawings = import.meta.glob<string>("./drawn/*.svg", {
  query: "?icon",
  import: "default",
  eager: true,
});

/** Icônes de plats, pour les recettes : elles ne correspondent à aucun article. */
const dishDrawings = import.meta.glob<string>("./dishes/*.svg", {
  query: "?icon",
  import: "default",
  eager: true,
});

const words = (text: string) =>
  text
    .toLowerCase()
    .split(/[\s,:’'()-]+/)
    .filter((word) => word.length > 1);

interface Entry {
  name: string;
  body: string;
  label: string;
  texts: string[];
  category: string;
}

const articleByKey = new Map(
  catalogData.map((article) => [article.key, article]),
);

const entries: Entry[] = [];

for (const [path, body] of Object.entries(drawings)) {
  const name = path.slice("./drawn/".length, -".svg".length);
  const article = articleByKey.get(name);
  if (!article) throw new Error(`${path} : aucun article n'a cette clé`);
  entries.push({
    name,
    body,
    label: article.name.fr,
    texts: [
      article.name.fr,
      ...(article.aliases?.fr ?? []),
      ...(article.types?.fr ?? []),
    ],
    category: article.category,
  });
}

for (const [path, body] of Object.entries(dishDrawings)) {
  const name = path.slice("./dishes/".length, -".svg".length);
  const dish = fr.recipes.dishes[name];
  if (!dish) throw new Error(`${path} : aucun libellé dans fr.recipes.dishes`);
  entries.push({
    name: `${DISH_PREFIX}${name}`,
    body,
    label: dish.label,
    texts: [dish.label, ...dish.keywords],
    category: DISH_CATEGORY,
  });
}

// Sans prototype : un nom reçu par un lien (« constructor », « toString »…) n'y trouve
// rien, `pack[name]` ne renvoie que les icônes dessinées. Rangé par libellé : le choix
// d'icône n'a pas à le trier.
const pack = Object.create(null) as IconPack;
for (const entry of entries.sort((a, b) => compareText(a.label, b.label))) {
  const label = entry.label.toLocaleLowerCase("fr");
  pack[entry.name] = {
    b: entry.body,
    l: label,
    s: searchKey(label),
    k: [...new Set(entry.texts.flatMap(words).map(searchKey))],
    c: entry.category,
  };
}

export default pack;
