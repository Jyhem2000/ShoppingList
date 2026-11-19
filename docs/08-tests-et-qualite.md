# 08 — Tests et qualité

## 1. Vitest et Playwright : quelle différence ?

Ce sont deux outils **complémentaires**, pas concurrents.

|                      | **Vitest**                                                                            | **Playwright**                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Ce qu'il teste       | Des **fonctions** isolées (et éventuellement un composant seul)                       | **L'application entière**, comme un utilisateur                                                       |
| Comment              | Exécute le code directement dans Node.js, sans navigateur                             | Pilote un **vrai navigateur** : ouvre l'app, tape, clique, glisse, vérifie l'écran                    |
| Exemple              | `parseEntry("1,5 kg pommes")` renvoie `{quantité: 1.5, unité: "kg", texte: "pommes"}` | « Je tape _3 tom_, j'appuie sur Entrée, je vois _Tomates × 3_ sous _Fruits & Légumes_ »               |
| Vitesse              | Des centaines de tests en ~1 seconde                                                  | Quelques secondes par scénario                                                                        |
| Ce qu'il attrape     | Erreurs de logique (calculs, tri, conversions, arrondis)                              | Ce qui casse quand tout est assemblé : interface, stockage IndexedDB, navigation, mise en page mobile |
| Ce qu'il ne voit pas | L'interface réelle, l'intégration entre les morceaux                                  | Les cas limites fins de la logique (trop lents à tous couvrir)                                        |

**Pourquoi Playwright est particulièrement utile ici :**

1. Il embarque **WebKit** (le moteur de tous les navigateurs sur iPhone, Chrome compris) et **Chromium** (celui de Chrome Android), et sait émuler un iPhone ou un téléphone Android (taille d'écran, tactile). On teste donc sur les moteurs des deux téléphones du foyer, depuis le PC.
2. C'est ce qui permet à l'**agent IA de vérifier lui-même** qu'une fonctionnalité marche de bout en bout, au lieu de seulement « penser » qu'elle marche.

**Ce qu'aucun des deux ne remplace** : un essai sur ton iPhone réel (app installée, écran qui reste allumé, clavier, dictée). Une courte checklist manuelle est prévue avant chaque version (§ 5).

## 2. Organisation

```
tests/
├─ unit/        # Vitest — fonctions de src/domain/ et migrations de base
│  ├─ slugify.test.ts
│  ├─ search.test.ts
│  ├─ parse-entry.test.ts
│  └─ …
└─ e2e/         # Playwright — scénarios utilisateur, iPhone et Android émulés
   ├─ add-article.spec.ts
   └─ …
```

- **Aucun test dans `src/`.**
- Les tests importent le code depuis `src/` via un alias (`@/domain/...`).

## 3. Quels tests écrire (et seulement ceux-là)

Principe : **tester ce qui peut casser silencieusement et ce qui fait la valeur de l'app.** Pas de tests de composants d'affichage simples, pas de recherche d'un taux de couverture.

### Tests unitaires (Vitest)

| Sujet                                                                                          | Pourquoi c'est important                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slugify`, `searchKey`                                                                         | Base de l'unicité et de l'import                                                                                                                                                          |
| `searchArticles`                                                                               | Qualité de l'ajout éclair (accents, pluriels, fautes de frappe)                                                                                                                           |
| `parseEntry`                                                                                   | Nombreux cas de saisie (tableau de 03 § A2)                                                                                                                                               |
| `effectiveAisle`, `groupListForStore`                                                          | Cœur de l'app : le tri par rayon                                                                                                                                                          |
| Rangement en cochant, « Rayon suivant », titre d'un rayon                                      | Le magasin se construit pendant les courses (03 C4, 02 § 4) : bonne catégorie au bon rayon, jamais deux rayons vides, titres courts                                                       |
| Clôture, apprentissage, réouverture                                                            | Logique statistique ; jamais de double comptage après réouverture                                                                                                                         |
| `convert`, `changeUnit`, `simplify`, `stepAmount`, `stepCount`, `mergeQuantity`, `scaleRecipe` | Calculs, conversions et arrondis (y compris rendements « 1 cake », − / + qui changent d'unité ; en base, appuis rapprochés tous comptés et achat qui suit)                                |
| `parseMarkdown`, `toggleBold`, `toggleLineStyle`, `continueList`                               | Étapes mises en forme : titres, listes, gras, un texte simple lu tel quel ; boutons de la barre et suite d'une liste                                                                      |
| Suggestions anti-oubli                                                                         | Logique statistique                                                                                                                                                                       |
| `slugify` sur d'autres alphabets                                                               | Jamais de slug vide (cyrillique, chinois…)                                                                                                                                                |
| `resolveImport`, `suggestCandidates`, `uniqueRecipeName`                                       | Partage entre deux catalogues différents : clé, alias, dictionnaire du catalogue, candidats par icône/catégorie ; recette reçue sous un nom libre (« Cake (3) », jamais « Cake (2) (2) ») |
| `findLikelyDuplicates`                                                                         | Détection des doublons sans faux positifs grossiers                                                                                                                                       |
| Données initiales et premier lancement                                                         | Slugs et alias sans doublon, icônes du pack, un rayon principal par catégorie ; copie unique au premier lancement                                                                         |
| Migrations Dexie                                                                               | Ne jamais perdre les données d'une version à l'autre                                                                                                                                      |
| Export puis import d'une sauvegarde                                                            | Aller-retour sans perte                                                                                                                                                                   |
| Copies automatiques internes                                                                   | Une par jour au plus, 7 gardées, restauration sans perte                                                                                                                                  |

### Scénarios de bout en bout (Playwright)

Chaque scénario tourne sur deux configurations : **WebKit + iPhone émulé** (cible principale) et **Chromium + Android émulé** (Pixel récent, cible secondaire).

1. Premier lancement → données de départ créées → liste vide affichée.
2. Ajout éclair (`3 tom` + Entrée), article déjà présent (« Ne rien faire »), création d'un article inconnu.
3. Liste rangée par catégorie ; la première course dans un nouveau magasin le construit (tout « À placer », on coche dans l'ordre du parcours avec « Rayon suivant », bulles d'aide) ; la course suivante est rangée par rayon dans cet ordre, sans rien à placer.
4. Mode courses (premières courses dans un nouveau magasin) : cocher un rayon entier → repli ; ajout d'un article d'un rayon passé → « À récupérer » ; terminer les courses → lignes cochées retirées ; rouvrir → elles réapparaissent cochées ; terminer à nouveau.
5. Modifier un magasin : réordonner les rayons, déplacer une catégorie, rendre un rayon principal pour une catégorie → la liste suit. Le magasin est d'abord construit par une course.
6. Rechargement de la page → les données sont toujours là.
7. _(v1.0)_ Recette ajoutée pour un autre rendement (personnes et « cakes ») → quantités correctes dans la liste : fusion avec la farine déjà présente, quantité fixe inchangée, origine « via … » sur les lignes.
8. _(v1.1)_ Partage puis import dans un profil vierge → aperçu correct, association « C'est le même que… » mémorisée, articles créés.
9. _(v1.1)_ Recette partagée puis importée dans un profil vierge → ingrédients reconnus, quantité fixe conservée, recette créée et ouverte.

**Stabilité des scénarios iPhone.** Le WebKit de Playwright sous Windows a des pauses (il cesse un moment de redessiner la page, parfois une dizaine de secondes), plus nombreuses avec la charge, et il écrit lentement dans IndexedDB (environ 15,6 ms par requête, un tic de l'horloge de Windows, contre quelques millisecondes sous Chromium). Rien de cela ne vient de l'app. D'où :

- les scénarios iPhone sont rejoués une fois en cas d'échec (`retries: 1` dans `playwright.config.ts`) : un scénario qui passe au second essai est signalé « flaky » dans le rapport sans bloquer `npm run e2e` ni `npm run release` ; s'il échoue deux fois, c'est un vrai problème. Un scénario souvent « flaky » mérite d'être examiné ;
- trois scénarios à la fois au plus (`workers: 3`) : davantage fait dépasser leur délai aux scénarios iPhone ;
- les gestes du mode courses qu'un second toucher ne défait pas (cocher, « Rayon suivant », « Terminer », « Retour à la liste ») sont rejoués tant que leur effet n'est pas visible (`tapUntil` dans `tests/e2e/app.ts`) : la ligne visée peut bouger juste après que Playwright l'a jugée immobile. Un scénario iPhone a 60 s au lieu de 30 ;
- `enterApp` attend la barre d'ajout, signe que les données de départ sont créées (environ 540 écritures, une dizaine de secondes sous WebKit), avec un délai de 30 s propre au premier lancement ;
- avant de toucher un bouton, un scénario attend que les lignes qui pourraient le décaler soient affichées.

Les textes attendus à l'écran sont lus dans `src/i18n/fr.ts` et `src/data/categories.json` (`tests/e2e/texts.ts`), jamais recopiés : retoucher un texte ne casse pas les scénarios. Seul ce que l'on tape (noms d'articles, de magasins) reste écrit dans les scénarios.

## 4. Qualité du code

- TypeScript strict, aucun `any` implicite.
- **Prettier** pour le formatage (réglages par défaut, tout le dépôt y compris la doc) et **ESLint** pour l'analyse du code (typescript-eslint strict avec les types, règles des hooks React, et aucun import d'un dossier de `src/features` vers un autre ni de `src/common` vers `src/features`, docs/07 § 8).
- `npm run check` : format, lint, types, tests unitaires. Lancé par Cloudflare avant chaque build (`npm run build:checked`) : rien n'est mis en ligne si un contrôle échoue.
- Tests E2E (WebKit et Chromium) : sur le poste de développement avant chaque commit, et par `npm run release` avant toute publication ([07 § 9](07-architecture-technique.md#9-hébergement-versions-et-déploiement)).
- Résultats des tests E2E dans `tests/e2e/.results` et `tests/e2e/.report` (ignorés par git).

## 5. Checklist manuelle sur téléphone (avant chaque version)

Sur la préproduction (`dev`), app installée sur l'écran d'accueil de l'iPhone (via Chrome). À refaire sur le téléphone Android avant chaque version publiée, et pour la v1.1 (partage dans les deux sens).

- [ ] L'app s'ouvre en plein écran, sans barre de navigateur, et hors ligne (mode avion).
- [ ] Rien n'est masqué par l'encoche ou la barre d'accueil.
- [ ] La barre d'ajout reste visible au-dessus du clavier.
- [ ] Les nouveautés de la version marchent au doigt.
- [ ] (Mode courses) L'écran ne s'éteint pas.
- [ ] Les données sont toujours là après avoir fermé l'app.
- [ ] Sons audibles, coupés par le mode silencieux sur iPhone ; rien ne casse quand ils sont désactivés.
- [ ] Après un nouveau déploiement, le bandeau de mise à jour apparaît et la mise à jour conserve les données.
