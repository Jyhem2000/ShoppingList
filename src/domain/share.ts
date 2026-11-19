import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import {
  entryAmount,
  LINE_BULLET,
  exactEntry,
  parseEntry,
  resolveEntry,
  type ParsedEntry,
} from "./entry";
import { isOneOff, OTHERS_CATEGORY, oneOffCategory } from "./categories";
import { guessFromKeywords, type KeywordGuess } from "./keywords";
import type {
  Article,
  Category,
  Dimension,
  ID,
  ListItem,
  Recipe,
  Unit,
  UnitGroup,
} from "./model";
import { type Amount, PIECE_UNIT } from "./quantity";
import {
  capitalize,
  mergeTypes,
  searchKey,
  slugify,
  compareText,
} from "./slug";

/**
 * Partage d'une liste ou d'une recette (docs/02 § 9, docs/03 E3, F1-F2 et A8, docs/07
 * § 7.9), sans serveur : elle voyage dans un lien, compressée ; le destinataire la
 * relit et retrouve chaque article chez lui (clé catalogue, libellés et alias,
 * catalogue comme dictionnaire, recherche), sinon on l'aide à choisir ou à créer.
 * Les deux partages ont le même format : des lignes (celles de la liste, ou les
 * ingrédients), et ce qui est propre à une recette (rendement, icône, étapes).
 */

// --- Format du lien --------------------------------------------------------------

/** Ce qu'un lien partage. */
export type ShareType = "list" | "recipe";

/**
 * Partage, version 1. Noms de champs courts : ils se répètent à chaque ligne et
 * allongent le lien. Une catégorie ou une unité se désigne par sa clé catalogue, ou
 * par son slug si elle a été créée à la main (elle est alors décrite dans `c` ou `u`).
 */
interface SharedBase {
  /** Version du format. */
  v: 1;
  type: ShareType;
  /** Langue de l'expéditeur. */
  l: string;
  /** Nom de la liste ou de la recette. */
  n: string;
  /** Lignes de la liste, ou ingrédients de la recette. */
  i: SharedItem[];
  /** Catégories créées à la main, citées par les articles. */
  c?: SharedCategory[];
  /** Unités créées à la main, citées par les lignes et les articles. */
  u?: SharedUnit[];
}

export interface SharedList extends SharedBase {
  type: "list";
}

export interface SharedRecipe extends SharedBase {
  type: "recipe";
  /** Rendement : « 4 personnes », « 1 cake ». */
  y: { q: number; u: string };
  /** Icône de la recette. */
  ic?: string;
  /** Étapes (Markdown, docs/03 E1). */
  s?: string;
}

export type Shared = SharedList | SharedRecipe;

export interface SharedItem {
  /** Clé catalogue de l'article : le destinataire a le même catalogue, elle suffit. */
  k?: string;
  /** Libellé chez l'expéditeur ; omis quand c'est le slug de la clé (`tomates`). */
  n?: string;
  /** Article créé à la main : sa description. */
  a?: SharedArticle;
  /** Quantité. */
  q: number;
  /** Unité de la ligne. */
  u: string;
  /** Types acceptés. */
  t?: string[];
  /** Note (ligne de liste). */
  o?: string;
  /** Ingrédient facultatif. */
  op?: 1;
  /** Ingrédient à quantité fixe. */
  fx?: 1;
}

export interface SharedArticle {
  /** Catégorie. */
  c: string;
  /** Unité par défaut. */
  u: string;
  /** Icône. */
  i?: string;
  /** Alias (slugifiés). */
  al?: string[];
  /** Types. */
  ty?: string[];
}

export interface SharedCategory {
  /** Référence : son slug. */
  r: string;
  n: string;
  /** Couleur (palette). */
  co: string;
  i?: string;
}

export interface SharedUnit {
  /** Référence : son slug. */
  r: string;
  /** Singulier, pluriel, abréviation. */
  s: string;
  p: string;
  ab?: string;
  d: Dimension;
  g?: UnitGroup;
  f?: number;
  st: number;
}

export const SHARE_VERSION = 1;

/** Ce qu'on partage d'une liste : les lignes qui restent à acheter. */
export function sharedItems<I extends Pick<ListItem, "status">>(
  items: readonly I[],
): I[] {
  return items.filter((item) => item.status !== "checked");
}

/** Articles, catégories et unités de l'expéditeur, par identifiant. */
export interface ShareSource {
  articleById: ReadonlyMap<ID, Article>;
  categoryById: ReadonlyMap<ID, Category>;
  unitById: ReadonlyMap<ID, Unit>;
}

/** Ligne de liste ou ingrédient, tel qu'il part. */
type LineSource = Pick<
  ListItem,
  "articleId" | "quantity" | "unitId" | "acceptedTypes"
> & { note?: string; optional?: boolean; fixed?: boolean };

/** La liste à envoyer (lignes déjà filtrées par `sharedItems`). */
export function buildSharedList(
  name: string,
  items: readonly LineSource[],
  source: ShareSource,
  language = "fr",
): SharedList {
  return {
    v: SHARE_VERSION,
    type: "list",
    l: language,
    n: name,
    ...sharedLines(items, source),
  };
}

/** La recette à envoyer : ses ingrédients, son rendement, son icône et ses étapes. */
export function buildSharedRecipe(
  recipe: Pick<Recipe, "name" | "icon" | "yield" | "ingredients" | "steps">,
  source: ShareSource,
  language = "fr",
): SharedRecipe {
  const steps = recipe.steps?.trim();
  return {
    v: SHARE_VERSION,
    type: "recipe",
    l: language,
    n: recipe.name,
    y: { q: recipe.yield.quantity, u: recipe.yield.unit },
    ...(recipe.icon && { ic: recipe.icon }),
    ...(steps && { s: steps }),
    ...sharedLines(recipe.ingredients, source),
  };
}

/** Les lignes, et les catégories et unités créées à la main qu'elles citent. */
function sharedLines(
  items: readonly LineSource[],
  { articleById, categoryById, unitById }: ShareSource,
): Pick<SharedBase, "i" | "c" | "u"> {
  const categories = new Map<string, SharedCategory>();
  const units = new Map<string, SharedUnit>();
  const unitRef = (id: ID): string | undefined => {
    const unit = unitById.get(id);
    if (!unit) return undefined;
    if (unit.catalogKey) return unit.catalogKey;
    units.set(unit.slug, {
      r: unit.slug,
      s: unit.singular,
      p: unit.plural,
      ...(unit.abbr && { ab: unit.abbr }),
      d: unit.dimension,
      ...(unit.group && { g: unit.group }),
      ...(unit.factor !== undefined && { f: unit.factor }),
      st: unit.step,
    });
    return unit.slug;
  };
  const categoryRef = (id: ID): string | undefined => {
    const category = categoryById.get(id);
    if (!category) return undefined;
    if (category.catalogKey) return category.catalogKey;
    categories.set(category.slug, {
      r: category.slug,
      n: category.name,
      co: category.color,
      ...(category.icon && { i: category.icon }),
    });
    return category.slug;
  };

  const lines: SharedItem[] = [];
  for (const item of items) {
    const article = articleById.get(item.articleId);
    if (!article) continue;
    const unit = unitRef(item.unitId);
    if (!unit) continue;
    const line: SharedItem = { q: item.quantity, u: unit };
    if (article.catalogKey) {
      line.k = article.catalogKey;
      if (slugify(article.name) !== article.catalogKey) line.n = article.name;
    } else {
      line.n = article.name;
      line.a = {
        c: categoryRef(article.categoryId) ?? OTHERS_CATEGORY,
        u: unitRef(article.defaultUnitId) ?? unit,
        ...(article.icon && { i: article.icon }),
        ...(article.aliases.length && { al: article.aliases }),
        ...(article.types.length && { ty: article.types }),
      };
    }
    if (item.acceptedTypes.length) line.t = item.acceptedTypes;
    const note = item.note?.trim();
    if (note) line.o = note;
    if (item.optional) line.op = 1;
    if (item.fixed) line.fx = 1;
    lines.push(line);
  }
  return {
    i: lines,
    ...(categories.size && { c: [...categories.values()] }),
    ...(units.size && { u: [...units.values()] }),
  };
}

const IMPORT_PATH = "#/import?d=";
/** Alphabet de `compressToEncodedURIComponent`, et `%` d'un caractère réencodé en route. */
const LINK = /#\/import\?d=([A-Za-z0-9+\-$%]+)/;

/** Lien d'import : `base` est l'adresse de l'app, sans `#`. */
export function shareLink(base: string, shared: Shared): string {
  return (
    base + IMPORT_PATH + compressToEncodedURIComponent(JSON.stringify(shared))
  );
}

/**
 * Liste ou recette contenue dans un texte (le message reçu, ou l'adresse de la page) :
 * le premier lien d'import qu'il contient. `undefined` : pas de lien, ou lien abîmé.
 */
export function findShared(text: string): Shared | undefined {
  const encoded = LINK.exec(text)?.[1];
  if (!encoded) return undefined;
  try {
    const json = decompressFromEncodedURIComponent(decodeURIComponent(encoded));
    return json ? validShared(JSON.parse(json)) : undefined;
  } catch {
    return undefined;
  }
}

const isString = (value: unknown): value is string => typeof value === "string";
const isStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);
const optional = (value: unknown, check: (v: unknown) => boolean) =>
  value === undefined || check(value);
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
/** Un nom lisible : au moins une lettre ou un chiffre. */
const isLabel = (value: unknown): value is string =>
  isString(value) && /[\p{L}\p{N}]/u.test(value);

const isFlag = (value: unknown) => value === 1;
const isObject = (value: unknown): value is object =>
  typeof value === "object" && value !== null;

/** Relit une liste ou une recette reçue : un lien abîmé ou trafiqué ne doit rien casser. */
function validShared(value: unknown): Shared | undefined {
  if (!isObject(value)) return undefined;
  const list = value as Partial<Omit<SharedRecipe, "type">> & {
    type?: unknown;
  };
  const type: ShareType | undefined =
    list.type === "list" || list.type === "recipe" ? list.type : undefined;
  if (
    list.v !== SHARE_VERSION ||
    !type ||
    !isString(list.n) ||
    !Array.isArray(list.i)
  )
    return undefined;
  const yields = list.y;
  if (
    type === "recipe" &&
    (!isObject(yields) ||
      !isNumber(yields.q) ||
      yields.q <= 0 ||
      !isLabel(yields.u))
  )
    return undefined;
  const items = list.i.filter((item: Partial<SharedItem> | null) => {
    if (!isObject(item)) return false;
    const a = item.a as Partial<SharedArticle> | undefined;
    return (
      isNumber(item.q) &&
      item.q > 0 &&
      isString(item.u) &&
      optional(item.k, isString) &&
      optional(item.n, isLabel) &&
      (item.k !== undefined || item.n !== undefined) &&
      optional(item.t, isStrings) &&
      optional(item.o, isString) &&
      optional(item.op, isFlag) &&
      optional(item.fx, isFlag) &&
      (a === undefined ||
        (isObject(a) &&
          isString(a.c) &&
          isString(a.u) &&
          optional(a.i, isString) &&
          optional(a.al, isStrings) &&
          optional(a.ty, isStrings)))
    );
  });
  const categories = (Array.isArray(list.c) ? list.c : []).filter(
    (c: Partial<SharedCategory> | null) =>
      isObject(c) && isString(c.r) && isLabel(c.n) && isString(c.co),
  );
  const units = (Array.isArray(list.u) ? list.u : []).filter(
    (u: Partial<SharedUnit> | null) =>
      isObject(u) &&
      isString(u.r) &&
      isLabel(u.s) &&
      isLabel(u.p) &&
      (u.d === "mass" || u.d === "volume" || u.d === "other") &&
      isNumber(u.st) &&
      u.st > 0 &&
      optional(u.f, isNumber),
  );
  const common = {
    v: SHARE_VERSION,
    l: isString(list.l) ? list.l : "fr",
    n: list.n.trim(),
    i: items,
    c: categories,
    u: units,
  } as const;
  if (type === "list") return { ...common, type };
  return {
    ...common,
    type: "recipe",
    y: { q: yields?.q ?? 1, u: yields?.u.trim() ?? "" },
    ...(isString(list.ic) && { ic: list.ic }),
    ...(isString(list.s) && list.s.trim() && { s: list.s }),
  };
}

/** La recette reçue, hors ingrédients (ils passent par l'aperçu). */
export function receivedRecipe(
  shared: SharedRecipe,
): Pick<Recipe, "name" | "icon" | "yield" | "steps"> {
  return {
    name: shared.n,
    icon: shared.ic,
    yield: { quantity: shared.y.q, unit: shared.y.u },
    steps: shared.s,
  };
}

// --- Ce que le destinataire sait déjà -------------------------------------------

/** Catégorie décrite assez pour être retrouvée chez le destinataire, ou créée. */
export interface CategoryDesc {
  catalogKey?: string;
  slug: string;
  name: string;
  color: string;
  icon?: string;
  /** Unité suggérée pour un nouvel article de la catégorie (clé catalogue). */
  unitKey?: string;
}

export type UnitDesc = Pick<
  Unit,
  | "slug"
  | "singular"
  | "plural"
  | "abbr"
  | "dimension"
  | "group"
  | "factor"
  | "step"
  | "aliases"
> & { catalogKey?: string };

/** Article reçu ou tapé, tel qu'on le créerait chez le destinataire. */
export interface ReceivedArticle {
  /** Libellé proposé à la création : celui du catalogue dans la langue du destinataire. */
  name: string;
  /** Libellé reçu ou tapé : devient un alias de l'article choisi à sa place. */
  label: string;
  catalogKey?: string;
  icon?: string;
  /** Slugifiés. */
  aliases: string[];
  types: string[];
  category: CategoryDesc;
  /** Unité par défaut. */
  unit: UnitDesc;
  defaultQuantity?: number;
  countable?: boolean;
  generic?: boolean;
}

/**
 * Le catalogue de départ embarqué (docs/02 § 10), vu par l'import : chaque article
 * décrit dans la langue de l'utilisateur, et le dictionnaire de tous ses libellés et
 * alias, toutes langues confondues.
 */
export interface ImportCatalog {
  articles: ReadonlyMap<string, ReceivedArticle>;
  /** Clé de recherche d'un libellé ou d'un alias → clé catalogue. */
  dictionary: ReadonlyMap<string, string>;
  categories: ReadonlyMap<string, CategoryDesc>;
  units: ReadonlyMap<string, UnitDesc>;
}

/** Données du catalogue, rangées par langue (`src/data`). */
type ByLanguage<T> = Readonly<Record<"fr", T>>;

export interface CatalogSource {
  articles: readonly {
    key: string;
    name: ByLanguage<string>;
    aliases?: ByLanguage<string[]>;
    types?: ByLanguage<string[]>;
    category: string;
    unit: string;
    quantity?: number;
    countable?: boolean;
    generic?: boolean;
    icon?: string;
  }[];
  categories: readonly {
    key: string;
    name: ByLanguage<string>;
    unit: string;
    color: string;
    icon?: string;
  }[];
  units: readonly {
    key: string;
    name: ByLanguage<{ singular: string; plural: string; abbr?: string }>;
    dimension: Dimension;
    group: UnitGroup;
    factor?: number;
    step: number;
    aliases?: ByLanguage<string[]>;
  }[];
}

export function buildImportCatalog(source: CatalogSource): ImportCatalog {
  const units = new Map<string, UnitDesc>(
    source.units.map((unit) => [
      unit.key,
      {
        catalogKey: unit.key,
        slug: unit.key,
        singular: unit.name.fr.singular,
        plural: unit.name.fr.plural,
        abbr: unit.name.fr.abbr,
        dimension: unit.dimension,
        group: unit.group,
        factor: unit.factor,
        step: unit.step,
        aliases: unit.aliases?.fr ?? [],
      },
    ]),
  );
  const categories = new Map<string, CategoryDesc>(
    source.categories.map((category) => [
      category.key,
      {
        catalogKey: category.key,
        slug: slugify(category.name.fr),
        name: category.name.fr,
        color: category.color,
        icon: category.icon,
        unitKey: category.unit,
      },
    ]),
  );
  const articles = new Map<string, ReceivedArticle>();
  const dictionary = new Map<string, string>();
  for (const data of source.articles) {
    const category = categories.get(data.category);
    const unit = units.get(data.unit);
    if (!category || !unit) continue;
    const slug = slugify(data.name.fr);
    articles.set(data.key, {
      name: data.name.fr,
      label: data.name.fr,
      catalogKey: data.key,
      icon: data.icon,
      aliases: [...new Set((data.aliases?.fr ?? []).map(slugify))].filter(
        (alias) => alias !== slug,
      ),
      types: data.types?.fr ?? [],
      category,
      unit,
      defaultQuantity: data.quantity,
      countable: data.countable,
      generic: data.generic,
    });
    // Toutes les langues : un « Peanut butter » créé à la main se retrouve.
    const labels = [
      ...Object.values(data.name),
      ...Object.values(data.aliases ?? {}).flat(),
    ];
    for (const label of labels) {
      const key = searchKey(label);
      if (key && !dictionary.has(key)) dictionary.set(key, data.key);
    }
  }
  return { articles, dictionary, categories, units };
}

type Matchable = Pick<Category | Unit, "slug" | "catalogKey">;

/** Catégorie ou unité du destinataire qui correspond : même clé catalogue, sinon même slug. */
function findMatching<T extends Matchable>(
  desc: Matchable,
  items: readonly T[],
): T | undefined {
  const keyed =
    desc.catalogKey === undefined
      ? undefined
      : items.find((item) => item.catalogKey === desc.catalogKey);
  return keyed ?? items.find((item) => item.slug === desc.slug);
}

export const findCategory: <C extends Matchable>(
  desc: CategoryDesc,
  categories: readonly C[],
) => C | undefined = findMatching;

export const findUnit: <U extends Matchable>(
  desc: UnitDesc,
  units: readonly U[],
) => U | undefined = findMatching;

// --- Lignes à importer ----------------------------------------------------------

export type ImportMatch =
  /** Reconnu à coup sûr (clé, libellé ou alias, dictionnaire du catalogue). */
  | { kind: "known"; articleId: ID }
  /** Ressemblant (recherche) : à confirmer. */
  | { kind: "probable"; articleId: ID }
  /** Non reconnu : candidats proposés (« Peut-être chez toi »). */
  | { kind: "unknown"; candidates: ID[] };

export interface ImportLine {
  received: ReceivedArticle;
  /**
   * Lien : quantité et unité reçues. Texte collé : la saisie, lue selon l'article
   * finalement choisi (« 2 beurres » → 500 g, docs/03 A2).
   */
  amount: { quantity: number; unit: UnitDesc } | { entry: ParsedEntry };
  acceptedTypes: string[];
  note?: string;
  /** Ingrédient d'une recette reçue (absent pour une ligne de liste). */
  ingredient?: { optional: boolean; fixed: boolean };
  match: ImportMatch;
  /**
   * L'article ou l'unité vient d'un catalogue plus récent que celui du destinataire :
   * catégorie et unité devinées, mieux vaut mettre l'app à jour.
   */
  outdated?: boolean;
}

export interface ImportContext {
  articles: readonly Article[];
  categories: readonly Category[];
  units: readonly Unit[];
  purchaseCounts: ReadonlyMap<ID, number>;
  catalog: ImportCatalog;
  /** Dictionnaire de mots-clés : catégorie, unité et icône d'un article tapé inconnu. */
  keywordRules: readonly KeywordGuess[];
}

/** « pommes-de-terre » → « Pommes de terre » : un article du catalogue qu'on ne connaît pas. */
function labelFromKey(key: string): string {
  return capitalize(key.replace(/-/g, " "));
}

/**
 * Lignes d'une liste reçue, ou ingrédients d'une recette, chacun avec sa
 * correspondance chez le destinataire (docs/02 § 9 : clé catalogue, slug et alias
 * croisés, dictionnaire du catalogue, recherche floue, sinon candidats).
 */
export function resolveImport(
  shared: Shared,
  context: ImportContext,
): ImportLine[] {
  const { catalog } = context;
  const fallbackCategory = catalogCategory(catalog, OTHERS_CATEGORY);
  const fallbackUnit = catalogUnit(catalog, PIECE_UNIT);
  const categoryDesc = (ref: string): CategoryDesc => {
    const own = shared.c?.find((c) => c.r === ref);
    return own
      ? { slug: own.r, name: own.n, color: own.co, icon: own.i }
      : (catalog.categories.get(ref) ?? fallbackCategory);
  };
  const knownUnit = (ref: string) =>
    shared.u?.some((u) => u.r === ref) === true || catalog.units.has(ref);
  const unitDesc = (ref: string): UnitDesc => {
    const own = shared.u?.find((u) => u.r === ref);
    return own
      ? {
          slug: own.r,
          singular: own.s,
          plural: own.p,
          abbr: own.ab,
          dimension: own.d,
          group: own.g,
          factor: own.f,
          step: own.st,
          aliases: [],
        }
      : (catalog.units.get(ref) ?? fallbackUnit);
  };

  return shared.i.map((item) => {
    const fromCatalog =
      item.k === undefined ? undefined : catalog.articles.get(item.k);
    const label =
      item.n?.trim() ?? fromCatalog?.name ?? labelFromKey(item.k ?? "");
    const received: ReceivedArticle = fromCatalog
      ? { ...fromCatalog, label }
      : {
          name: label,
          label,
          catalogKey: item.k,
          icon: item.a?.i,
          aliases: (item.a?.al ?? []).map(slugify),
          types: item.a?.ty ?? [],
          category: item.a ? categoryDesc(item.a.c) : fallbackCategory,
          unit: unitDesc(item.a?.u ?? item.u),
        };
    const { match, received: better, types } = matchReceived(received, context);
    return {
      received: better,
      amount: { quantity: item.q, unit: unitDesc(item.u) },
      acceptedTypes: mergeTypes(item.t ?? [], types),
      note: item.o,
      ...(shared.type === "recipe" && {
        ingredient: { optional: item.op === 1, fixed: item.fx === 1 },
      }),
      match,
      ...(((item.k !== undefined && !fromCatalog && !item.a) ||
        !knownUnit(item.u)) && { outdated: true }),
    };
  });
}

/**
 * Lignes d'un texte collé (docs/03 A8) : chaque ligne est lue comme la saisie
 * naturelle (A2). Si certaines lignes commencent par une puce (« • », « - »), seules
 * celles-là comptent : ce sont les articles d'un message, ses autres lignes sont des
 * titres ou des phrases (le message de partage de l'app se relit ainsi).
 */
export function textImportLines(
  text: string,
  context: ImportContext,
): ImportLine[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(FORMATTING, "$1$3"))
    .filter((line) => isLabel(line));
  const bulleted = lines.filter((line) => LINE_BULLET.test(line));
  const kept = (bulleted.length ? bulleted : lines)
    .flatMap(collapsedBullets)
    .map((line) =>
      line
        .replace(LINE_BULLET, "")
        // Précisions entre parenthèses en fin de ligne (« (Gala uniquement) »).
        .replace(/\s*\([^()]*\)\s*$/, "")
        .trim(),
    )
    .filter(Boolean);
  const entries = parseEntry(kept.join("\n"), context.units, {
    bullets: false,
  });
  const { catalog } = context;
  const fallbackCategory = catalogCategory(catalog, OTHERS_CATEGORY);

  return entries.map((entry) => {
    const guess = guessFromKeywords(entry.text, context.keywordRules);
    const category =
      (guess && catalog.categories.get(guess.category)) ?? fallbackCategory;
    const unit = catalogUnit(
      catalog,
      guess?.unit ?? category.unitKey ?? PIECE_UNIT,
    );
    const received: ReceivedArticle = {
      name: capitalize(entry.text),
      label: entry.text,
      icon: guess?.icon,
      aliases: [],
      types: [],
      category,
      unit,
    };
    const { match, received: better, types } = matchReceived(received, context);
    return {
      received: better,
      amount: { entry },
      acceptedTypes: types,
      match,
    };
  });
}

/**
 * Mise en forme d'une messagerie autour d'un ou plusieurs mots (`*gras*`, `_italique_`,
 * `~barré~` de WhatsApp) : retirée avant de lire le texte collé. Une puce `* pain`
 * n'est pas touchée (l'étoile n'est pas collée au mot).
 */
/**
 * Liste à puces dont les retours à la ligne ont sauté : la puce de tête revient au
 * milieu de la ligne (« - beurre - lait » → « - beurre », « lait »). Une autre puce
 * reste dans l'article (« • Lait - 2 L »).
 */
function collapsedBullets(line: string): string[] {
  const bullet = /^\s*([•·▪◦‣∙*\-–—])\s/u.exec(line)?.[1];
  return bullet ? line.replace(/\s+/g, " ").split(` ${bullet} `) : [line];
}

const FORMATTING =
  /(^|[^\p{L}\p{N}])([*_~])(?=\S)(.+?)(?<=\S)\2(?![\p{L}\p{N}])/gu;

/**
 * Correspondance d'un article reçu chez le destinataire. `received` peut s'enrichir :
 * un libellé trouvé dans le dictionnaire du catalogue prend la description du
 * catalogue (icône, catégorie), utile s'il faut le créer.
 */
function matchReceived(
  received: ReceivedArticle,
  context: ImportContext,
): { match: ImportMatch; received: ReceivedArticle; types: string[] } {
  const { articles, catalog } = context;
  const known = (article: Article, types: string[] = []) => ({
    match: { kind: "known" as const, articleId: article.id },
    received,
    types,
  });

  // 1. Même clé catalogue.
  const byKey = (key: string | undefined) =>
    key === undefined
      ? undefined
      : articles.find((article) => article.catalogKey === key);
  const keyed = byKey(received.catalogKey);
  if (keyed) return known(keyed);

  // 2. Libellé ou alias, des deux côtés (le slug reçu, ou un de ses alias).
  const exact = resolveEntry(received.label, articles);
  if (exact.exact && exact.article)
    return known(exact.article, exact.acceptedTypes);
  for (const alias of received.aliases) {
    const found = existingArticle(alias, articles);
    if (found) return known(found);
  }

  // 3. Le catalogue comme dictionnaire, toutes langues confondues.
  let better = received;
  for (const label of [received.label, ...received.aliases]) {
    const key = catalog.dictionary.get(searchKey(label));
    if (key === undefined) continue;
    const article = byKey(key);
    if (article) return known(article);
    const data = catalog.articles.get(key);
    if (data && received.catalogKey === undefined) {
      better = { ...data, label: received.label };
      // Déjà là sous le nom du catalogue, sans sa clé (créé à la main).
      const same = existingArticle(data.name, articles);
      if (same) return { ...known(same), received: better };
      break;
    }
  }

  // 4. Un article ressemblant : à confirmer. Deux articles du catalogue de clés
  // différentes ne sont jamais le même (Tomates ≠ Tomates concassées).
  if (
    exact.article &&
    (exact.article.catalogKey === undefined || better.catalogKey === undefined)
  )
    return {
      match: { kind: "probable", articleId: exact.article.id },
      received: better,
      types: [],
    };

  // 5. Non reconnu : candidats.
  const category = findCategory(better.category, context.categories);
  return {
    match: {
      kind: "unknown",
      candidates: suggestCandidates(
        { icon: better.icon, categoryId: category?.id },
        articles,
        context.purchaseCounts,
      ),
    },
    received: better,
    types: [],
  };
}

/**
 * Article du destinataire qui porte déjà ce nom (libellé ou alias exact) : « Créer »
 * avec ce nom reprend cet article plutôt que d'en faire un double.
 */
export function existingArticle<A extends Article>(
  name: string,
  articles: readonly A[],
): A | undefined {
  const found = exactEntry(name, articles);
  return found?.acceptedTypes.length === 0 ? found.article : undefined;
}

function catalogCategory(catalog: ImportCatalog, key: string): CategoryDesc {
  return (
    catalog.categories.get(key) ?? {
      catalogKey: key,
      slug: key,
      name: capitalize(key),
      color: "gris",
    }
  );
}

function catalogUnit(catalog: ImportCatalog, key: string): UnitDesc {
  return (
    catalog.units.get(key) ??
    catalog.units.get(PIECE_UNIT) ?? {
      catalogKey: PIECE_UNIT,
      slug: PIECE_UNIT,
      singular: PIECE_UNIT,
      plural: PIECE_UNIT,
      dimension: "other",
      step: 1,
      aliases: [],
    }
  );
}

/**
 * « Peut-être chez toi » (docs/02 § 9) : les articles du destinataire qui ont la même
 * icône et la même catégorie, puis la même icône, puis la même catégorie ; à rang égal,
 * les plus achetés d'abord. Cinq au plus.
 */
export function suggestCandidates(
  received: { icon?: string; categoryId?: ID },
  articles: readonly Pick<Article, "id" | "name" | "icon" | "categoryId">[],
  purchaseCounts: ReadonlyMap<ID, number>,
  max = 5,
): ID[] {
  const rank = (article: (typeof articles)[number]) => {
    const sameIcon =
      received.icon !== undefined && article.icon === received.icon;
    const sameCategory =
      received.categoryId !== undefined &&
      article.categoryId === received.categoryId;
    if (sameIcon && sameCategory) return 0;
    if (sameIcon) return 1;
    if (sameCategory) return 2;
    return 3;
  };
  return articles
    .map((article) => ({ article, rank: rank(article) }))
    .filter(({ rank }) => rank < 3)
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        (purchaseCounts.get(b.article.id) ?? 0) -
          (purchaseCounts.get(a.article.id) ?? 0) ||
        compareText(a.article.name, b.article.name),
    )
    .slice(0, max)
    .map(({ article }) => article.id);
}

// --- Choix et quantités ---------------------------------------------------------

/** Ce que le destinataire décide pour une ligne. */
export type ImportChoice =
  | { kind: "use"; articleId: ID }
  /** `oneOff` : « Juste cette fois », rangé dans « Achats ponctuels » (docs/03 A4). */
  | { kind: "create"; name: string; oneOff: boolean }
  | { kind: "skip" };

/**
 * Par défaut : l'article reconnu ou proposé, sinon « Créer » avec le libellé du
 * catalogue.
 */
export function defaultChoice(line: ImportLine): ImportChoice {
  return line.match.kind === "unknown"
    ? { kind: "create", name: line.received.name, oneOff: defaultOneOff(line) }
    : { kind: "use", articleId: line.match.articleId };
}

/**
 * Créé « juste cette fois » par défaut (docs/02 § 9) : un article créé à la main ou
 * tapé, pour qu'une longue liste reçue n'encombre pas le catalogue. Un article décrit
 * par le catalogue (supprimé chez le destinataire, ou retrouvé par son dictionnaire)
 * reprend sa vraie catégorie. L'ingrédient d'une recette est gardé dans le catalogue :
 * la recette resservira, il ne doit pas revenir dans « À placer » à chaque courses.
 */
export function defaultOneOff(line: ImportLine): boolean {
  return !line.ingredient && line.received.catalogKey === undefined;
}

/**
 * Peut-on le garder dans le catalogue depuis l'import ? Pas s'il était déjà un achat
 * ponctuel chez l'expéditeur : la catégorie reçue est « Achats ponctuels », il faudra
 * lui en choisir une vraie plus tard (« Garder dans le catalogue »).
 */
export function canKeep(line: ImportLine): boolean {
  return !isOneOff(line.received.category);
}

/**
 * Catégorie d'un article créé à l'import : « Achats ponctuels » juste cette fois,
 * sinon celle reçue ; `existing` : celle du destinataire qui convient, sinon `desc`
 * sera créée. L'aperçu et l'import l'appellent tous les deux.
 */
export function newArticleCategory<
  C extends Pick<Category, "slug" | "catalogKey">,
>(
  line: ImportLine,
  oneOff: boolean,
  categories: readonly C[],
): { existing?: C; desc: CategoryDesc } {
  const desc = line.received.category;
  return {
    existing:
      (oneOff ? oneOffCategory(categories) : undefined) ??
      findCategory(desc, categories),
    desc,
  };
}

/** Décompte de l'aperçu : « 12 reconnus, 1 à confirmer, 2 non reconnus ». */
export function splitImportLines(lines: readonly ImportLine[]): {
  known: IndexedImportLine[];
  toCheck: IndexedImportLine[];
  probable: number;
  unknown: number;
} {
  const known: IndexedImportLine[] = [];
  const toCheck: IndexedImportLine[] = [];
  lines.forEach((line, index) => {
    (line.match.kind === "known" ? known : toCheck).push({ line, index });
  });
  const probable = toCheck.filter(
    ({ line }) => line.match.kind === "probable",
  ).length;
  return { known, toCheck, probable, unknown: toCheck.length - probable };
}

/** Une ligne importée et son rang dans l'aperçu (les choix sont rangés par rang). */
export interface IndexedImportLine {
  line: ImportLine;
  index: number;
}

/**
 * Quantité et unité d'une ligne importée pour l'article retenu : celles reçues, ou la
 * saisie lue selon cet article (texte collé). `undefined` : unité encore inconnue du
 * destinataire (elle sera créée à l'import).
 */
export function importAmount(
  line: ImportLine,
  article: Pick<Article, "defaultUnitId" | "defaultQuantity" | "countable">,
  units: readonly Unit[],
): Amount<Unit> | undefined {
  if ("entry" in line.amount)
    return entryAmount(line.amount.entry, article, units, true);
  const unit = findUnit(line.amount.unit, units);
  return unit ? { quantity: line.amount.quantity, unit } : undefined;
}
