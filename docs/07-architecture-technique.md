# 07 — Architecture technique

## 1. Principes
- **Application web statique** (HTML/JS/CSS), sans serveur ni base distante. Toutes les données sont dans le navigateur (IndexedDB).
- **Installable** sur l'écran d'accueil (PWA) et **entièrement hors ligne**.
- **100 % gratuit** : bibliothèques open source, fonctionnalités natives du navigateur, hébergement statique gratuit.
- **Logique métier isolée** dans des fonctions pures, testées indépendamment de l'interface.

## 2. Stack

| Besoin | Choix | Licence | Pourquoi |
|---|---|---|---|
| Build, serveur de dev | **Vite** | MIT | Standard actuel, rapide |
| Interface | **React 19 + TypeScript** (strict) | MIT | Écosystème le plus large, très bien maîtrisé par les agents IA |
| Styles | **Tailwind CSS v4** | MIT | Tokens de couleurs (05 § 2) en variables CSS, itération rapide |
| Composants | **shadcn/ui** (Radix UI, Vaul pour les panneaux glissants) | MIT | Composants accessibles copiés dans le projet, entièrement stylables |
| Routage | **React Router 7**, historique par hash (`#/…`) | MIT | Simple ; aucune configuration serveur sur un hébergement statique |
| Stockage | **Dexie.js** + `dexie-react-hooks` | Apache 2.0 | IndexedDB avec requêtes réactives (`useLiveQuery`), index, transactions, migrations |
| État d'interface | État React local + contexte. **Zustand** seulement si le besoin apparaît | MIT | Les données métier vivent dans Dexie, pas dans un store global |
| Recherche | Implémentation maison dans `domain/` | — | ~1 000 articles : pas besoin de bibliothèque ; contrôle total des règles (accents, pluriels, alias) |
| Glisser-déposer | **dnd-kit** | MIT | Réordonner les rayons, compatible tactile |
| Animations, gestes | **Motion** | MIT | Animations de listes, glissements (swipe) |
| Sons | **Web Audio API** (native) + sons CC0 | — | Voir 05 § 7 |
| Icônes interface | **lucide-react** | ISC | — |
| Icônes articles | **Fluent Emoji Flat** via `@iconify-json/fluent-emoji-flat` | MIT | Pack extrait au build (05 § 4) |
| Compression du lien de partage | **lz-string** | MIT | Données de la liste dans l'URL (v1.3) |
| PWA | **vite-plugin-pwa** (Workbox) | MIT | Manifest, service worker, cache hors ligne, mises à jour (§ 6) |
| Police | **Nunito** via `@fontsource/nunito` | OFL | Embarquée, hors ligne |
| Tests | **Vitest**, **Playwright** | MIT / Apache 2.0 | Voir [08](08-tests-et-qualite.md) |
| Lint / format | **Biome** | MIT | Un seul outil rapide pour lint + format |
| Déploiement | **Cloudflare Pages** + **Wrangler** depuis GitHub Actions | gratuit | Voir § 9 |

Versions des bibliothèques : dernières stables au moment de l'initialisation. Node LTS.

## 3. Fonctionnalités du navigateur

Toutes ces fonctionnalités sont **gratuites** : elles sont intégrées au navigateur, sans compte ni clé.

Rappel ([01](01-vision.md#plateformes-cibles)) : sur iPhone, **tous les navigateurs et l'app installée utilisent WebKit** ; la colonne « iPhone » vaut donc pour Chrome iPhone comme pour Safari. Règle : *essentiel* = doit marcher sur les deux ; *confort* = au moins un des deux, sans rien casser ailleurs (détection systématique avant usage).

| Fonctionnalité | Usage | iPhone (WebKit) | Android (Chrome) | Rôle | Décision |
|---|---|---|---|---|---|
| IndexedDB | Stockage | ✅ | ✅ | Essentiel | Utilisée (Dexie) |
| Service Worker + Cache | Hors ligne, mises à jour | ✅ | ✅ | Essentiel | Utilisée |
| Screen Wake Lock | Écran allumé en mode courses (C1) | ✅ (app installée : iOS 18.4+) | ✅ | Essentiel | Utilisée ; message de repli si indisponible |
| Web Audio | Sons (H6) | ✅ (après un premier geste) | ✅ | Confort | Utilisée |
| Web Share | Export de sauvegarde (H4), partage (F1) | ✅ texte, lien, fichiers | ✅ | Essentiel | Utilisée |
| Clipboard | « Coller une liste partagée » (F2) | ✅ sur geste de l'utilisateur | ✅ | Essentiel (v1.3) | Utilisée |
| `navigator.storage.persist()` | Limiter l'effacement des données | ✅ | ✅ | Confort | Utilisée |
| **Vibration** | Retour haptique (H7) | ❌ | ✅ | Confort | **Utilisée sur Android**, absente sans erreur sur iPhone |
| `beforeinstallprompt` | Bouton « Installer » (H5) | ❌ (installation manuelle expliquée) | ✅ | Confort | Utilisée sur Android |
| Caméra (`getUserMedia`) | Scan code-barres (I1) | ✅ | ✅ | Idée | Plus tard |
| `BarcodeDetector` | Scan code-barres (I1) | ❌ | ✅ | Idée | Native si présente, sinon ZXing |
| Web Speech (reconnaissance vocale) | Dictée | ⚠️ peu fiable en app installée | ✅ | — | **Non retenue** : le micro du clavier fait la même chose partout (A7) |

## 4. Stockage : points d'attention

**Android (Chrome)** : l'app installée partage ses données avec Chrome pour la même adresse, les liens de l'app s'ouvrent généralement dans l'app installée, et le stockage persistant est accordé aux apps installées.

**iPhone** :
1. **L'app installée sur l'écran d'accueil a son propre stockage**, séparé de celui de Chrome (et de Safari). Les données saisies dans le navigateur avant l'installation ne se retrouvent pas dans l'app. → L'écran de premier lancement (04 § 2.11) pousse à installer **avant** toute saisie.
2. **Effacement automatique** : WebKit peut effacer les données d'un *site* non visité depuis 7 jours ; une app installée n'est pas concernée de la même façon (son compteur dépend de son propre usage). → Installation fortement recommandée + rappel de sauvegarde (H4).
3. **Liens** : un lien ouvert depuis Messages s'ouvre dans le navigateur, jamais dans l'app installée → mécanisme « Coller une liste partagée » (F2).

**Partout** : chaque adresse (production, préproduction, aperçus — § 9) est une app distincte avec ses propres données. Installer la préproduction pour tester n'affecte pas l'app de production.

## 5. Schéma de données

Conventions :
- `id` : `crypto.randomUUID()`, jamais modifié.
- `createdAt`, `updatedAt` : horodatages (ms).
- Aucune donnée dérivée stockée (« est dans la liste courante », fréquences d'achat… se calculent).
- Le libellé d'un article n'est jamais recopié ailleurs (lignes, ingrédients, historique pointent vers l'`id`).

```ts
type ID = string;
interface Base { id: ID; createdAt: number; updatedAt: number }

type Dimension = "mass" | "volume" | "other";

interface Unit extends Base {
  slug: string;              // unique
  singular: string;          // "kilogramme"
  plural: string;            // "kilogrammes"
  abbr?: string;             // "kg" ; absent = affichage "× n"
  dimension: Dimension;
  factor?: number;           // vers l'unité de base de la dimension (g, ml)
  step: number;              // pas des boutons +/− et de l'arrondi
  aliases: string[];         // pour l'analyse de saisie : ["kilo", "kilos"]
  catalogKey?: string;
}

interface Category extends Base {
  slug: string;              // unique
  name: string;
  icon?: string;             // nom d'icône du pack
  color: string;             // nom de la palette (05 § 2) : "sauge"
  useIconAsFallback: boolean;
  isSystem: boolean;         // "Autres"
  catalogKey?: string;
}

interface Article extends Base {
  slug: string;              // unique, recalculé au renommage
  name: string;
  categoryId: ID;
  defaultUnitId: ID;
  types: string[];           // [] par défaut
  aliases: string[];         // slugifiés pour la comparaison
  icon?: string;
  favorite: boolean;
  seasonMonths?: number[];   // plus tard (D3) : 1..12
  barcodes: string[];        // idée I1
  notDuplicateOf: ID[];      // paires écartées de la détection de doublons
  catalogKey?: string;
}

interface Store extends Base {
  name: string;
  orderLocked: boolean;
  lastUsedAt?: number;
}

interface Aisle extends Base {
  storeId: ID;
  name: string;
  icon?: string;
  color: string;
  position: number;          // score 0..1, appris ou manuel ; tri croissant
  categories: { categoryId: ID; primary: boolean }[];
  isUnsorted: boolean;       // rayon "Non classé"
}
// Invariant : dans un magasin, une catégorie a au plus UN rayon où primary = true.

interface ArticleAisleOverride { id: ID; storeId: ID; articleId: ID; aisleId: ID }

interface ShoppingList extends Base {
  name: string;
  position: number;
  lastStoreId?: ID;
}

interface ListItem extends Base {
  listId: ID;
  articleId: ID;             // unique par liste (hors lignes archivées)
  quantity: number;
  unitId: ID;
  acceptedTypes: string[];   // [] = peu importe
  note?: string;
  status: "todo" | "checked" | "unavailable";
  checkedAt?: number;
  closedInSessionId?: ID;    // ligne achetée et clôturée : masquée, restaurée si réouverture
  fromRecipes: { recipeId: ID; amount: number }[];
}

interface Recipe extends Base {
  name: string;
  icon?: string;
  yield: { quantity: number; unit: string };   // { 4, "personnes" } ou { 1, "cake" }
  ingredients: {
    articleId: ID; quantity: number; unitId: ID;
    acceptedTypes: string[]; optional: boolean;
  }[];
  steps?: string;
}

interface ShoppingSession {
  id: ID; listId: ID; storeId: ID;
  startedAt: number;
  status: "open" | "closed";
  closedAt?: number;
  learningSnapshot?: {       // état avant application de l'apprentissage, pour la réouverture
    aislePositions: Record<ID, number>;
    articleOrder: Record<ID, number>;
  };
}

interface Purchase {          // une ligne cochée lors d'une session
  id: ID; sessionId: ID; storeId: ID; articleId: ID; aisleId: ID;
  quantity: number; unitId: ID; at: number;
}

interface Settings {
  animations: "auto" | "always" | "never";
  sounds: boolean;
  haptics: boolean;
  compact: boolean;
  simplifyQuantities: boolean;
  checkedBehavior: "sink" | "hide";
  lastBackupAt?: number;
  lastSeenVersion?: string;  // pour afficher « Quoi de neuf »
  catalogVersion: number;
  currentListId?: ID;
  dismissedSuggestions: { articleId: ID; until: number }[];
}
```

### Tables Dexie
```ts
db.version(1).stores({
  units:      "id, &slug",
  categories: "id, &slug",
  articles:   "id, &slug, *aliases, categoryId, favorite, *barcodes, catalogKey",
  stores:     "id",
  aisles:     "id, storeId",
  overrides:  "id, [storeId+articleId]",
  lists:      "id, position",
  items:      "id, listId, articleId, closedInSessionId",
  recipes:    "id",
  sessions:   "id, listId, storeId, status, startedAt",
  purchases:  "id, sessionId, storeId, articleId, at",
  meta:       "key",         // settings, version du catalogue…
});
```
- Unicité « un article par liste » vérifiée par la couche d'accès aux données (les lignes archivées `closedInSessionId` sont exclues).
- **La version du schéma de données est indépendante de la version de l'app** : elle n'augmente que si la structure change. Toute évolution = nouvelle `version(n)` + fonction `upgrade` + test de migration. Les migrations s'exécutent automatiquement au premier lancement de la nouvelle version.

## 6. App installée, hors ligne et mises à jour

### L'app installée est-elle locale ou sur le web ?
**Locale.** Une PWA est un site web dont **tous les fichiers sont copiés sur le téléphone** par le *service worker* lors de la première visite. Ensuite :
- l'app s'ouvre depuis cette copie locale, **même sans réseau** ;
- les données (listes, articles…) sont dans IndexedDB, **sur le téléphone uniquement** ; rien n'est jamais envoyé au serveur d'hébergement ;
- le web ne sert qu'à **récupérer les nouvelles versions** de l'app.

### Comment fonctionnent les mises à jour ?
1. À chaque ouverture de l'app, au retour au premier plan et toutes les heures, le navigateur vérifie discrètement si le fichier du service worker a changé sur le serveur. Ce fichier contient la liste de tous les fichiers de l'app avec une empreinte de leur contenu : **la moindre modification déployée est détectée** (ce n'est pas le numéro de version qui est comparé).
2. Si une nouvelle version existe, elle est **téléchargée en arrière-plan**, sans interrompre l'utilisation.
3. L'app affiche « Version 1.2.0 disponible — Mettre à jour » (mode `prompt` de vite-plugin-pwa). Jamais en mode courses, jamais de rechargement forcé.
4. Au tap : activation de la nouvelle version, rechargement, migrations de données éventuelles, puis « Quoi de neuf » (comparaison avec `lastSeenVersion`).
5. Hors ligne : l'app continue avec la version déjà installée ; la mise à jour attendra le retour du réseau.

### Manifest et iOS
- Manifest : nom, icônes (dont `apple-touch-icon` 180×180 et icône adaptative Android), `display: standalone`, couleurs `#131019`.
- `<meta name="viewport" content="…, viewport-fit=cover">` + gestion des `safe-area-inset-*`.
- Précache de toute l'app : JS, CSS, police, pack d'icônes, sons.

## 7. Algorithmes (dans `src/domain/`, fonctions pures)

### 7.1 `slugify(label)` et `searchKey(label)`
Règles en [02 § 1](02-modele-metier.md#1-libellé-identifiant-et-slug). Implémentation : `toLowerCase('fr')` → `normalize('NFD')` → retrait de `̀-ͯ` → ligatures → remplacement de `[^\p{L}\p{N}]+` par `-` (expression régulière avec le drapeau `u`) → nettoyage des tirets. `searchKey` = `slugify` puis suppression d'un `s`/`x` final de chaque mot de plus de 3 lettres (règle propre au français, appliquée uniquement aux mots en alphabet latin).

### 7.2 `searchArticles(query, articles, stats)`
- Normalise la requête avec `searchKey`, compare aux libellés **et aux alias**.
- Score : libellé commençant par la requête > un mot commençant par la requête > alias > contient la requête > faute de frappe d'une lettre (mots de 5 lettres et plus).
- Départage par fréquence d'achat, puis ordre alphabétique (`Intl.Collator('fr')`).

### 7.3 `parseEntry(text, units)` → `ParsedEntry[]`
1. Découpe en segments sur `,` `;` ` et ` et retours à la ligne.
2. Pour chaque segment : retire les partitifs (`du`, `de la`, `des`, `d'`, `de`) ; détecte une quantité (chiffres avec virgule ou point, nombres en lettres jusqu'à vingt, `douzaine`, `demi-douzaine`), avant ou après (`x3`, `*3`) ; détecte une unité (slug, abréviation, alias, pluriel des unités **de l'utilisateur**) collée ou non au nombre.
3. Retourne `{ text, quantity?, unitSlug? }`.
4. Résolution ensuite (hors parsing) : recherche de l'article sur le texte complet, puis sur des préfixes de plus en plus courts ; les mots restants sont comparés aux **types** de l'article trouvé (`pommes gala` → *Pommes* + type *Gala*).

### 7.4 `effectiveAisle(article, store, aisles, overrides)`
Exception de l'article → rayon **principal** de sa catégorie → « Non classé » ([02 § 4](02-modele-metier.md#rayon-effectif-dun-article-dans-un-magasin)).

### 7.5 `groupListForStore(items, articles, store, aisles, overrides)` → `AisleGroup[]`
Groupes par rayon effectif, rayons triés par `position` (« Non classé » en dernier) ; dans un groupe : lignes `todo` puis `checked` puis `unavailable`, chacune triée par ordre appris puis alphabétique. Lignes archivées exclues.

### 7.6 Clôture, apprentissage et réouverture
**Clôture** (`closeSession`), dans une seule transaction :
1. Enregistrer `learningSnapshot` (positions actuelles des rayons du magasin et ordre des articles).
2. Si le magasin n'est pas verrouillé, appliquer l'apprentissage à partir de **tous** les achats de la session :
   - pour chaque rayon ayant au moins un achat : horodatage **médian** de ses achats (robuste aux allers-retours) ;
   - rang des rayons selon ces médianes, normalisé en `r ∈ [0, 1]` ;
   - nouvelle position : `0,6 × ancienne + 0,4 × r` (rayon jamais classé : `r`) ; rayons non visités inchangés ;
   - même principe pour l'ordre des articles dans chaque rayon.
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
- `scaleRecipe(recipe, amount)` : `q × amount ÷ recipe.yield.quantity`, arrondi **au pas supérieur** : `ceil(q / step − 1e-9) × step`, puis `simplify`.
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
`<MotionConfig reducedMotion>` : *Automatique* → `"user"`, *Toujours* → `"never"`, *Jamais* → `"always"` + classe CSS globale désactivant transitions et animations CSS.

### 7.11 Sons et vibrations
Un module `feedback` unique (`feedback.check()`, `feedback.aisleDone()`…) qui joue le son (si activé) et vibre (si activé **et** `"vibrate" in navigator`). Aucun appel direct aux API ailleurs dans le code.

## 8. Arborescence
```
ShoppingList/
├─ README.md                  # présentation du projet (utilisateurs)
├─ CHANGELOG.md               # journal des versions (source du « Quoi de neuf »)
├─ CLAUDE.md                  # consignes pour l'agent IA
├─ docs/                      # cette documentation (développeurs)
├─ .github/workflows/         # CI et déploiements (§ 9)
├─ public/                    # icônes de l'app, sons
├─ scripts/
│  └─ build-icon-pack.ts      # extrait le pack d'icônes + mots-clés FR
├─ src/
│  ├─ app/                    # point d'entrée, routes, layout, onglets, mise à jour
│  ├─ features/
│  │  ├─ list/                # liste, lignes, barre d'ajout, fiche ligne
│  │  ├─ shopping/            # mode courses, wake lock, clôture, réouverture
│  │  ├─ catalog/             # grille catégories / articles, habituels
│  │  ├─ recipes/             # recettes, ajout à une liste (v1.1)
│  │  ├─ suggestions/         # anti-oubli (v1.2)
│  │  ├─ share/               # partage, import, aperçu (v1.3)
│  │  ├─ manage/              # articles, catégories, magasins/rayons, unités
│  │  └─ settings/            # réglages, sauvegarde, premier lancement, à propos
│  ├─ domain/                 # fonctions pures (§ 7) — aucun import React ni Dexie
│  ├─ db/                     # schéma Dexie, migrations, accès aux données, initialisation
│  ├─ data/                   # données initiales (06)
│  ├─ ui/                     # composants partagés (shadcn + ProductIcon, AisleHeader…)
│  ├─ icons/                  # pack d'icônes, résolution en cascade, monogramme
│  ├─ feedback/               # sons et vibrations
│  ├─ i18n/fr.ts              # tous les textes de l'interface
│  └─ version.ts              # expose version, commit, canal (injectés au build)
└─ tests/
   ├─ unit/                   # Vitest
   └─ e2e/                    # Playwright
```

## 9. Hébergement, versions et déploiement

### Hébergement
**Cloudflare Pages** (gratuit), dépôt public `Jyhem2000/ShoppingList`. Déploiement piloté par **GitHub Actions** avec Wrangler (un jeton d'API Cloudflare stocké dans les secrets GitHub, gratuit) plutôt que par l'intégration Git automatique de Cloudflare : ainsi **rien n'est déployé si la CI échoue**.

### Trois environnements
| Environnement | Déclencheur | Adresse | Usage |
|---|---|---|---|
| **Aperçu** | chaque pull request | `<branche>.<projet>.pages.dev` | Tester une phase sur les téléphones avant fusion |
| **Préproduction** | chaque push sur `main` | `main.<projet>.pages.dev` | Dernier état intégré, pour tes essais quotidiens |
| **Production** | push d'un tag `vX.Y.Z` | `<projet>.pages.dev` (ou domaine perso plus tard) | **L'app installée au quotidien**, figée sur une version |

Le nom exact du projet Cloudflare (`shoppinglist` ou proche) est fixé à la création. Avant la v1.0, seuls l'aperçu et la préproduction existent.

### Numéro de version
- Format **SemVer** `MAJEUR.MINEUR.CORRECTIF` : `1.0.0`, `1.1.0` (recettes), `1.0.1` (correctif).
- **Source unique : `version` dans `package.json`.** Pas de fichier de version maintenu à la main.
- Au build, Vite injecte des constantes (`define`) lues par `src/version.ts` : version, empreinte du commit, date, canal (`production` / `main` / `preview`). Hors production, l'app affiche par exemple `1.1.0-dev · a1b2c3d · main`.
- `CHANGELOG.md` : une section par version, rédigée au fil de l'eau ; la section de la version courante alimente l'écran « Quoi de neuf ».

### Publier une version (figer)
1. Sur `main` à jour et vert : compléter la section de la version dans `CHANGELOG.md`.
2. `npm version minor` (ou `patch` / `major`) : met à jour `package.json`, crée le commit `chore: version 1.1.0` et le tag `v1.1.0`.
3. `git push --follow-tags`.
4. La CI du tag : lint, types, tests unitaires et E2E, build, **déploiement en production**, création d'une *Release* GitHub avec la section du journal.

Les téléphones détectent la nouvelle version et proposent la mise à jour (§ 6).

### Revenir en arrière
Cloudflare conserve chaque déploiement : retour à la version précédente en un clic dans le tableau de bord, ou relance manuelle du workflow de production sur un tag antérieur.
