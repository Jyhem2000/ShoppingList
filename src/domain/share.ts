import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import {
  entryAmount,
  exactEntry,
  parseEntry,
  resolveEntry,
  type ParsedEntry,
} from "./entry";
import { guessFromKeywords, type KeywordGuess } from "./keywords";
import type {
  Article,
  Category,
  Dimension,
  ID,
  ListItem,
  Unit,
  UnitGroup,
} from "./model";
import type { Amount } from "./quantity";
import { searchKey, slugify } from "./slug";

/**
 * Partage d'une liste (docs/02 § 9, docs/03 F1-F2 et A8, docs/07 § 7.9), sans serveur :
 * la liste voyage dans un lien, compressée ; le destinataire la relit et retrouve
 * chaque article chez lui (clé catalogue, libellés et alias, catalogue comme
 * dictionnaire, recherche), sinon on l'aide à choisir ou à créer.
 */

// --- Format du lien --------------------------------------------------------------

/**
 * Liste partagée, version 1. Noms de champs courts : ils se répètent à chaque ligne et
 * allongent le lien. Une catégorie ou une unité se désigne par sa clé catalogue, ou
 * par son slug si elle a été créée à la main (elle est alors décrite dans `c` ou `u`).
 */
export interface SharedList {
  /** Version du format. */
  v: 1;
  /** Langue de l'expéditeur. */
  l: string;
  /** Nom de la liste. */
  n: string;
  /** Lignes. */
  i: SharedItem[];
  /** Catégories créées à la main, citées par les articles. */
  c?: SharedCategory[];
  /** Unités créées à la main, citées par les lignes et les articles. */
  u?: SharedUnit[];
}

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
  /** Note. */
  o?: string;
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

/** La liste à envoyer (lignes déjà filtrées par `sharedItems`). */
export function buildSharedList(
  name: string,
  items: readonly Pick<
    ListItem,
    "articleId" | "quantity" | "unitId" | "acceptedTypes" | "note"
  >[],
  articleById: ReadonlyMap<ID, Article>,
  categoryById: ReadonlyMap<ID, Category>,
  unitById: ReadonlyMap<ID, Unit>,
  language = "fr",
): SharedList {
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
        c: categoryRef(article.categoryId) ?? FALLBACK_CATEGORY,
        u: unitRef(article.defaultUnitId) ?? unit,
        ...(article.icon && { i: article.icon }),
        ...(article.aliases.length && { al: article.aliases }),
        ...(article.types.length && { ty: article.types }),
      };
    }
    if (item.acceptedTypes.length) line.t = item.acceptedTypes;
    const note = item.note?.trim();
    if (note) line.o = note;
    lines.push(line);
  }
  return {
    v: SHARE_VERSION,
    l: language,
    n: name,
    i: lines,
    ...(categories.size && { c: [...categories.values()] }),
    ...(units.size && { u: [...units.values()] }),
  };
}

const IMPORT_PATH = "#/import?d=";
/** Alphabet de `compressToEncodedURIComponent`, et `%` d'un caractère réencodé en route. */
const LINK = /#\/import\?d=([A-Za-z0-9+\-$%]+)/;

/** Lien d'import : `base` est l'adresse de l'app, sans `#`. */
export function shareLink(base: string, shared: SharedList): string {
  return (
    base + IMPORT_PATH + compressToEncodedURIComponent(JSON.stringify(shared))
  );
}

/**
 * Liste contenue dans un texte (le message reçu, ou l'adresse de la page) : le premier
 * lien d'import qu'il contient. `undefined` : pas de lien, ou lien abîmé.
 */
export function findSharedList(text: string): SharedList | undefined {
  const encoded = LINK.exec(text)?.[1];
  if (!encoded) return undefined;
  try {
    const json = decompressFromEncodedURIComponent(decodeURIComponent(encoded));
    return json ? validSharedList(JSON.parse(json)) : undefined;
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

/** Relit une liste reçue : un lien abîmé ou trafiqué ne doit rien casser. */
function validSharedList(value: unknown): SharedList | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const list = value as Partial<SharedList>;
  if (list.v !== SHARE_VERSION || !isString(list.n) || !Array.isArray(list.i))
    return undefined;
  const items = list.i.filter((item: Partial<SharedItem> | null) => {
    if (typeof item !== "object" || item === null) return false;
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
      (a === undefined ||
        (typeof a === "object" &&
          isString(a.c) &&
          isString(a.u) &&
          optional(a.i, isString) &&
          optional(a.al, isStrings) &&
          optional(a.ty, isStrings)))
    );
  });
  const categories = (Array.isArray(list.c) ? list.c : []).filter(
    (c: Partial<SharedCategory> | null) =>
      typeof c === "object" &&
      c !== null &&
      isString(c.r) &&
      isLabel(c.n) &&
      isString(c.co),
  );
  const units = (Array.isArray(list.u) ? list.u : []).filter(
    (u: Partial<SharedUnit> | null) =>
      typeof u === "object" &&
      u !== null &&
      isString(u.r) &&
      isLabel(u.s) &&
      isLabel(u.p) &&
      (u.d === "mass" || u.d === "volume" || u.d === "other") &&
      isNumber(u.st) &&
      u.st > 0 &&
      optional(u.f, isNumber),
  );
  return {
    v: SHARE_VERSION,
    l: isString(list.l) ? list.l : "fr",
    n: list.n.trim(),
    i: items,
    c: categories,
    u: units,
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

const FALLBACK_CATEGORY = "autres";
const FALLBACK_UNIT = "piece";

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

/** Catégorie du destinataire qui correspond : même clé catalogue, sinon même slug. */
export function findCategory<C extends Pick<Category, "slug" | "catalogKey">>(
  desc: CategoryDesc,
  categories: readonly C[],
): C | undefined {
  const keyed =
    desc.catalogKey === undefined
      ? undefined
      : categories.find((c) => c.catalogKey === desc.catalogKey);
  return keyed ?? categories.find((c) => c.slug === desc.slug);
}

/** Unité du destinataire qui correspond : même clé catalogue, sinon même slug. */
export function findUnit<U extends Pick<Unit, "slug" | "catalogKey">>(
  desc: UnitDesc,
  units: readonly U[],
): U | undefined {
  const keyed =
    desc.catalogKey === undefined
      ? undefined
      : units.find((u) => u.catalogKey === desc.catalogKey);
  return keyed ?? units.find((u) => u.slug === desc.slug);
}

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

export function capitalize(text: string): string {
  const clean = text.trim();
  return clean.charAt(0).toLocaleUpperCase("fr") + clean.slice(1);
}

/**
 * Lignes d'une liste reçue, chacune avec sa correspondance chez le destinataire
 * (docs/02 § 9 : clé catalogue, slug et alias croisés, dictionnaire du catalogue,
 * recherche floue, sinon candidats).
 */
export function resolveImport(
  shared: SharedList,
  context: ImportContext,
): ImportLine[] {
  const { catalog } = context;
  const fallbackCategory = catalogCategory(catalog, FALLBACK_CATEGORY);
  const fallbackUnit = catalogUnit(catalog, FALLBACK_UNIT);
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
  const bulleted = lines.filter((line) => BULLET.test(line));
  const kept = (bulleted.length ? bulleted : lines)
    .map((line) =>
      line
        .replace(BULLET, "")
        // Précisions entre parenthèses en fin de ligne (« (Gala uniquement) »).
        .replace(/\s*\([^()]*\)\s*$/, "")
        .trim(),
    )
    .filter(Boolean);
  const entries = parseEntry(kept.join("\n"), context.units);
  const { catalog } = context;
  const fallbackCategory = catalogCategory(catalog, FALLBACK_CATEGORY);

  return entries.map((entry) => {
    const guess = guessFromKeywords(entry.text, context.keywordRules);
    const category =
      (guess && catalog.categories.get(guess.category)) ?? fallbackCategory;
    const unit = catalogUnit(
      catalog,
      guess?.unit ?? category.unitKey ?? FALLBACK_UNIT,
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
const FORMATTING =
  /(^|[^\p{L}\p{N}])([*_~])(?=\S)(.+?)(?<=\S)\2(?![\p{L}\p{N}])/gu;

/**
 * Puce en début de ligne : •, -, *, case à cocher, ou numéro suivi d'une espace
 * (« 1. pain », mais pas « 2.5 kg de farine »).
 */
const BULLET =
  /^\s*(?:(?:[•·▪◦‣∙*\-–—✓✔☐☑]|\[[ xX]?\])\s*|\d+[.)]\s+)(?:\[[ xX]?\]\s*)?(?=\S)/u;

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

function mergeTypes(a: readonly string[], b: readonly string[]): string[] {
  const keys = new Set(a.map(slugify));
  return [...a, ...b.filter((type) => !keys.has(slugify(type)))];
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
    catalog.units.get(FALLBACK_UNIT) ?? {
      catalogKey: FALLBACK_UNIT,
      slug: FALLBACK_UNIT,
      singular: FALLBACK_UNIT,
      plural: FALLBACK_UNIT,
      dimension: "other",
      step: 1,
      aliases: [],
    }
  );
}

const collator = new Intl.Collator("fr");

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
        collator.compare(a.article.name, b.article.name),
    )
    .slice(0, max)
    .map(({ article }) => article.id);
}

// --- Choix et quantités ---------------------------------------------------------

/** Ce que le destinataire décide pour une ligne. */
export type ImportChoice =
  | { kind: "use"; articleId: ID }
  | { kind: "create"; name: string }
  | { kind: "skip" };

/** Par défaut : l'article reconnu ou proposé, sinon « Créer » avec le libellé du catalogue. */
export function defaultChoice(line: ImportLine): ImportChoice {
  return line.match.kind === "unknown"
    ? { kind: "create", name: line.received.name }
    : { kind: "use", articleId: line.match.articleId };
}

/** Décompte de l'aperçu : « 12 reconnus, 1 à confirmer, 2 non reconnus ». */
export function importSummary(lines: readonly ImportLine[]): {
  known: number;
  probable: number;
  unknown: number;
} {
  const count = (kind: ImportMatch["kind"]) =>
    lines.filter((line) => line.match.kind === kind).length;
  return {
    known: count("known"),
    probable: count("probable"),
    unknown: count("unknown"),
  };
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
