# 07 — Architecture technique

## 1. Principes
- **Application web statique** (HTML/JS/CSS), sans serveur ni base distante. Toutes les données sont dans le navigateur (IndexedDB).
- **Installable** sur l'écran d'accueil de l'iPhone (PWA) et **entièrement hors ligne**.
- **100 % gratuit** : bibliothèques open source, API natives du navigateur, hébergement statique gratuit.
- **Logique métier isolée** dans des fonctions pures, testées indépendamment de l'interface.

## 2. Stack

| Besoin | Choix | Licence | Pourquoi |
|---|---|---|---|
| Build, serveur de dev | **Vite** | MIT | Standard actuel, rapide |
| Interface | **React 19 + TypeScript** (strict) | MIT | Écosystème le plus large, très bien maîtrisé par les agents IA |
| Styles | **Tailwind CSS v4** | MIT | Tokens de couleurs (05 § 2) en variables CSS, itération rapide |
| Composants | **shadcn/ui** (Radix UI, Vaul pour les panneaux glissants) | MIT | Composants accessibles copiés dans le projet, entièrement stylables |
| Routage | **React Router 7**, historique par hash (`#/…`) | MIT | Simple ; le hash évite toute configuration serveur sur un hébergement statique |
| Stockage | **Dexie.js** + `dexie-react-hooks` | Apache 2.0 | IndexedDB avec requêtes réactives (`useLiveQuery`), index, transactions, migrations |
| État d'interface | État React local + contexte. **Zustand** seulement si le besoin apparaît | MIT | Les données métier vivent dans Dexie, pas dans un store global |
| Recherche | Implémentation maison dans `domain/` | — | ~600 articles : pas besoin de bibliothèque ; contrôle total des règles (accents, pluriels) |
| Glisser-déposer | **dnd-kit** | MIT | Réordonner les rayons, compatible tactile |
| Animations, gestes | **Motion** | MIT | Animations de listes, glissements (swipe) |
| Icônes interface | **lucide-react** | ISC | — |
| Icônes articles | **Fluent Emoji Flat** via `@iconify-json/fluent-emoji-flat` | MIT | Pack extrait au build (05 § 4) |
| Compression du lien de partage | **lz-string** | MIT | Données de la liste dans l'URL |
| PWA | **vite-plugin-pwa** (Workbox) | MIT | Manifest, service worker, cache hors ligne, mise à jour |
| Police | **Nunito** via `@fontsource/nunito` | OFL | Embarquée, hors ligne |
| Tests | **Vitest**, **Playwright** | MIT / Apache 2.0 | Voir [08](08-tests-et-qualite.md) |
| Lint / format | **Biome** | MIT | Un seul outil rapide pour lint + format |

Versions : dernières stables au moment de l'initialisation. Node LTS.

## 3. API du navigateur utilisées

Toutes ces API sont **gratuites** : ce sont des fonctions intégrées au navigateur, sans compte ni clé. Règle : **une API n'est utilisée que si elle marche sur Safari iOS** (cible principale) ; Chrome Android (cible secondaire) les supporte toutes.

| API | Usage | Safari iOS (dernière version) | Chrome Android | Décision |
|---|---|---|---|---|
| IndexedDB | Stockage des données | ✅ | ✅ | Utilisée (via Dexie) |
| Service Worker + Cache | Hors ligne | ✅ | ✅ | Utilisée |
| **Screen Wake Lock** | Écran allumé en mode courses (C1) | ✅ y compris app installée (iOS 18.4+) | ✅ | Utilisée ; si indisponible, petit message « Pense à désactiver la mise en veille ». À vérifier sur les deux téléphones en phase 1 |
| Web Share | Partage de liste (F1), export de sauvegarde (H4) | ✅ texte, lien, fichiers | ✅ | Utilisée |
| Clipboard (lecture/écriture) | « Coller une liste partagée » (F2) | ✅ sur action de l'utilisateur (bulle « Coller ») | ✅ (autorisation demandée) | Utilisée |
| `navigator.storage.persist()` | Limiter l'effacement des données | ✅ | ✅ (accordé aux apps installées) | Utilisée, sans effet bloquant si refusée |
| Invite d'installation (`beforeinstallprompt`) | Bouton « Installer » (H5) | ❌ (installation manuelle expliquée) | ✅ | Utilisée sur Android uniquement, simple bonus d'ergonomie |
| Caméra (`getUserMedia`) | Scan code-barres (F3) | ✅ y compris app installée | ✅ | Plus tard |
| `BarcodeDetector` | Scan code-barres | ❌ | ✅ | **Non utilisée** (absente d'iOS) → ZXing (WebAssembly, open source, hors ligne) sur les deux |
| Open Food Facts | Nom/catégorie d'un code-barres inconnu (F3) | Service web gratuit et ouvert (réseau requis) | idem | Plus tard |
| Web Speech (reconnaissance vocale) | Dictée | ⚠️ passe par les serveurs d'Apple, peu fiable en app installée | ✅ | **Non retenue** : le micro du clavier (iOS comme Android) suffit (A7) |
| Vibration | Retour haptique | ❌ | ✅ | **Non retenue** (absente d'iOS) |

## 4. Stockage : points d'attention

**Android (Chrome)** : l'app installée partage ses données avec Chrome pour la même adresse, les liens de l'app s'ouvrent généralement dans l'app installée, et le stockage persistant est accordé aux apps installées. Pas de piège particulier.

**iOS (Safari)** :
1. **Une app installée sur l'écran d'accueil a son propre stockage, séparé de Safari.** Les données saisies dans Safari avant l'installation ne se retrouvent pas dans l'app. → L'écran de premier lancement (04 § 2.11) pousse à installer **avant** toute saisie.
2. **Effacement automatique** : Safari peut effacer les données d'un *site* non visité depuis 7 jours. Une app installée sur l'écran d'accueil n'est pas soumise à cette règle de la même façon (son compteur est lié à son propre usage). → Installation fortement recommandée + rappel de sauvegarde (H4).
3. **Liens** : un lien ouvert depuis Messages s'ouvre dans Safari, jamais dans l'app installée → mécanisme « Coller une liste partagée » (F2).

## 5. Schéma de données

Conventions :
- `id` : `crypto.randomUUID()`, jamais modifié.
- `createdAt`, `updatedAt` : horodatages (ms).
- Aucune donnée dérivée stockée (ex. « est dans la liste courante » se calcule).
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
  aliases: string[];
  icon?: string;
  favorite: boolean;
  barcodes: string[];        // F3, plus tard
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
  categoryIds: ID[];         // une catégorie dans un seul rayon par magasin
  isUnsorted: boolean;       // rayon "Non classé"
}

interface ArticleAisleOverride { id: ID; storeId: ID; articleId: ID; aisleId: ID }

interface ShoppingList extends Base {
  name: string;
  position: number;
  lastStoreId?: ID;
}

interface ListItem extends Base {
  listId: ID;
  articleId: ID;             // unique par liste
  quantity: number;
  unitId: ID;
  acceptedTypes: string[];   // [] = peu importe
  note?: string;
  status: "todo" | "checked" | "unavailable";
  checkedAt?: number;
  fromRecipes: { recipeId: ID; servings: number }[];
}

interface Recipe extends Base {
  name: string;
  icon?: string;
  servings: number;
  ingredients: {
    articleId: ID; quantity: number; unitId: ID;
    acceptedTypes: string[]; optional: boolean;
  }[];
  steps?: string;
}

interface ShoppingSession { id: ID; listId: ID; storeId: ID; startedAt: number; endedAt?: number }

interface Purchase {          // une ligne cochée lors d'une session
  id: ID; sessionId: ID; storeId: ID; articleId: ID; aisleId: ID;
  quantity: number; unitId: ID; at: number;
}

interface Settings {
  animations: "auto" | "always" | "never";
  compact: boolean;
  checkedBehavior: "sink" | "hide";
  lastBackupAt?: number;
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
  articles:   "id, &slug, categoryId, favorite, *barcodes, catalogKey",
  stores:     "id",
  aisles:     "id, storeId",
  overrides:  "id, [storeId+articleId]",
  lists:      "id, position",
  items:      "id, listId, &[listId+articleId], articleId",
  recipes:    "id",
  sessions:   "id, storeId, startedAt",
  purchases:  "id, sessionId, storeId, articleId, at",
  meta:       "key",         // settings, version du schéma de données
});
```
Toute évolution du schéma = nouvelle `version(n)` + fonction `upgrade` + test de migration.

## 6. Hors ligne et mises à jour (PWA)
- Manifest : nom, icônes (dont `apple-touch-icon` 180×180), `display: standalone`, couleurs `#131019`.
- `<meta name="viewport" content="…, viewport-fit=cover">` + gestion des `safe-area-inset-*`.
- Service worker : précache de toute l'app (JS, CSS, police, pack d'icônes).
- Mise à jour : quand une nouvelle version est disponible, bandeau « Nouvelle version — Recharger » (jamais de rechargement forcé en plein magasin).

## 7. Algorithmes (dans `src/domain/`, fonctions pures)

### 7.1 `slugify(label)` et `searchKey(label)`
Règles en [02 § 1](02-modele-metier.md#1-libellé-identifiant-et-slug). `searchKey` = `slugify` puis suppression d'un `s`/`x` final de chaque mot de plus de 3 lettres.

### 7.2 `searchArticles(query, articles, stats)`
- Normalise la requête avec `searchKey`.
- Score : libellé commençant par la requête > un mot commençant par la requête > alias > contient la requête > faute de frappe d'une lettre (mots de 5 lettres et plus).
- Départage par fréquence d'achat, puis ordre alphabétique (`Intl.Collator('fr')`).

### 7.3 `parseEntry(text, units)` → `ParsedEntry[]`
1. Découpe en segments sur `,` `;` ` et ` et retours à la ligne.
2. Pour chaque segment : retire les partitifs (`du`, `de la`, `des`, `d'`, `de`) ; détecte une quantité (chiffres avec virgule ou point, nombres en lettres jusqu'à vingt, `douzaine`, `demi-douzaine`), avant ou après (`x3`, `*3`) ; détecte une unité (slug, abréviation, alias, pluriel des unités **de l'utilisateur**) collée ou non au nombre.
3. Retourne `{ text, quantity?, unitSlug? }`.
4. Résolution ensuite (hors parsing) : recherche de l'article sur le texte complet, puis sur des préfixes de plus en plus courts ; les mots restants sont comparés aux **types** de l'article trouvé (`pommes gala` → *Pommes* + type *Gala*).

### 7.4 `effectiveAisle(article, store, aisles, overrides)`
Ordre de priorité en [02 § 4](02-modele-metier.md#rayon-effectif-dun-article-dans-un-magasin).

### 7.5 `groupListForStore(items, articles, store, aisles, overrides)` → `AisleGroup[]`
Groupes par rayon effectif, rayons triés par `position` (« Non classé » en dernier) ; dans un groupe : lignes `todo` puis `checked` puis `unavailable`, chacune triée par ordre appris puis alphabétique.

### 7.6 Apprentissage de l'ordre des rayons
À la clôture d'une session, si le magasin n'est pas verrouillé :
1. Pour chaque rayon ayant au moins un achat : horodatage **médian** de ses achats (robuste aux allers-retours).
2. Rang des rayons selon ces médianes, normalisé en `r ∈ [0, 1]`.
3. Nouvelle position : `0,6 × ancienne + 0,4 × r` (rayon jamais classé : `r`).
4. Rayons non visités : inchangés.

Ordre manuel (glisser-déposer) : positions réparties uniformément sur [0, 1].

### 7.7 Suggestions anti-oubli (D1)
Pour chaque article acheté au moins 3 fois : intervalle médian `I` entre achats, dernier achat `t`. Suggéré si `maintenant − t ≥ 0,9 × I`, absent de la liste et non écarté. Classement par `(maintenant − t) / I` décroissant ; 5 maximum.

### 7.8 Quantités
- `convert(q, from, to)` : seulement si même dimension ≠ `other`, via les facteurs.
- `mergeQuantity(existing, added)` : même unité → somme ; convertible → somme dans l'unité existante ; sinon → `incompatible` (l'interface demande).
- `scaleRecipe(recipe, servings)` : `q × servings ÷ recipe.servings`, arrondi **au pas supérieur** : `ceil(q / step − 1e-9) × step`.
- Affichage : virgule décimale, zéros inutiles supprimés (`1,5 kg`, `× 3`, `2 boîtes`).

### 7.9 Partage (F1/F2)
- Format : `{ v: 1, kind: "list", name, items: [{ article: { key?, slug, name, category: { slug, name, color }, unit: { slug, singular, plural, abbr, dimension, factor, step }, types, icon }, quantity, unitSlug, acceptedTypes, note }] }`.
- Encodage : JSON → `lz-string` (`compressToEncodedURIComponent`) → `https://<hébergement>/#/import?d=…`. Les données sont dans le fragment `#`, qui n'est jamais envoyé au serveur d'hébergement.
- Import : `resolveImport(payload, db)` → liste de décisions (reconnu / à confirmer / à créer) selon l'ordre de [02 § 9](02-modele-metier.md#import-chez-le-destinataire), affichées dans l'aperçu, puis appliquées dans une seule transaction.

### 7.10 Réglage des animations
`<MotionConfig reducedMotion>` : *Automatique* → `"user"`, *Toujours* → `"never"`, *Jamais* → `"always"` + classe CSS globale désactivant transitions et animations CSS.

## 8. Arborescence
```
ShoppingList/
├─ README.md                  # présentation du projet (utilisateurs)
├─ CLAUDE.md                  # consignes pour l'agent IA
├─ docs/                      # cette documentation (développeurs)
├─ public/                    # icônes de l'app, apple-touch-icon
├─ scripts/
│  └─ build-icon-pack.ts      # extrait le pack d'icônes + mots-clés FR
├─ src/
│  ├─ app/                    # point d'entrée, routes, layout, onglets
│  ├─ features/
│  │  ├─ list/                # liste, lignes, barre d'ajout, fiche ligne
│  │  ├─ shopping/            # mode courses, wake lock, récapitulatif
│  │  ├─ catalog/             # grille catégories / articles, habituels
│  │  ├─ recipes/             # recettes, ajout à une liste
│  │  ├─ manage/              # articles, catégories, magasins/rayons, unités
│  │  ├─ share/               # partage, import, aperçu
│  │  ├─ settings/            # réglages, sauvegarde, premier lancement
│  │  └─ suggestions/         # anti-oubli
│  ├─ domain/                 # fonctions pures (§ 7) — aucun import React ni Dexie
│  ├─ db/                     # schéma Dexie, migrations, accès aux données, initialisation
│  ├─ data/                   # données initiales (06)
│  ├─ ui/                     # composants partagés (shadcn + ProductIcon, AisleHeader…)
│  ├─ icons/                  # pack d'icônes, résolution en cascade, monogramme
│  └─ i18n/fr.ts              # tous les textes de l'interface
└─ tests/
   ├─ unit/                   # Vitest
   └─ e2e/                    # Playwright
```

## 9. Hébergement et déploiement
- Dépôt **public** `Jyhem2000/ShoppingList` → **GitHub Pages** (gratuit), déployé par GitHub Actions à chaque push sur `main` si la CI est verte.
- Adresse : `https://jyhem2000.github.io/ShoppingList/` (Vite : `base: "/ShoppingList/"`).
- HTTPS fourni (indispensable pour le service worker et le Wake Lock).
- Le dépôt étant public, ne jamais y mettre de données personnelles (les données de l'app restent sur les téléphones, rien n'est envoyé au dépôt).
