# Audit du code avant la 1.0.1

Audit du 16 novembre 2026 (`/code-review` niveau élevé, dossier par dossier : `src/domain`, `src/db`, `src/features`, `src/ui`, puis `src/app`, `src/platform`, `src/feedback`, `scripts/`, `tests/`). Les angles « réutilisation » et « simplification » de la revue tiennent lieu de `/simplify`.

Bilan : les règles de `CLAUDE.md` sont bien tenues (aucune couleur en dur, aucun texte hors `fr.ts`, logique métier pure dans `src/domain`). Un vrai bug de données (n° 1), un risque de perte de saisie sur iPhone (n° 2), puis des cas limites, de l'accessibilité et du nettoyage.

Chaque point : fichier, ce qui ne va pas, la correction proposée. On coche au fur et à mesure.

## A. Bugs à corriger (par ordre d'importance)

1. [x] **Achats effacés par article, pas par ligne** — `src/db/sessions.ts` (`checkItem`, `uncheckItem`, `markUnavailable` → `removePurchases(sessionId, articleId)`). Avec « Pommes · Golden » et « Pommes · Gala » dans la liste, cocher Gala efface l'achat de Golden ; décocher Gala n'en laisse aucun alors que Golden reste cochée. Historique, bilan et apprentissage faussés. **Correction** : ajouter `itemId?: ID` à `Purchase` (champ non indexé : pas de nouvelle version du schéma), retirer les achats par `itemId` (repli sur `articleId` pour les achats sans `itemId`). Test unitaire dans `tests/unit/sessions.test.ts` : coche, décoche et introuvable sur deux lignes typées du même article.
2. [x] **Étapes de recette perdues sans sortie du champ** — `src/features/recipes/RecipePage.tsx` (`StepsEditor`), aussi `src/features/manage/NameField.tsx` : enregistrement seulement sur `onBlur`. Si le champ disparaît encore actif (« Terminé », flèche retour, onglet), aucun `blur` n'est émis : la saisie est perdue (probable sur iPhone, où un bouton ne prend pas le focus). **Correction** : enregistrer aussi au démontage (effet de nettoyage qui écrit la valeur en attente), ou enregistrer en continu avec un court délai.
3. [x] **« Annuler » après un retrait peut créer un doublon** — `src/features/list/ListPage.tsx` (l. 71) et `src/features/catalog/QuantitySheet.tsx` (l. 56) : `restoreItems` (bulkPut) remet la ligne même si le même article aux mêmes types a été rajouté entre-temps → deux lignes identiques. **Correction** : `restoreItems` fusionne avec la ligne jumelle si elle existe (même logique que `mergeIntoTwin`).
4. [x] **La clôture supprime un rayon ajouté dans Gérer pendant les courses** — `src/db/sessions.ts` (`isFreshEmptyAisle`) : tout rayon sans catégorie créé après le début des courses est supprimé à « Terminer », même nommé depuis Gérer → magasin. **Correction** : ne supprimer que les rayons sans nom ni description (ceux de « Rayon suivant »).
5. [x] **Fusion d'articles : la note de la ligne fusionnée disparaît** — `src/db/articles.ts` (`mergeArticles`, l. 189) : seule la note de la ligne gardée reste (et son origine « via recette »). Trois copies de la logique « fusionner une ligne dans sa jumelle » (`mergeArticles`, `mergeIntoTwin` dans `lists.ts`, `planListMerge`), avec deux formats de note différents (« + 2 pièces » / « + × 2 »). **Correction** : passer `mergeArticles` et `mergeIntoTwin` par `planListMerge` (et réunir les `fromRecipes`).
6. [x] **Restaurer la plus ancienne copie l'efface** — `src/db/copies.ts` (`restoreCopy` → `replaceAllData` → `addCopy` garde les 7 plus récentes) : la copie restaurée devient la 8ᵉ et disparaît. **Correction** : faire le tri des copies sans supprimer celle qu'on restaure (ou trier avant d'ajouter la copie « avant remplacement »).
7. [x] **Fusion ou suppression de rayon pendant les courses** — `src/db/stores.ts` (`mergeAisleInto`, `deleteAisle`) : les achats de la session ouverte et `openedAisle` gardent l'ancien rayon ; rayon courant, rayons passés et apprentissage les ignorent. **Correction** : dans `mergeAisleInto`, faire suivre `purchases.aisleId` (session ouverte du magasin) vers le rayon gardé ; dans les deux cas, effacer `openedAisle` s'il visait le rayon disparu.
8. [x] **Ligne cochée modifiée ou supprimée en magasin** — `src/features/catalog/QuantitySheet.tsx` : changer la quantité d'une ligne cochée ne met pas à jour son achat ; la supprimer laisse l'achat (bilan et historique la comptent). **Correction** : avec le n° 1 (`itemId`), retirer l'achat quand la ligne est supprimée et mettre sa quantité à jour.
9. [x] **« Rouvrir » depuis le bilan peut ouvrir les courses d'une autre liste** — `src/features/shopping/RecapPage.tsx` (l. 198) : `/shopping` affiche la liste courante, pas celle de la session rouverte. **Correction** : `updateSettings({ currentListId: session.listId })` avant de naviguer (idem dans `ListPage` par sécurité).
10. [x] **Initialisation impossible = « Chargement… » sans fin** — `src/main.tsx` (l. 47) : un échec d'IndexedDB (navigation privée, stockage plein) ne va qu'à la console. **Correction** : écran d'erreur clair (texte dans `fr.ts`).
11. [x] **Écritures en base qui échouent sans rien dire** — environ 28 appels `void écriture(db, …)` sans `catch` dans `src/features` (LineSheet, ListMenuSheet, QuantitySheet, CreateArticleSheet, MoveAisleSheet…). **Correction** : un seul écouteur `unhandledrejection` dans `main.tsx` qui appelle `reportSaveError` pour les erreurs Dexie, plutôt que de corriger chaque appel.
12. [x] **Ligne masquée en magasin si le rayon « Non classé » manque** — `src/domain/aisles.ts` (l. 96) : `groupListForStore` saute la ligne. N'arrive qu'avec une sauvegarde incomplète. **Correction** : avec le n° 14, ou créer le rayon manquant au démarrage des courses.
13. [x] **`firstKey in NUMBER_WORDS`** — `src/domain/entry.ts` (l. 110) : `in` lit aussi le prototype ; « constructor … » donne une quantité qui est une fonction. **Correction** : `Object.hasOwn(NUMBER_WORDS, firstKey)`.
14. [x] **Import de sauvegarde peu vérifié** — `src/db/backup.ts` (`readBackup`) : seuls les tableaux sont vérifiés ; un fichier abîmé s'importe et casse les écrans. **Correction** : vérifier la forme minimale des enregistrements (champs tableau des lignes, articles, recettes ; un rayon « Non classé » par magasin, recréé sinon).
15. [x] **Étapes : une ligne commençant par « - », « 1. », « # » devient liste ou titre au rechargement** — `src/domain/markdown.ts` (`docToMarkdown`, l. 219). **Correction** : échapper ces débuts de ligne dans les paragraphes (`\-`, `1\.`) et les relire dans `parseMarkdown`. Peu probable (TipTap transforme déjà « - » en liste) : à faire si simple.
16. [x] **Vérification des nouveautés trop lâche** — `scripts/release.ts` (l. 85) : cherche `version: "X"` n'importe où dans `fr.ts`. **Correction** : importer `fr.ts` et chercher dans `fr.releaseNotes`.

## B. Accessibilité

17. [x] **« Introuvable » et « Changer de rayon » seulement au geste** — `src/ui/ItemRow.tsx`, `src/ui/SwipeToDelete.tsx` : en mode courses, glisser et appui long n'ont pas d'équivalent en bouton ; l'`aria-label` du conteneur de glissement est posé sur un `div` générique (ignoré). **Correction** : boutons « Introuvable » et « Changer de rayon » dans le panneau de quantité ouvert depuis la ligne.
18. [x] ~~**Messages non lus quand un panneau est ouvert**~~ (non fondé, vérifié le 16 novembre 2026 : `hideOthers` de Radix laisse visibles les zones `aria-live`, donc le `Toaster` ; seul le contenu derrière le panneau est masqué. Rien à changer.) — `src/app/Layout.tsx` (l. 117) : Radix Dialog cache au lecteur d'écran tout ce qui est hors du panneau (`hideOthers`), donc le `Toaster` ; « Retiré — Annuler » n'est ni lu ni atteignable avec VoiceOver. **Correction** : rendre le `Toaster` dans une zone que Radix ne masque pas (portail propre gardé visible).

## C. Nettoyage (réutilisation, performances)

19. [x] **Comptes d'achats relus en entier à chaque coche** — `src/db/hooks.ts` (`usePurchaseCounts`, l. 183) : tout l'historique est relu à chaque écriture dans `purchases`, donc à chaque toucher en magasin. **Correction** : ne compter que les achats des sessions clôturées par l'index `sessionId`, ou ne pas dépendre des achats de la session ouverte.
20. [x] **`moveArticle` réécrit `setCategoryRole`** — `src/db/sessions.ts` (l. 542) : utiliser `setCategoryRole(aisles, aisleId, categoryId, "primary")` de `src/domain/stores.ts` et n'écrire que les rayons modifiés.
21. [x] **Tri des lignes en trois exemplaires** — `src/domain/aisles.ts`, `src/domain/categories.ts` (`STATUS_ORDER`, collator, comparateur statut → générique → nom → types) et `src/features/shopping/ShoppingPage.tsx` (l. 298, « À placer », sans la règle « générique en tête »). **Correction** : un `compareLines` dans `src/domain/lines.ts` utilisé partout.
22. [x] **`clean` en double** — `src/domain/recipes.ts` (l. 18) recopie celui de `quantity.ts` : l'exporter et l'importer.
23. [x] **Regroupements en O(n²)** — `src/domain/categories.ts` (l. 63), `duplicates.ts`, `shopping.ts` : `[...existant, élément]` à chaque ajout ; pousser dans le tableau existant.

## D. Écart avec la doc (décision à prendre)

24. [x] **Durée du message « Annuler »** — `src/ui/toast.ts` (l. 93) : 4 s dans le code, 5 s dans docs/03 B4 et docs/04 § 2.1 (et le commentaire de `ListPage`). Choisir : passer à 5 s, ou corriger la doc.

## E. Tests

25. [x] Test unitaire du n° 1 (deux lignes typées d'un même article en courses).
26. [x] Tests des corrections qui touchent la logique : n° 3 (annuler sans doublon), n° 4 (rayon nommé gardé), n° 6 (copie restaurée gardée), n° 13.

## Bilan des corrections (16 novembre 2026)

Tout est corrigé sur `dev`, sauf le n° 18 (non fondé). Choix faits en corrigeant :

- n° 1 et 8 : `Purchase.itemId` (docs/07) ; `deleteItems` renvoie aussi les achats retirés, que « Annuler » remet.
- n° 2 : `src/ui/usePendingSave.ts`, utilisé par `NameField`, les étapes de recette, la note de ligne et la quantité par défaut d'un article.
- n° 3 et 5 : une seule fusion de lignes, `mergeLineInto` (`src/db/lists.ts`), qui passe par `planListMerge` ; note au format court (« + × 2 »).
- n° 12 : `ensureUnsortedAisle` (`src/db/stores.ts`), au démarrage des courses et à l'import.
- n° 17 : « Pas pris » et « Changer de rayon » dans le panneau de quantité du mode courses ; le conteneur du glissement devient un groupe nommé.
- n° 24 : on garde 4 s, docs/03 B4 et docs/04 § 2.1 corrigées.

### Relecture des corrections

Une relecture (`/code-review`) des corrections a trouvé 8 points, tous corrigés :

- deux lignes cochées réunies (types changés, articles fusionnés) comptaient l'achat deux fois : `mergeLineInto` n'en garde qu'un, avec la quantité réunie ;
- rayon supprimé pendant les courses : ses achats passent au nouveau rayon de leur article ;
- « Annuler » après la fin des courses : la ligne revient « à acheter », sans achat ;
- un achat d'avant la 1.0.1 (sans `itemId`) suit encore sa ligne (suppression, quantité, fusion) : `isPurchaseOf` (`src/domain/lines.ts`) ;
- un nom saisi puis enregistré en quittant un article ou une catégorie fusionnés ou supprimés ne fait plus rien (au lieu de « nom déjà pris ») ;
- nettoyage : une seule recherche de ligne jumelle (`findActiveItem`), tri de « À placer » créé une fois.

Ensuite : les nouveautés « 1.0.1 » dans `fr.ts` et `npm run release -- 1.0.1` sur demande.
