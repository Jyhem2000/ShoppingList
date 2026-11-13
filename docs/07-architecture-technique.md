# 07 — Architecture technique

## 1. Principes

- **Application web statique** (HTML/JS/CSS), sans serveur ni base distante. Toutes les données sont dans le navigateur (IndexedDB).
- **Installable** sur l'écran d'accueil (PWA) et **entièrement hors ligne**.
- **100 % gratuit** : bibliothèques open source, fonctionnalités natives du navigateur, hébergement statique gratuit.
- **Logique métier isolée** dans des fonctions pures, testées indépendamment de l'interface.

## 2. Stack

| Besoin                         | Choix                                                                                                             | Licence          | Pourquoi                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| Build, serveur de dev          | **Vite**                                                                                                          | MIT              | Standard actuel, rapide                                                                             |
| Interface                      | **React 19 + TypeScript** (strict)                                                                                | MIT              | Écosystème le plus large, très bien maîtrisé par les agents IA                                      |
| Styles                         | **Tailwind CSS v4**                                                                                               | MIT              | Tokens de couleurs (05 § 2) en variables CSS, itération rapide                                      |
| Composants                     | **shadcn/ui** (Radix UI, Vaul pour les panneaux glissants)                                                        | MIT              | Composants accessibles copiés dans le projet, entièrement stylables                                 |
| Routage                        | **React Router 8** (`createHashRouter`), historique par hash (`#/…`)                                              | MIT              | Simple ; aucune configuration serveur sur un hébergement statique                                   |
| Stockage                       | **Dexie.js** + `dexie-react-hooks`                                                                                | Apache 2.0       | IndexedDB avec requêtes réactives (`useLiveQuery`), index, transactions, migrations                 |
| État d'interface               | État React local + contexte. **Zustand** seulement si le besoin apparaît                                          | MIT              | Les données métier vivent dans Dexie, pas dans un store global                                      |
| Recherche                      | Implémentation maison dans `domain/`                                                                              | —                | ~1 000 articles : pas besoin de bibliothèque ; contrôle total des règles (accents, pluriels, alias) |
| Glisser-déposer                | **dnd-kit**                                                                                                       | MIT              | Réordonner les rayons, compatible tactile                                                           |
| Animations, gestes             | **Motion**                                                                                                        | MIT              | Animations de listes, glissements (swipe)                                                           |
| Sons                           | **Web Audio API** (native) + sons CC0                                                                             | —                | Voir 05 § 7                                                                                         |
| Icônes interface               | **lucide-react**                                                                                                  | ISC              | —                                                                                                   |
| Icônes articles                | **Dessinées pour l'app** (`src/icons/drawn`, une par article)                                                     | —                | Pack réuni au build (05 § 4)                                                                        |
| Compression du lien de partage | **lz-string**                                                                                                     | MIT              | Données de la liste dans l'URL (v1.3)                                                               |
| PWA                            | **vite-plugin-pwa** (Workbox)                                                                                     | MIT              | Manifest, service worker, cache hors ligne, mises à jour (§ 6)                                      |
| Police                         | **Plus Jakarta Sans** via `@fontsource-variable/plus-jakarta-sans`                                                | OFL              | Embarquée, hors ligne                                                                               |
| Tests                          | **Vitest**, **Playwright**                                                                                        | MIT / Apache 2.0 | Voir [08](08-tests-et-qualite.md)                                                                   |
| Lint / format                  | **ESLint** (typescript-eslint strict, hooks React) + **Prettier** (réglages par défaut, tri des classes Tailwind) | MIT              | Les standards des projets React + Vite ; ESLint analyse le code avec les types                      |     |
| Déploiement                    | **Cloudflare Pages** connecté au dépôt GitHub                                                                     | gratuit          | Voir § 9                                                                                            |

Versions des bibliothèques : dernières stables au moment de l'initialisation (novembre 2026 : Vite 8, React 19, TypeScript 6.0 (la 7, compilateur natif, n'est pas encore prise en charge par typescript-eslint), React Router 8, Tailwind CSS 4, Vitest 5, Playwright 1.65, ESLint 10, Prettier 3). Node 26 LTS (Node 24 est en fin de support).

## 3. Fonctionnalités du navigateur

Toutes ces fonctionnalités sont **gratuites** : elles sont intégrées au navigateur, sans compte ni clé.

Rappel ([01](01-vision.md#plateformes-cibles)) : sur iPhone, **tous les navigateurs et l'app installée utilisent WebKit** ; la colonne « iPhone » vaut donc pour Chrome iPhone comme pour Safari. Règle : _essentiel_ = doit marcher sur les deux ; _confort_ = au moins un des deux, sans rien casser ailleurs (détection systématique avant usage).

| Fonctionnalité                     | Usage                                   | iPhone (WebKit)                      | Android (Chrome) | Rôle             | Décision                                                                                |
| ---------------------------------- | --------------------------------------- | ------------------------------------ | ---------------- | ---------------- | --------------------------------------------------------------------------------------- |
| IndexedDB                          | Stockage                                | ✅                                   | ✅               | Essentiel        | Utilisée (Dexie)                                                                        |
| Service Worker + Cache             | Hors ligne, mises à jour                | ✅                                   | ✅               | Essentiel        | Utilisée                                                                                |
| Screen Wake Lock                   | Écran allumé en mode courses (C1)       | ✅ (app installée : iOS 18.4+)       | ✅               | Essentiel        | Utilisée ; message de repli si indisponible                                             |
| Web Audio                          | Sons (H6)                               | ✅ (après un premier geste)          | ✅               | Confort          | Utilisée                                                                                |
| Audio Session API                  | Suivre le mode silencieux (H6)          | ✅ (iOS 17+)                         | ❌               | Confort          | Utilisée sur iPhone (`type = "ambient"`)                                                |
| Web Share                          | Export de sauvegarde (H4), partage (F1) | ✅ texte, lien, fichiers             | ✅               | Essentiel        | Utilisée                                                                                |
| Clipboard                          | « Coller une liste partagée » (F2)      | ✅ sur geste de l'utilisateur        | ✅               | Essentiel (v1.3) | Utilisée                                                                                |
| `navigator.storage.persist()`      | Limiter l'effacement des données        | ✅                                   | ✅               | Confort          | Demandée automatiquement au démarrage de l'app installée, sans rien afficher            |
| Vibration                          | Retour haptique (H7)                    | ❌                                   | ✅               | —                | **Non retenue** : absente sur iPhone, l'astuce haptique n'y fonctionne pas (H7 retirée) |
| `beforeinstallprompt`              | Bouton « Installer » (H5)               | ❌ (installation manuelle expliquée) | ✅               | Confort          | Utilisée sur Android                                                                    |
| Caméra (`getUserMedia`)            | Scan code-barres (I1)                   | ✅                                   | ✅               | Idée             | Plus tard                                                                               |
| `BarcodeDetector`                  | Scan code-barres (I1)                   | ❌                                   | ✅               | Idée             | Native si présente, sinon ZXing                                                         |
| Web Speech (reconnaissance vocale) | Dictée                                  | ⚠️ peu fiable en app installée       | ✅               | —                | **Non retenue** : le micro du clavier fait la même chose partout (A7)                   |

## 4. Stockage : points d'attention

**Android (Chrome)** : l'app installée partage ses données avec Chrome pour la même adresse, les liens de l'app s'ouvrent généralement dans l'app installée, et le stockage persistant est accordé aux apps installées.

**iPhone** :

1. **L'app installée sur l'écran d'accueil a son propre stockage**, séparé de celui de Chrome (et de Safari). Les données saisies dans le navigateur avant l'installation ne se retrouvent pas dans l'app. → L'écran de premier lancement (04 § 2.11) pousse à installer **avant** toute saisie.
2. **Effacement automatique** : WebKit peut effacer les données d'un _site_ non visité depuis 7 jours ; une app installée n'est pas concernée de la même façon (son compteur dépend de son propre usage). → Installation fortement recommandée + export en fichier expliqué dans Réglages → Sauvegarde (H4). Les copies automatiques internes (H4) ne couvrent pas ce risque : elles sont effacées avec le reste.
3. **Hauteur au lancement** : bug connu d'iOS. Au lancement de l'app installée, la zone d'affichage mesure la hauteur de l'écran moins celle de la barre d'état (797 au lieu de 844 sur l'iPhone de test) jusqu'au premier défilement de la page. La page est peinte sur tout l'écran, mais un élément en position fixe est coupé au bas de cette zone : la barre d'onglets remontait, ou ses libellés étaient coupés. Tant que la zone est trop courte (iPhone, app installée, portrait), le cadre de l'app est donc posé dans la page (position absolue) à la hauteur de l'écran ; dès qu'iOS l'a corrigée, il redevient fixe à 100 % de la zone d'affichage, pour que le rebond de la page ne le déplace pas (`src/platform/viewport.ts`). Correction validée sur iPhone avec un diagnostic de mesures, retiré depuis. Un défilement invisible d'un pixel au lancement a été essayé puis abandonné : il ne corrigeait pas la hauteur et faisait trembler l'affichage. Seul le contenu défile. La page ne rebondit pas (`overscroll-behavior: none` sur `html`) : sur iPhone, un rebond de la page faisait ignorer l'appui suivant sur la barre d'onglets. Le contenu garde son effet élastique, mais sa barre de défilement est masquée : iOS la dessinait au-dessus du titre, sous la barre d'état. Barre d'état en `black-translucent`, avec une bande opaque sur sa zone.
4. **Liens** : un lien ouvert depuis Messages s'ouvre dans le navigateur, jamais dans l'app installée → mécanisme « Coller une liste partagée » (F2).

**Partout** : chaque adresse (production, préproduction — § 9) est une app distincte avec ses propres données. Installer la préproduction pour tester n'affecte pas l'app de production.

## 5. Schéma de données

Conventions :

- `id` : `crypto.randomUUID()`, jamais modifié.
- `createdAt`, `updatedAt` : horodatages (ms).
- Aucune donnée dérivée stockée (« est dans la liste courante », fréquences d'achat… se calculent).
- Le libellé d'un article n'est jamais recopié ailleurs (lignes, ingrédients, historique pointent vers l'`id`).

```ts
type ID = string;
interface Base {
  id: ID;
  createdAt: number;
  updatedAt: number;
}

type Dimension = "mass" | "volume" | "other";

interface Unit extends Base {
  slug: string; // unique
  singular: string; // "kilogramme"
  plural: string; // "kilogrammes"
  abbr?: string; // "kg" ; absent = affichage "× n"
  dimension: Dimension;
  group?: UnitGroup; // "mass" | "volume" | "container" | "count" | "kitchen" : groupe du sélecteur (06 § 1)
  factor?: number; // vers l'unité de base de la dimension (g, ml)
  step: number; // pas des boutons +/− et de l'arrondi
  aliases: string[]; // pour l'analyse de saisie : ["kilo", "kilos"]
  catalogKey?: string;
}

interface Category extends Base {
  slug: string; // unique
  name: string;
  icon?: string; // nom d'icône Lucide (05 § 4) : "apple"
  color: string; // nom de la palette (05 § 2) : "sauge"
  useIconAsFallback: boolean;
  isSystem: boolean; // "Autres"
  catalogKey?: string;
}

interface Article extends Base {
  slug: string; // unique, recalculé au renommage
  name: string;
  categoryId: ID;
  defaultUnitId: ID;
  defaultQuantity?: number; // ex. 6 pour les œufs ; sinon 1 (ou le pas de l'unité)
  generic?: boolean; // « Fruits au choix » : en tête de sa catégorie et de son rayon
  types: string[]; // [] par défaut
  aliases: string[]; // slugifiés pour la comparaison
  icon?: string;
  favorite: boolean;
  seasonMonths?: number[]; // plus tard (D3) : 1..12
  barcodes: string[]; // idée I1
  notDuplicateOf: ID[]; // paires écartées de la détection de doublons
  catalogKey?: string;
}

interface Store extends Base {
  name: string;
  orderLocked: boolean;
  lastUsedAt?: number;
  articleOrder?: Record<ID, number>; // ordre appris des articles (§ 7.6), comparé entre articles d'un même rayon
}

interface Aisle extends Base {
  storeId: ID;
  name: string;
  icon?: string;
  color: string;
  position: number; // score 0..1, appris ou manuel ; tri croissant
  categories: { categoryId: ID; primary: boolean }[];
  isUnsorted: boolean; // rayon "Non classé"
}
// Invariant : dans un magasin, une catégorie a au plus UN rayon où primary = true.

interface ArticleAisleOverride {
  id: ID;
  storeId: ID;
  articleId: ID;
  aisleId: ID;
}

interface ShoppingList extends Base {
  name: string;
  position: number;
  lastStoreId?: ID;
}

interface ListItem extends Base {
  listId: ID;
  articleId: ID; // unique par liste (hors lignes archivées)
  quantity: number;
  unitId: ID;
  acceptedTypes: string[]; // [] = peu importe
  note?: string;
  status: "todo" | "checked" | "unavailable";
  checkedAt?: number;
  closedInSessionId?: ID; // ligne achetée et clôturée : masquée, restaurée si réouverture
  fromRecipes: { recipeId: ID; amount: number }[];
}

interface Recipe extends Base {
  name: string;
  icon?: string;
  yield: { quantity: number; unit: string }; // { 4, "personnes" } ou { 1, "cake" }
  ingredients: {
    articleId: ID;
    quantity: number;
    unitId: ID;
    acceptedTypes: string[];
    optional: boolean;
    fixed: boolean; // quantité fixe : non recalculée selon le rendement
  }[];
  steps?: string;
}

interface ShoppingSession {
  id: ID;
  listId: ID;
  storeId: ID;
  startedAt: number;
  status: "open" | "closed";
  closedAt?: number;
  learningSnapshot?: {
    // état avant application de l'apprentissage, pour la réouverture
    aislePositions: Record<ID, number>;
    articleOrder: Record<ID, number>;
  };
}

interface Purchase {
  // une ligne cochée lors d'une session
  id: ID;
  sessionId: ID;
  storeId: ID;
  articleId: ID;
  aisleId: ID;
  quantity: number;
  unitId: ID;
  at: number;
}

interface Settings {
  animations: "auto" | "always" | "never";
  compact: boolean;
  simplifyQuantities: boolean;
  checkedBehavior: "sink" | "hide";
  lastBackupAt?: number;
  lastSeenVersion?: string; // pour afficher « Quoi de neuf »
  catalogVersion: number;
  currentListId?: ID;
  dismissedSuggestions: { articleId: ID; until: number }[];
}
```

### Tables Dexie

```ts
db.version(1).stores({
  units: "id, &slug",
  categories: "id, &slug",
  articles: "id, &slug, *aliases, categoryId, favorite, *barcodes, catalogKey",
  stores: "id",
  aisles: "id, storeId",
  overrides: "id, [storeId+articleId]",
  lists: "id, position",
  items: "id, listId, articleId, closedInSessionId",
  recipes: "id",
  sessions: "id, listId, storeId, status, startedAt",
  purchases: "id, sessionId, storeId, articleId, at",
  meta: "key", // settings, version du catalogue…
});
```

- **Préférences de l'appareil** (sons, son par son, écran allumé, thème) : hors de `Settings`, dans `localStorage` (`src/app/preferences.ts`). Elles dépendent du téléphone, ne sont pas exportées et ne sont pas écrasées par l'import d'une sauvegarde venant d'un autre appareil.
- Unicité « un article par liste » vérifiée par la couche d'accès aux données (les lignes archivées `closedInSessionId` sont exclues).
- **La version du schéma de données est indépendante de la version de l'app** : elle n'augmente que si la structure change. Toute évolution = nouvelle `version(n)` + fonction `upgrade` + test de migration. Les migrations s'exécutent automatiquement au premier lancement de la nouvelle version. Historique : **version 2** (13 novembre 2026) — mêmes tables ; les rayons au nom resté celui d'un modèle perdent ce nom (rayons numérotés, 02 § 4) ; une sauvegarde d'un schéma plus ancien passe par la même migration à l'import (`src/db/migrations.ts`).

## 6. App installée, hors ligne et mises à jour

### L'app installée est-elle locale ou sur le web ?

**Locale.** Une PWA est un site web dont **tous les fichiers sont copiés sur le téléphone** par le _service worker_ lors de la première visite. Ensuite :

- l'app s'ouvre depuis cette copie locale, **même sans réseau** ;
- les données (listes, articles…) sont dans IndexedDB, **sur le téléphone uniquement** ; rien n'est jamais envoyé au serveur d'hébergement ;
- le web ne sert qu'à **récupérer les nouvelles versions** de l'app.

### Comment fonctionnent les mises à jour ?

1. À chaque ouverture de l'app, au retour au premier plan et toutes les heures, le navigateur vérifie discrètement si le fichier du service worker a changé sur le serveur. Ce fichier contient la liste de tous les fichiers de l'app avec une empreinte de leur contenu : **la moindre modification déployée est détectée** (ce n'est pas le numéro de version qui est comparé).
2. Si une nouvelle version existe, elle est **téléchargée en arrière-plan**, sans interrompre l'utilisation.
3. L'app affiche « Version 1.2.0 disponible — Mettre à jour » (mode `prompt` de vite-plugin-pwa). Jamais en mode courses, jamais de rechargement forcé.
4. Au tap : activation de la nouvelle version, rechargement, migrations de données éventuelles, puis « Quoi de neuf » (comparaison avec `lastSeenVersion`).
5. Hors ligne : l'app continue avec la version déjà installée ; la mise à jour attendra le retour du réseau.
6. Chaque vérification (automatique ou bouton « Rechercher une mise à jour » de l'écran À propos) a un **délai maximal de 10 s** : sur un réseau de magasin très lent, elle échoue proprement au lieu de rester en suspens.

### Manifest et iOS

- Thème (H11) : `src/app/theme.ts` pose `<html data-theme="dark|light">` et la couleur de la barre d'état ; un petit script dans `index.html` le fait avant l'affichage, depuis la préférence enregistrée. Sur iPhone, le style de la barre d'état (`apple-mobile-web-app-status-bar-style`) n'est lu qu'au lancement : texte blanc en sombre, noir en clair.
- Manifest : nom, icônes (dont `apple-touch-icon` 180×180 et icône adaptative Android), `display: standalone`, couleurs `#0b0b0e`.
- `<meta name="viewport" content="…, viewport-fit=cover">` + gestion des `safe-area-inset-*`.
- Précache de toute l'app : JS, CSS, police, pack d'icônes, sons.

## 7. Algorithmes (dans `src/domain/`, fonctions pures)

### 7.1 `slugify(label)` et `searchKey(label)`

Règles en [02 § 1](02-modele-metier.md#1-libellé-identifiant-et-slug). Implémentation : `toLowerCase('fr')` → `normalize('NFD')` → retrait de `̀-ͯ` → ligatures → remplacement de `[^\p{L}\p{N}]+` par `-` (expression régulière avec le drapeau `u`) → nettoyage des tirets. `searchKey` = `slugify` puis suppression d'un `s`/`x` final de chaque mot de plus de 3 lettres (règle propre au français, appliquée uniquement aux mots en alphabet latin).

### 7.2 `searchArticles(query, articles, stats)`

- Normalise la requête avec `searchKey`, compare aux libellés **et aux alias**.
- Score : libellé commençant par la requête > un mot commençant par la requête > alias > début du libellé suivi de types de l'article (« citron vert », « jus d'orange ») > contient la requête > faute de frappe d'une lettre (mots de 5 lettres et plus, première lettre juste).
- **Accents** : sans accents, tout ce qui correspond est proposé (« pate » : _Pâté_, _Pâtes_, _Pâte à tartiner_…). Si la requête en porte, les libellés qui les contiennent passent devant (`accentKey`, qui garde les accents) : « pâté » met _Pâté_ en tête, « pâtes » _Pâtes_. Deux articles peuvent donc ne différer que par leurs accents ; jamais par rien d'autre.
- Départage par position du mot trouvé dans le libellé (« tomtes » : _Tomates_ avant _Sauce tomate_), puis par fréquence d'achat, puis ordre alphabétique (`Intl.Collator('fr')`).

### 7.3 `parseEntry(text, units)` → `ParsedEntry[]`

1. Découpe en segments sur `,` `;` `et` et retours à la ligne.
2. Pour chaque segment : retire les partitifs (`du`, `de la`, `des`, `d'`, `de`) ; détecte une quantité (chiffres avec virgule ou point, nombres en lettres jusqu'à vingt, `douzaine`, `demi-douzaine`), avant ou après (`x3`, `*3`) ; détecte une unité (slug, abréviation, alias, pluriel des unités **de l'utilisateur**) collée ou non au nombre.
3. Retourne `{ text, quantity?, unitSlug? }`.
4. Résolution ensuite (hors parsing) : recherche de l'article sur le texte complet, puis sur des préfixes de plus en plus courts ; si plusieurs libellés ont la même clé (_Pâté_, _Pâtes_), la saisie exacte l'emporte, puis le pluriel tapé (`slugify`), puis les accents tapés (`accentKey`), sinon le premier résultat de recherche ; les mots restants sont comparés aux **types** de l'article trouvé, en ignorant les mots de liaison (`de`, `d'`, `du`, `à`, `en`, `ou`…) : `pommes gala` → _Pommes_ + type _Gala_ ; `jus d'orange` → _Jus de fruits_ + type _orange_ ; `pommes gala ou golden` → deux types acceptés.

### 7.4 `effectiveAisle(article, store, aisles, overrides)`

Exception de l'article → rayon **principal** de sa catégorie → « Non classé » ([02 § 4](02-modele-metier.md#rayon-effectif-dun-article-dans-un-magasin)).

### 7.5 `groupListForStore(items, articles, store, aisles, overrides, articleOrder)` → `AisleGroup[]`

Mode courses (03 B1). La liste, elle, est groupée par catégorie : `groupListByCategory` (`src/domain/categories.ts`), catégories dans l'ordre du catalogue (`sortCategories`, partagé avec l'écran Catalogue).

Groupes par rayon effectif, rayons triés par `position` (« Non classé » en dernier), rayons vides omis ; dans un groupe : lignes `todo` puis `checked` puis `unavailable`, chacune avec les articles génériques en tête, puis triée par ordre appris (`articleOrder` : score par article, plus petit d'abord ; les articles sans ordre appris viennent après) puis alphabétique. Lignes archivées exclues.

`articleOrder` est l'ordre appris des articles du magasin (`Store.articleOrder`, § 7.6) : un champ sans index, donc sans changement du schéma Dexie.

### 7.6 Clôture, apprentissage et réouverture

**Clôture** (`closeSession`), dans une seule transaction :

1. Enregistrer `learningSnapshot` (positions actuelles des rayons du magasin et ordre des articles).
2. Si le magasin n'est pas verrouillé, appliquer l'apprentissage (`learnAislePositions`, `learnArticleOrder` dans `src/domain/shopping.ts`) à partir de **tous** les achats de la session :
   - les achats sont numérotés dans l'**ordre des coches** (rang 0, 1, 2…) : l'heure ne sert qu'à les trier, une pause en magasin ne pèse rien ;
   - pour chaque rayon ayant au moins un achat : rang **médian** de ses achats (robuste aux allers-retours : un oubli repris à la fin ne fait pas passer le rayon en dernier) ;
   - les rayons visités se **répartissent entre leurs propres positions**, dans l'ordre de ces médianes : les rayons non visités et « Non classé » ne bougent pas ;
   - même principe pour les articles, rayon par rayon (`Store.articleOrder`) ; un article sans ordre appris prend une place après les articles connus.

   Choix du 12 novembre 2026, à la place d'une moyenne `0,6 × ancienne + 0,4 × r` (rang normalisé sur [0, 1]) : celle-ci tirait les rayons visités vers les extrémités, devant ou derrière des rayons non visités, alors que la session ne dit rien de leur place relative. L'ordre observé est donc repris tel quel ; un parcours inhabituel se corrige à la course suivante, ou en verrouillant l'ordre.

3. Marquer les lignes cochées `closedInSessionId = session.id` ; session `closed`.

**Réouverture** (`reopenSession`) : restaurer les positions depuis `learningSnapshot`, retirer `closedInSessionId` des lignes de la session (elles réapparaissent cochées), session `open`. La clôture suivante recalcule tout : **aucun double comptage**.

**Purge** : au démarrage d'une nouvelle session sur la liste, les lignes archivées des sessions précédentes sont supprimées (les achats restent dans l'historique).

**Ordre manuel** (glisser-déposer) : positions réparties uniformément sur [0, 1].

### 7.7 Suggestions anti-oubli (D1)

Calculées à la demande à partir des achats des sessions **clôturées**. Pour chaque article acheté au moins 3 fois : intervalle médian `I` entre achats, dernier achat `t`. Suggéré si `maintenant − t ≥ 0,9 × I`, absent de la liste et non écarté. Classement par `(maintenant − t) / I` décroissant ; 5 maximum.

### 7.8 Quantités

- `convert(q, from, to)` : seulement si même dimension ≠ `other`, via les facteurs.
- `changeUnit(line, newUnit)` : convertit la quantité si possible, sinon la conserve.
- `simplify(q, unit, units)` : parmi les unités de même dimension (≠ `other`), choisit **la plus grande** qui donne une valeur ≥ 1 avec 3 décimales au plus ; sinon conserve. 1200 g → 1,2 kg ; 250 g → 250 g ; 150 cl → 1,5 l ; 33 cl → 33 cl.
- `mergeQuantity(existing, added)` : même unité → somme ; convertible → somme dans l'unité existante puis `simplify` ; sinon → `incompatible` (l'interface demande).
- `scaleRecipe(recipe, amount)` : quantités fixes inchangées ; les autres `q × amount ÷ recipe.yield.quantity`, arrondi **au pas supérieur** : `ceil(q / step − 1e-9) × step`, puis `simplify`.
- Affichage : virgule décimale, zéros inutiles supprimés (`1,5 kg`, `× 3`, `2 boîtes`).

### 7.9 Partage (v1.3)

- Format : `{ v: 1, kind: "list", lang: "fr", name, items: [{ article: { key?, slug, name, aliases, icon, types, category: { key?, slug, name, color }, unit: { key?, slug, singular, plural, abbr, dimension, factor, step } }, quantity, unitSlug, acceptedTypes, note }] }`.
- Encodage : JSON → `lz-string` (`compressToEncodedURIComponent`) → `https://<adresse>/#/import?d=…`. Les données sont dans le fragment `#`, jamais envoyé au serveur d'hébergement.
- Import : `resolveImport(payload, userData, catalog)` → décision par article, dans l'ordre de [02 § 9](02-modele-metier.md#import-chez-le-destinataire) :
  1. clé catalogue ;
  2. slug ;
  3. alias croisés ;
  4. **dictionnaire du catalogue** : index `slug → clé catalogue` construit sur tous les libellés et alias du catalogue embarqué, **toutes langues** ; si le libellé reçu y figure, on cherche l'article du destinataire portant cette clé ;
  5. recherche floue → « à confirmer » ;
  6. sinon « non reconnu » avec `suggestCandidates(article, userArticles, stats)` : même icône + même catégorie, puis même icône, puis même catégorie triée par fréquence d'achat (5 candidats max).
- Application en une transaction ; une association manuelle ajoute le libellé reçu aux alias de l'article choisi ; une création utilise le libellé saisi par le destinataire et garde le libellé reçu en alias.

### 7.12 Doublons probables (G1)

`findLikelyDuplicates(articles)` : paires d'articles de même catégorie et même icône dont les clés de recherche sont proches (distance d'édition ≤ 2, ou l'une contient l'autre) ou qui partagent un alias ; paires présentes dans `notDuplicateOf` exclues.

### 7.10 Réglage des animations

`<MotionConfig reducedMotion>` : _Automatique_ → `"user"`, _Toujours_ → `"never"`, _Jamais_ → `"always"` + classe CSS globale désactivant transitions et animations CSS.

### 7.11 Sons

Un module `feedback` unique (`feedback.check()`, `feedback.aisleDone()`…) qui joue le son (si activé). Aucun appel direct à Web Audio ailleurs dans le code.

## 8. Arborescence

```
ShoppingList/
├─ README.md                  # présentation du projet (utilisateurs)
├─ CLAUDE.md                  # consignes pour l'agent IA
├─ docs/                      # cette documentation (développeurs)
├─ public/                    # icônes de l'app, sons (public/sounds : Kenney, CC0)
├─ scripts/
│  ├─ release.ts              # publication d'une version (§ 9)
│  └─ versioning.ts           # calcul du numéro de version depuis les commits
├─ src/
│  ├─ app/                    # point d'entrée, routes, layout, onglets, mise à jour, préférences de l'appareil
│  ├─ features/
│  │  ├─ list/                # liste, lignes, barre d'ajout, fiche ligne
│  │  ├─ shopping/            # mode courses, wake lock, clôture, réouverture
│  │  ├─ catalog/             # grille catégories / articles, habituels
│  │  ├─ recipes/             # recettes, ajout à une liste (v1.1)
│  │  ├─ suggestions/         # anti-oubli (v1.2)
│  │  ├─ share/               # partage, import, aperçu (v1.3)
│  │  ├─ manage/              # articles, catégories, magasins/rayons, unités
│  │  ├─ settings/            # réglages, fonctionnalités, sons, sauvegarde, premier lancement, à propos
│  │  └─ dev/                 # maquette des composants #/dev/ui (hors production)
│  ├─ domain/                 # fonctions pures (§ 7) — aucun import React ni Dexie
│  ├─ db/                     # schéma Dexie, migrations, accès aux données, initialisation
│  ├─ data/                   # données initiales (06)
│  ├─ ui/                     # composants partagés (shadcn + ProductIcon, ItemRow, AisleHeader, AddBar, CatalogCard, Sheet)
│  ├─ icons/                  # icônes dessinées (drawn/*.svg), pack des articles assemblé au build (packData.ts), icônes Lucide des catégories et rayons (lucide.ts)
│  ├─ feedback/               # sons
│  ├─ platform/               # installation, écran allumé (fonctionnalités du navigateur)
│  ├─ i18n/fr.ts              # tous les textes de l'interface
│  └─ version.ts              # expose version, commit, canal (injectés au build)
└─ tests/
   ├─ unit/                   # Vitest
   └─ e2e/                    # Playwright (résultats dans tests/e2e/.results et .report, ignorés par git)
```

## 9. Hébergement, versions et déploiement

### Hébergement

**Cloudflare Pages** (gratuit), **connecté directement au dépôt GitHub** `Jyhem2000/ShoppingList` (privé pour l'instant ; le site publié, lui, est public). Cloudflare construit et met en ligne l'app à chaque push : aucun jeton ni secret à gérer, aucun workflow GitHub Actions. Mise en place : [guide](deploiement-cloudflare.md).

Commande de build côté Cloudflare : `npm run build:checked` (format, lint, types, tests unitaires, puis build). **Si un contrôle échoue, rien n'est mis en ligne.** Les tests E2E (navigateurs émulés) tournent sur le poste de développement : avant chaque commit et dans `npm run release`.

### Branches et environnements

| Branche                    | Rôle                                                                                        | Environnement     | Adresse                                           |
| -------------------------- | ------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------- |
| `dev` (branche par défaut) | **Travail quotidien** : on y commite et pousse directement ; tout ce qui n'est pas publié   | **Préproduction** | `dev.<projet>.pages.dev`                          |
| `main`                     | **Uniquement les versions publiées** : n'avance que par `npm run release`, jamais à la main | **Production**    | `<projet>.pages.dev` (ou domaine perso plus tard) |

Il n'y a pas d'autre branche : pas de branche de travail ni de pull request. Seules `dev` et `main` sont construites par Cloudflare (réglage « Custom branches ») ; les essais sur téléphone se font en préproduction. On ne travaille jamais directement sur `main`. Le canal affiché dans l'app (§ 6) est déduit de la branche construite (`CF_PAGES_BRANCH`). Hors production, l'app installée s'appelle **« ShoppingList DEV »** (manifeste et titre), pour distinguer les deux apps installées côte à côte sur le téléphone.

### Numéro de version

- Format **SemVer** `MAJEUR.MINEUR.CORRECTIF` : `1.0.0`, `1.1.0` (recettes), `1.0.1` (correctif).
- **Source unique : `version` dans `package.json`.** Au build, Vite injecte des constantes (`define`) lues par `src/version.ts` : version, empreinte du commit, date, canal (`production` / `preprod` / `preview` / `dev`). Hors production, l'app affiche par exemple `1.1.0 · préproduction · a1b2c3d`.
- **Calcul automatique** à partir des messages de commit (Conventional Commits) depuis la version précédente : un `feat:` → version mineure ; uniquement des `fix:`, `docs:`, `chore:`… → correctif ; `feat!:` ou « BREAKING CHANGE » → majeure (mineure tant qu'on est en 0.x). On peut toujours imposer la version (`npm run release -- 0.9.0`).
- Le build génère aussi `licences.json` (bibliothèques incluses et texte de leur licence), affiché dans Réglages → À propos → Licences.

### Nouveautés

L'historique git sert aux développeurs ; ses messages sont trop techniques pour l'utilisateur. Les **nouveautés** de chaque version sont donc écrites pour l'utilisateur dans `src/i18n/fr.ts` (`releaseNotes`), affichées dans Réglages → À propos → Nouveautés, et reprises par l'écran « Quoi de neuf » après une mise à jour (H5). `npm run release` refuse de publier une version dont les nouveautés ne sont pas écrites. On peut les écrire à l'avance : l'écran n'affiche que les versions égales ou antérieures à celle de l'app.

### Cycle des versions

| Moment                                        | Version                                                                                                                                                                                   | Où l'installer                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Validation de chaque phase de la v1.0 (1 à 8) | `0.N.0` = phase N validée (`0.4.0` … `0.8.0`), publiées par `npm run release` ; correctifs entre deux : `0.N.1`, `0.N.2`…                                                                 | Production, pour les essais (pas encore d'installation définitive) |
| Fin de la phase 8                             | **`0.9.0`** — candidate à la v1.0 (`npm run release -- 0.9.0`)                                                                                                                            | **Production** : installation définitive sur les téléphones        |
| Usage réel (2-3 semaines)                     | `0.9.1`, `0.9.2`… correctifs                                                                                                                                                              | Production                                                         |
| Validation de la 0.9                          | **`1.0.0`** — même code (`npm run release -- 1.0.0`)                                                                                                                                      | Production (les données restent en place)                          |
| Versions suivantes                            | Développement sur `dev`, testé en préproduction avec une **copie des vraies données** (export de sauvegarde de la production → import en préproduction), puis `1.1.0`, correctifs `1.1.x` | Production                                                         |

**Règle de numérotation pendant la v1.0** : la version `0.N.0` sort quand la **phase N est validée** (critères de 09 et checklist téléphone). Elle peut contenir en avant-première le travail de la phase suivante, encore en essai : la `0.4.0` (phases 1 à 4 validées) contient déjà le mode courses de la phase 5, qui deviendra la `0.5.0` après l'essai en magasin. Le calcul automatique donne le bon numéro tant que la version contient un `feat:` ; sinon, l'imposer (`npm run release -- 0.5.0`).

Versions publiées : voir le tableau de [09](09-plan-de-developpement.md#versions-publiées). L'historique git a été repris à zéro le 12 novembre 2026 (un seul commit pour les phases 1 à 5) : les anciennes `0.1.0` et `0.3.0` n'existent plus, la première version de l'historique actuel est la `0.4.0`.

Pourquoi une 0.9 en production plutôt qu'en préproduction : la validation en usage réel demande une version **figée** dont on **garde les données** ; la préproduction change à chaque fusion sur `dev` et a ses propres données (§ 4).

### Publier une version (figer) — `npm run release`

Depuis `dev`, à jour, sans modification en cours, et seulement **sur demande explicite** :

1. Le script calcule la version (ou prend celle imposée) et vérifie que ses nouveautés sont écrites. `npm run release -- --dry-run` affiche la version sans rien modifier.
2. Il lance tous les contrôles : format, lint, types, tests unitaires et E2E.
3. Il fige la version : `package.json`, commit `chore: version 1.1.0`, tag `v1.1.0`.
4. Il pousse `dev` (avec le tag), puis avance `main` sur `dev`. Cloudflare construit `main` : **la production est à jour**.

Les téléphones détectent la nouvelle version et proposent la mise à jour (§ 6).

### Revenir en arrière

Cloudflare conserve chaque déploiement : retour à la version précédente en un clic dans le tableau de bord (**Deployments** → déploiement précédent → **Rollback**). Puis correctif sur `dev` et nouvelle version.
