# Simplification du code (1.0.x)

Relecture du 17 novembre 2026 : `/simplify` sur tout `src/`, quatre angles en parallèle (réutilisation, simplification, efficacité, altitude). Ce n'est pas une chasse aux bugs (voir [audit-1.0.1.md](audit-1.0.1.md)) : aucun changement de comportement attendu, sauf mention.

Bilan : les règles de `CLAUDE.md` tiennent (aucun dossier de `src/features` n'en importe un autre, `src/common` n'importe pas `src/features`, `src/domain` sans React ni Dexie, aucune couleur en dur, aucun texte hors `fr.ts`). Une seule entorse : `src/ui` importe `src/app` (B9). Les constats portent sur des règles écrites trop haut (dans un écran ou dans `src/db` au lieu de `src/domain`), des petites aides recopiées, des composants refaits à la main, et du travail refait à chaque lettre tapée ou à chaque coche.

Une passe = une session (« passe simplification B », etc.). On coche au fur et à mesure ; `npm run check`, `npm run e2e` et vérification en taille téléphone à la fin de chaque passe.

## A. Petits nettoyages ✅ (faits le 17 novembre 2026)

1. [x] `src/domain/share.ts` : `isObject` partout dans `validShared` ; `findCategory` et `findUnit` passent par une seule fonction.
2. [x] `capitalize` déplacé dans `src/domain/slug.ts`, plus de copie dans `CreateArticleSheet`.
3. [x] `MoveAisleSheet` trie les rayons par `sortAisles`.
4. [x] `useShoppingView` : champs `unplacedAfter` (toujours `placing?.id`) et `passed` (jamais lu) retirés.
5. [x] « À placer » du mode courses par `groupListByCategory` (au lieu d'une copie en O(catégories × lignes)) ; `catalogOrder` de `src/common/format.ts` dans `ShoppingPage` et `CatalogPage`.
6. [x] `sortCategories` : rang du catalogue par une table, plus d'`indexOf` dans le comparateur.
7. [x] `uncheckItem` et `markUnavailable` (`src/db/sessions.ts`) partagent une seule fonction.
8. [x] `ArticlesPage` : les doublons probables ne se recalculent plus à chaque lettre tapée.
9. [x] `RecapPage` : la requête des lignes introuvables ne dépend plus que de la liste, pas de chaque écriture dans la session.
10. [x] Code mort : `previewRecipeAdd` et `recipesUsing` (`src/db/recipes.ts`), servis seulement par les tests ; tests passés à `planRecipeAdd` et `articleUsage`.

## B. Règles au bon niveau (domaine) ✅ (faites le 17 novembre 2026)

1. [x] **Vue des courses dans le domaine** : `buildShoppingView` et `checkAction` (placer ou cocher, `lastOfAisle`) dans `src/domain/shopping.ts`, testés en unitaire ; `useShoppingView.ts` supprimé, un `useMemo` dans `ShoppingPage`. `aisleResolver` (`src/domain/aisles.ts`) construit une fois les tables exception / rayon principal / « Non classé » ; `effectiveAisle` et `groupListForStore` passent par lui. Seul changement visible : « rayon terminé » (son) ne compte plus les lignes restées dans « À placer » (elles seront rangées ailleurs) ; celles de « À récupérer » comptent toujours.
2. [x] **Rayons** : `DEFAULT_AISLE_STYLE`, `newAisle`, `primaryAisleOf`, `isFreshEmptyAisle` et `withPrimaryCategory` (adoption de l'icône de la catégorie) dans `src/domain/stores.ts` ; `addAisle` sans paramètre de style. `storeAisles` et `setArticleOverride` (`src/db/stores.ts`) servent `placeAndCheck` et `moveArticle`, qui passe par `setAisleCategoryRole` pour la portée « catégorie ». `closeSession` ne relit plus les rayons ; `deleteAisle` construit ses tables une fois (`aisleResolver`).
3. [x] **`reopenSession`** appelle `canReopen` (règle « même jour » comprise, paramètre `now`).
4. [x] **`mergeTypes`** (dédoublonne aussi les types ajoutés entre eux ; un type sans slug, « 🌶️ », est comparé par son texte) et **`addAlias`** dans `src/domain/slug.ts` ; `mergedArticleFields` n'a plus de paramètre `slugify`.
5. [x] **Replis** : `othersCategory` / `OTHERS_CATEGORY` dans `src/domain/categories.ts` ; `pieceUnit` / `PIECE_UNIT` dans `src/domain/quantity.ts` (avec les unités plutôt qu'avec les catégories) ; `unitByKey` (clé du catalogue, puis slug) dans `quantity.ts` ; `suggestedUnitKey` dans `src/common/format.ts`.
6. [x] **Petites aides** : `activeItems` dans `src/db/items.ts` ; `parseNumber` (`quantity.ts`) ; `formatDate` (`src/common/time.ts`) ; `compareText` et `byName` (`slug.ts`, un seul `Intl.Collator`) ; `byId`, `countBy`, `withMember` dans un nouveau `src/domain/collections.ts` ; tables passées à `ImportChoiceSheet` et `AisleSheet` ; `countTodo` ; `mergeRecipeOrigins` (une recette déjà présente garde sa place) et `mergeNotes` exporté (`listMerge.ts`) ; `joinDetails` (`format.ts`).
7. [x] **Requêtes Dexie** : `useCurrentList`, `useArticleItems`, `useAisleCounts`, `useDataCounts` dans `src/db/hooks.ts` ; `RecapPage` compte ses introuvables avec `useListItems` ; classement des unités habituelles par `usualUnits` (`quantity.ts`).

## C. Composants partagés (`src/ui`, `src/common`) — faite le 18 novembre 2026

1. [x] **`Sheet` : `onClose` au lieu de `open` + `onOpenChange`** — 34 appels sur 35 passent `open` en dur et `onOpenChange={(open) => { if (!open) X(); }}` ; seule la page de démonstration pilote `open`.
2. [x] **`NewArticleSheet` (`ArticlesPage.tsx`) refait `CreateArticleSheet`** (sans mots-clés, sans icône, boutons différents) → utiliser `CreateArticleSheet`. ⚠️ change légèrement l'écran Gérer → Articles : à valider.
3. [x] **Lignes faites à la main** au lieu de `RowButton` / `InfoRow` / `Section` : `UnitsPage` (l. 73), `StorePage` (l. 213), `RecapPage` (l. 101, hauteur 11 au lieu de 12).
4. [x] **Choix de catégorie** (`<Select>` trié par nom) recopié 6 fois → `CategorySelect` (options `exclude`, `placeholder`), voisin d'`UnitSelect`.
5. [x] **Boutons recopiés** : bouton « Ajouter » pleine largeur avec `Plus` ×6 (marges déjà différentes) → `AddButton` ; paire « Fusionner / Supprimer » ×3 (`AisleSheet`, `CategoriesPage`, `ArticlePage`) → `MergeDeleteActions` à côté de `ConfirmActions` ; `ConfirmActions` toujours rouge, refait en or dans « Terminer les courses » → prop `variant` ; style de bouton-icône recopié 7 fois (`ShoppingPage`, `ListHeader`, `StorePage`, `Sheet`, `Toaster`, `Page`) et `className="text-danger"` posé de l'extérieur (`QuantitySheet`) → variantes de `Button`.
6. [x] **En-tête collant recopié** (`ShoppingPage`, `ListHeader`) → `PageHeader` avec `title: ReactNode`, emplacements avant / après et une ligne en dessous (barre de progression).
7. [x] **`src/ui` importe `src/app`** : `Tip.tsx` et `tips.ts` lisent `@/app/preferences` et connaissent les identifiants des astuces → `Tip` reçoit `seen` / `onDismiss` ; `tips.ts` dans `src/app` ou `src/common`.
8. [x] **Glisser-déposer recopié** (`ListsSheet`, `StorePage` : capteurs, `DndContext`, poignée) → `useSortableSensors`, `SortableList`, `DragHandle` dans `src/ui`. `ListsSheet` garde une copie locale de l'ordre (`useState(data.lists)`) que `StorePage` n'a pas : aligner, ou justifier en commentaire.
9. [x] **Saisie d'ingrédients** (`RecipePage` l. 395-427) refait la boucle de `useAddToList` (lire, reconnaître, créer les inconnus) → `useEntryAdder` commun ; `reportSaveError` (importé par 8 fichiers depuis `useAddToList`) à côté de `showToast`.
10. [x] **« Lire le presse-papiers, sinon montrer le champ »** ×2 (`ListMenuSheet`, `RecipesPage`) → `pasteOrAsk` dans `src/common/PasteForm.tsx`.
11. [x] **`paletteColor(x.color)` avant chaque composant** (14 appels) alors que `GroupIcon` accepte la valeur brute → `AisleSection`, `AisleSubgroup`, `ItemRow`, `ProductIcon` normalisent eux-mêmes.
12. [x] **Écrans à alléger** :
    - `ImportPage` : `display` et `outcome` à réunir ; branches liste / recette de l'aperçu ; `then` / `catch` du bouton d'import en double ; deux passes `toCheck` / `known` plus `importSummary` qui recompte ; ternaire à 5 niveaux pour le titre d'erreur → table.
    - `ArticlePage` : `TagEditor` garde sa propre saisie (`onAdd(text)`), `display` par défaut ; mise en forme de la quantité par défaut en double.
    - `StorePage` : `useListData(storeId)` au lieu de 6 hooks et des tables refaites (attention : `useListData` retombe sur le premier magasin) ; un seul état `Panel` au lieu de trois ; `movable.map` au lieu de relire `order`.
    - `LineSheet` et `IngredientSheet` : même `onUnit`.

Ce qui a été fait (18 novembre 2026) :

- `Sheet` toujours ouvert, `onClose` ; la page de démonstration l'affiche ou non.
- C2 (validé) : Réglages → Articles crée par `CreateArticleSheet` : catégorie, unité et icône devinées par les mots-clés, « Annuler », bouton « Créer l'article » (`submitLabel`), sans « Juste cette fois » (`allowOneOff`) ; un article existant est ouvert avec « … existe déjà » (`onCreated` reçoit `existed`).
- `RowButton` / `InfoRow` / `Section` dans `UnitsPage`, `StorePage` (catégories non rattachées) et `RecapPage` (achats : hauteur 12 comme partout, toujours une liste pour le lecteur d'écran).
- `CategorySelect` (`src/ui`, options `exclude`, `placeholder`, `required`) pour les six choix ; il trie toujours par nom (le choix « Déplacer vers » de la suppression d'une catégorie aussi).
- `AddButton` ; `MergeDeleteActions` ; `ConfirmActions` avec `variant` (`gold`) et `cancelLabel` ; variantes `iconMuted`, `iconPrimary`, `iconDanger` de `Button`, styles dans `buttonVariants.ts` (aussi pour `NavButton` et `Dialog.Close`). Le message (toast) garde son appui en `--surface`, sur son fond `--raised`.
- `PageHeader` : `title` texte ou élément, `leading`, `action`, `below` ; `ListHeader` et le mode courses s'en servent (le trait sous l'en-tête des courses n'apparaît plus qu'au défilement, comme ailleurs).
- `Tip` reçoit `show` / `onDismiss` ; `tips.ts` dans `src/app` ; `HelpTip` (`src/features/shopping`, seul à s'en servir) relie les deux.
- `SortableList`, `DragHandle` (`src/ui`) et `useSortableRow` (`src/ui/sortable.ts`) ; l'ordre glissé s'affiche aussitôt dans les deux écrans (plus de copie locale dans `ListsSheet`).
- `useEntryAdder` (`src/common`) pour la liste et les ingrédients (les ingrédients signalent maintenant un échec d'enregistrement) ; `reportSaveError` dans `src/ui/toast.ts`.
- `pasteOrAsk` dans `src/common/paste.ts` (un fichier de composants n'exporte que des composants, et `src/platform` ne fait qu'encapsuler le navigateur).
- `AisleSection`, `AisleSubgroup`, `ItemRow`, `ProductIcon`, `CatalogCard`, `CategoryCard` normalisent la couleur.
- `ImportPage` : un seul `display`, aperçu sans branche liste / recette, un seul `then` / `catch`, `splitImportLines` (domaine) à la place de `importSummary`, table des erreurs. `ArticlePage` : `TagEditor` garde sa saisie, `quantityText`. `StorePage` : un seul état `Panel` ; il garde ses 6 requêtes ciblées (`useListData` le ferait recalculer à chaque changement de la liste courante ou des recettes : écarté à la relecture). `AmountFields` convertit la quantité au changement d'unité (`onUnit` reçoit unité et quantité).

## D. Performances — faite le 19 novembre 2026

1. [x] **Recherche** — `src/domain/search.ts` : chaque lettre tapée refait `searchKey` (normalisation + 6 expressions régulières) sur ~480 noms, ~230 alias et ~350 types, et de même dans `IconPickerSheet` (~3 000 appels) et `findLikelyDuplicates`. → clés préparées une fois par tableau d'articles (`WeakMap`, comme `labelIndex` dans `src/domain/entry.ts`) ; `packData` garde les clés de ses mots-clés et un tri préparé.
2. [x] **Copie du jour** — `src/db/copies.ts` (`takeDailyCopy`) : transaction en écriture sur les 14 tables pendant tout l'export, au premier lancement de la journée → export en lecture seule, écriture limitée à `copies` / `copyBackups`, lancée après le premier affichage.
3. [x] **Dernière session** — `latestSession` (`src/db/sessions.ts`) charge toutes les sessions de la liste pour garder la dernière, à chaque écriture de session → lire seulement la dernière (`orderBy("startedAt").reverse()…first()`). Décidé le 18 novembre 2026 : `startSession` vide le `learningSnapshot` de la session précédente de la liste, qui ne peut plus être rouverte (le stockage et les 7 copies ne grossissent plus à chaque course).
4. [x] **`useListData`** — un seul `useMemo` sur 13 sources : chaque coche reconstruit toutes les tables (articles, unités, catégories, poids) avec de nouvelles identités, donc tout le reste se recalcule → un `useMemo` par table. Abonnements en double dans `ShoppingPage` (`useSettings`, `useLists`) ; chaque écran remonte ses 12 requêtes (dont `usePurchaseCounts`, tout l'historique) → envisager un fournisseur commun dans `Layout`.
5. [x] **Catalogue** — `CatalogPage` refait favoris, habituels, comptes et tri des catégories à chaque lettre ; `searchArticles` lancé deux fois quand « tout voir » est actif (ici et dans `CatalogSearch`) → calcul séparé sur `data` seul ; résultats calculés une fois et passés.
6. [x] **Démarrage** :
   - `src/app/router.tsx` : tous les écrans dans un seul paquet de 1 Mo, y compris la page de démonstration et ses données fictives, l'import (`lz-string`), la sauvegarde, Gérer, le glisser-déposer → chargement différé (`lazy` de React Router) des écrans rares ; page de démonstration seulement en développement.
   - `src/icons/packData.ts` : 482 SVG évalués et retravaillés (4 expressions régulières chacun), `catalogData.find` par icône (O(482 × 483)), une seconde après le lancement → au minimum une table par clé ; mieux, préparation au build (module virtuel Vite).
   - `src/main.tsx` charge `seed` (et le catalogue) à chaque lancement avant même de lire les réglages → `CATALOG_VERSION` dans un petit module, `seed` et `catalogUpdate` chargés seulement si besoin.
7. [x] **Écritures en base** (faible enjeu) : `catalogUpdate` en O(n²) avec un `add` par ligne → tables par clé et `bulkAdd` ; exceptions de rayon lues par `.filter(storeId)` au lieu de l'index `[storeId+articleId]` (`aislesWithOverrides`, `deleteStore`, `mergeAisleInto`) ; `deleteAisle` lit les articles un par un (`bulkGet`) ; boucles d'`update` dans `startSession`, `closeSession`, `openAisleAfter` (`bulkUpdate` / `modify`).

Ce qui a été fait (19 novembre 2026) :

- Recherche : clés préparées une fois **par article** (`WeakMap` sur l'objet : un tableau filtré, comme une catégorie de Gérer → Articles, en profite aussi), accents calculés au premier besoin ; `findLikelyDuplicates` calcule les clés une fois par article. Le pack d'icônes porte la clé de recherche de son libellé (`s`) et celles de ses mots-clés (`k`), et arrive rangé par libellé : le choix d'icône ne trie plus.
- Copie du jour : export en lecture seule (les écrans lisent pendant ce temps), puis écriture dans `copies` / `copyBackups` seulement ; une copie déjà en cours n'est pas relancée au retour dans l'app. Elle reste avant la mise à jour du catalogue, au même moment du lancement.
- Dernière session lue par un nouvel index `[listId+startedAt]` (schéma version 5, aucune donnée modifiée) ; `startSession` vide le `learningSnapshot` des courses précédentes de la liste (test unitaire).
- `useListData` : un `useMemo` par table, avec ses dérivées (`articleById`, `unitById`, `categoryById`, `recipeById`, `categoryWeights`) ; `useListDataOf` pour le mode courses, qui ne relit plus réglages et listes. Fournisseur commun dans `Layout` **écarté** (choix du 18 novembre 2026) : à reprendre seulement si l'arrivée sur un écran paraît lente sur l'iPhone.
- Catalogue : favoris, habituels, comptes et tri des catégories ne dépendent plus de la saisie ; une seule recherche, passée à `CatalogSearch` avec les comptes.
- Démarrage : écrans rares (sous-pages des Réglages, Gérer, import, maquette) chargés à leur première ouverture, avec « Chargement… » s'ils sont ouverts au lancement et un écran « Cet écran n'a pas pu s'ouvrir » (recharger, revenir à la liste) si leur fichier ne se charge pas ; maquette absente de la production. Dessins du pack préparés au build (`scripts/iconSvg.ts`, requête `?icon`) et articles retrouvés par une table ; `CATALOG_VERSION` dans `src/data/catalogVersion.ts`, données initiales et mise à jour du catalogue chargées seulement si besoin (réglages lus une fois ; une version absente passe par la mise à jour, qui la pose). JavaScript lu au démarrage : environ 930 Ko au lieu de 1 085 Ko (catalogue compris).
- Écritures : `catalogUpdate` par tables et `bulkAdd` ; exceptions lues par magasin via le premier champ de l'index `[storeId+articleId]` ; `deleteAisle` par `bulkGet` / `bulkUpdate` ; `bulkUpdate` dans `startSession`, `closeSession`, `reopenSession` et `openAisleAfter`.
