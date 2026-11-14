import { categoriesData } from "@/data";
import { catalogData } from "@/data/catalog";
import { fr } from "@/i18n/fr";
import { ProductIcon } from "@/ui/ProductIcon";
import { paletteColor } from "@/ui/palette";

const t = fr.devUi.review;

/** Version du catalogue dont les articles sont à relire. */
const SINCE = 5;

/**
 * Relecture d'un lot du catalogue (phase 8, temporaire) : chaque nouvel article avec son
 * icône en grand et à la taille d'une ligne, sa catégorie, son unité et la nature de son
 * dessin (nouveau, recoloré, repris).
 */
export function CatalogReview() {
  const batch = catalogData.filter((a) => a.since === SINCE);
  return (
    <div className="px-4">
      <p className="pb-3 text-sm text-muted-foreground">{t.intro}</p>
      <p className="pb-2 font-bold">
        {t.batch} · {batch.length}
      </p>
      <ul className="flex flex-col gap-2">
        {batch.map((article) => {
          const category = categoriesData.find(
            (c) => c.key === article.category,
          );
          const color = paletteColor(category?.color);
          return (
            <li
              key={article.key}
              className="flex items-center gap-3 rounded-2xl bg-surface p-2"
            >
              <ProductIcon
                icon={article.icon}
                label={article.name.fr}
                color={color}
                size={56}
              />
              <ProductIcon
                icon={article.icon}
                label={article.name.fr}
                color={color}
                size={28}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{article.name.fr}</span>
                <span className="block text-sm text-muted-foreground">
                  {category?.name.fr} · {article.unit}
                  {article.types ? ` · ${article.types.fr.join(", ")}` : ""}
                </span>
                <span className="block text-sm text-secondary">
                  {t.notes[article.key]}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
