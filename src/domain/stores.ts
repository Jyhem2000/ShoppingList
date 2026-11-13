import type {
  Aisle,
  AisleCategory,
  ArticleAisleOverride,
  Category,
  ID,
} from "./model";

/**
 * Édition des magasins et des rayons (docs/02 § 4, docs/03 G3). Fonctions pures : elles
 * renvoient les rayons modifiés, la base n'enregistre que ceux qui changent.
 * Invariant : dans un magasin, une catégorie a au plus UN rayon où elle est principale.
 */

type AisleLike = Pick<Aisle, "id" | "categories" | "isUnsorted" | "position">;

/** Ordre manuel : positions réparties uniformément sur [0, 1] (docs/07 § 7.6). */
export function spreadPositions(ids: readonly ID[]): Record<ID, number> {
  return Object.fromEntries(
    ids.map((id, index) => [id, ids.length > 1 ? index / (ids.length - 1) : 0]),
  );
}

/** Rayons triés comme dans la liste : par position, « Non classé » en dernier. */
export function sortAisles<A extends AisleLike>(aisles: readonly A[]): A[] {
  return [...aisles].sort(
    (a, b) =>
      Number(a.isUnsorted) - Number(b.isUnsorted) || a.position - b.position,
  );
}

/**
 * Ce qui décrit un rayon sans nom : ses catégories principales, dans l'ordre où elles
 * y ont été rangées (vide s'il n'en a pas).
 */
export function aisleContents(
  aisle: Pick<Aisle, "categories">,
  categoryName: (id: ID) => string | undefined,
): string[] {
  return aisle.categories.flatMap((c) => {
    const name = c.primary ? categoryName(c.categoryId) : undefined;
    return name ? [name] : [];
  });
}

/** Ce que le titre d'un rayon sait d'une catégorie. */
export interface CategoryLabel {
  /** Nom court : « Pain », « Café & thé ». */
  short: string;
  /** Nom de sa famille (« Épicerie sucrée »), s'il y en a une. */
  family?: string;
}

/**
 * Titre d'un rayon sans nom, d'après ses catégories principales (docs/02 § 4), sans
 * jamais de titre à rallonge :
 * 1. une seule catégorie : son nom court (« Fromages ») ;
 * 2. toutes de la même famille : le nom de la famille (« Épicerie sucrée ») ;
 * 3. sinon les deux plus achetées (`weight`, à égalité l'ordre du rayon) et le nombre
 *    des autres (« Pain · Café & thé +2 »).
 * `undefined` : aucune catégorie principale.
 */
export function aisleTitle(
  aisle: Pick<Aisle, "categories">,
  label: (categoryId: ID) => CategoryLabel | undefined,
  weight: (categoryId: ID) => number = () => 0,
): string | undefined {
  const primaries = aisle.categories.flatMap((c, index) => {
    const found = c.primary ? label(c.categoryId) : undefined;
    return found ? [{ ...found, id: c.categoryId, index }] : [];
  });
  const [first] = primaries;
  if (!first) return undefined;
  if (primaries.length === 1) return first.short;
  if (first.family && primaries.every((c) => c.family === first.family))
    return first.family;
  const top = [...primaries]
    .sort((a, b) => weight(b.id) - weight(a.id) || a.index - b.index)
    .slice(0, 2)
    .map((c) => c.short)
    .join(" · ");
  return primaries.length > 2 ? `${top} +${primaries.length - 2}` : top;
}

/**
 * Rangement d'un article coché dans « À placer » (docs/03 C4) : toute sa catégorie va
 * dans le rayon en cours, sauf une catégorie système (« Autres ») ou déjà rangée dans
 * un autre rayon de ce magasin : alors l'article seul (exception par article).
 */
export function placementScope(
  category: Pick<Category, "id" | "isSystem"> | undefined,
  aisles: readonly Pick<Aisle, "categories" | "isUnsorted">[],
): "category" | "article" {
  if (!category || category.isSystem) return "article";
  const placed = aisles.some(
    (aisle) =>
      !aisle.isUnsorted &&
      aisle.categories.some((c) => c.categoryId === category.id && c.primary),
  );
  return placed ? "article" : "category";
}

/**
 * Positions des rayons après l'ouverture de `newId` juste après `afterId` (en tête si
 * absent), réparties sur [0, 1] ; « Non classé » ne bouge pas.
 */
export function insertAisleAfter(
  aisles: readonly AisleLike[],
  afterId: ID | undefined,
  newId: ID,
): Record<ID, number> {
  const ids = sortAisles(aisles)
    .filter((a) => !a.isUnsorted && a.id !== newId)
    .map((a) => a.id);
  const index = afterId === undefined ? -1 : ids.indexOf(afterId);
  ids.splice(index + 1, 0, newId);
  return spreadPositions(ids);
}

export type CategoryRole = "primary" | "secondary" | "none";

/** Rôle d'une catégorie dans un rayon. */
export function categoryRole(
  aisle: Pick<Aisle, "categories">,
  categoryId: ID,
): CategoryRole {
  const entry = aisle.categories.find((c) => c.categoryId === categoryId);
  if (!entry) return "none";
  return entry.primary ? "primary" : "secondary";
}

/**
 * Donne à une catégorie un rôle dans un rayon. Devenir principale dans ce rayon fait
 * de l'ancien rayon principal un rayon secondaire (docs/02 § 4 « Déplacer un article »).
 * Renvoie seulement les rayons qui changent.
 */
export function setCategoryRole<A extends AisleLike>(
  aisles: readonly A[],
  aisleId: ID,
  categoryId: ID,
  role: CategoryRole,
): A[] {
  const changed: A[] = [];
  for (const aisle of aisles) {
    const others = aisle.categories.filter((c) => c.categoryId !== categoryId);
    const current = aisle.categories.find((c) => c.categoryId === categoryId);
    let next: AisleCategory[] = aisle.categories;
    if (aisle.id === aisleId) {
      next =
        role === "none"
          ? others
          : [...others, { categoryId, primary: role === "primary" }];
    } else if (role === "primary" && current?.primary) {
      next = aisle.categories.map((c) =>
        c.categoryId === categoryId ? { categoryId, primary: false } : c,
      );
    }
    const same =
      next.length === aisle.categories.length &&
      next.every((c) => {
        const before = aisle.categories.find(
          (x) => x.categoryId === c.categoryId,
        );
        return before?.primary === c.primary;
      });
    if (!same) changed.push({ ...aisle, categories: next });
  }
  return changed;
}

/**
 * Catégories rattachées à aucun rayon du magasin : leurs articles vont dans
 * « Non classé » (docs/02 § 4). Les catégories système y sont rangées exprès.
 */
export function unattachedCategories<C extends { id: ID; isSystem: boolean }>(
  aisles: readonly Pick<Aisle, "categories">[],
  categories: readonly C[],
): C[] {
  const attached = new Set(
    aisles.flatMap((a) => a.categories.map((c) => c.categoryId)),
  );
  return categories.filter((c) => !c.isSystem && !attached.has(c.id));
}

/**
 * Supprimer un rayon : les catégories dont il était le rayon principal vont dans
 * « Non classé », ou deviennent principales dans un de leurs rayons secondaires si
 * `promoteSecondary` (docs/02 § 4). Renvoie les autres rayons qui changent.
 */
export function removeAisle<A extends AisleLike>(
  aisles: readonly A[],
  aisleId: ID,
  promoteSecondary: boolean,
): A[] {
  const removed = aisles.find((a) => a.id === aisleId);
  if (!removed || removed.isUnsorted) return [];
  if (!promoteSecondary) return [];
  const rest = sortAisles(aisles.filter((a) => a.id !== aisleId));
  const changed = new Map<ID, A>();
  for (const { categoryId, primary } of removed.categories) {
    if (!primary) continue;
    const target = rest.find(
      (a) =>
        !a.isUnsorted &&
        categoryRole(changed.get(a.id) ?? a, categoryId) === "secondary",
    );
    if (!target) continue;
    const base = changed.get(target.id) ?? target;
    changed.set(target.id, {
      ...base,
      categories: base.categories.map((c) =>
        c.categoryId === categoryId ? { categoryId, primary: true } : c,
      ),
    });
  }
  return [...changed.values()];
}

/**
 * Fusionner un rayon dans un autre : le rayon gardé reçoit toutes les catégories ;
 * une catégorie principale dans l'un des deux le reste. Les exceptions par article
 * qui visaient le rayon fusionné visent le rayon gardé.
 */
export function mergeAisles<A extends AisleLike>(
  target: A,
  source: Pick<Aisle, "id" | "categories">,
  overrides: readonly ArticleAisleOverride[],
): { aisle: A; overrides: ArticleAisleOverride[] } {
  const byCategory = new Map<ID, boolean>();
  for (const c of [...target.categories, ...source.categories])
    byCategory.set(
      c.categoryId,
      (byCategory.get(c.categoryId) ?? false) || c.primary,
    );
  return {
    aisle: {
      ...target,
      categories: [...byCategory.entries()].map(([categoryId, primary]) => ({
        categoryId,
        primary,
      })),
    },
    overrides: overrides
      .filter((o) => o.aisleId === source.id)
      .map((o) => ({ ...o, aisleId: target.id })),
  };
}

/**
 * Une catégorie disparaît dans une autre (fusion ou suppression, docs/02 § 3) : dans un
 * magasin, ses rayons deviennent ceux de la catégorie gardée ; si celle-ci n'avait pas
 * de rayon principal, elle prend celui de la catégorie fusionnée. Renvoie les rayons
 * modifiés d'un même magasin.
 */
export function moveCategoryInAisles<A extends AisleLike>(
  aisles: readonly A[],
  sourceId: ID,
  targetId: ID | undefined,
): A[] {
  const targetHasPrimary =
    targetId !== undefined &&
    aisles.some((a) => categoryRole(a, targetId) === "primary");
  const changed: A[] = [];
  for (const aisle of aisles) {
    const source = aisle.categories.find((c) => c.categoryId === sourceId);
    if (!source) continue;
    let categories = aisle.categories.filter((c) => c.categoryId !== sourceId);
    if (targetId !== undefined) {
      const primary = source.primary && !targetHasPrimary;
      const role = categoryRole(aisle, targetId);
      if (role === "none")
        categories = [...categories, { categoryId: targetId, primary }];
      else if (primary && role === "secondary")
        categories = categories.map((c) =>
          c.categoryId === targetId
            ? { categoryId: targetId, primary: true }
            : c,
        );
    }
    changed.push({ ...aisle, categories });
  }
  return changed;
}
