# 08 — Tests et qualité

## 1. Vitest et Playwright : quelle différence ?

Ce sont deux outils **complémentaires**, pas concurrents.

| | **Vitest** | **Playwright** |
|---|---|---|
| Ce qu'il teste | Des **fonctions** isolées (et éventuellement un composant seul) | **L'application entière**, comme un utilisateur |
| Comment | Exécute le code directement dans Node.js, sans navigateur | Pilote un **vrai navigateur** : ouvre l'app, tape, clique, glisse, vérifie l'écran |
| Exemple | `parseEntry("1,5 kg pommes")` renvoie `{quantité: 1.5, unité: "kg", texte: "pommes"}` | « Je tape *3 tom*, j'appuie sur Entrée, je vois *Tomates × 3* sous *Fruits & légumes* » |
| Vitesse | Des centaines de tests en ~1 seconde | Quelques secondes par scénario |
| Ce qu'il attrape | Erreurs de logique (calculs, tri, conversions, arrondis) | Ce qui casse quand tout est assemblé : interface, stockage IndexedDB, navigation, mise en page mobile |
| Ce qu'il ne voit pas | L'interface réelle, l'intégration entre les morceaux | Les cas limites fins de la logique (trop lents à tous couvrir) |

**Pourquoi Playwright est particulièrement utile ici :**
1. Il embarque **WebKit**, le moteur de Safari, et **Chromium**, celui de Chrome, et sait émuler un iPhone ou un téléphone Android (taille d'écran, tactile). On teste donc sur les moteurs des deux téléphones du foyer, depuis le PC.
2. C'est ce qui permet à l'**agent IA de vérifier lui-même** qu'une fonctionnalité marche de bout en bout, au lieu de seulement « penser » qu'elle marche.

**Ce qu'aucun des deux ne remplace** : un essai sur ton iPhone réel (app installée, écran qui reste allumé, clavier, dictée). Une courte checklist manuelle est prévue à chaque fin de phase (§ 5).

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
| Sujet | Pourquoi c'est important |
|---|---|
| `slugify`, `searchKey` | Base de l'unicité et de l'import |
| `searchArticles` | Qualité de l'ajout éclair (accents, pluriels, fautes de frappe) |
| `parseEntry` | Nombreux cas de saisie (tableau de 03 § A2) |
| `effectiveAisle`, `groupListForStore` | Cœur de l'app : le tri par rayon |
| Apprentissage de l'ordre des rayons | Logique statistique, facile à casser |
| `convert`, `mergeQuantity`, `scaleRecipe` | Calculs et arrondis |
| Suggestions anti-oubli | Logique statistique |
| `resolveImport` | Partage entre deux catalogues différents |
| Migrations Dexie | Ne jamais perdre les données d'une version à l'autre |
| Export puis import d'une sauvegarde | Aller-retour sans perte |

### Scénarios de bout en bout (Playwright)
Chaque scénario tourne sur deux configurations : **WebKit + iPhone émulé** (cible principale) et **Chromium + Android émulé** (Pixel récent, cible secondaire).

1. Premier lancement → données de départ créées → liste vide affichée.
2. Ajout éclair (`3 tom` + Entrée), article déjà présent (« Ne rien faire »), création d'un article inconnu.
3. Liste triée par rayon, changement de magasin → ordre différent.
4. Mode courses : cocher un rayon entier → repli ; ajout d'un article d'un rayon passé → « À récupérer » ; terminer → lignes cochées retirées.
5. Modifier un magasin : réordonner les rayons, déplacer une catégorie → la liste suit.
6. Recette ajoutée pour un autre nombre de personnes → quantités correctes dans la liste.
7. *(v1.1)* Partage puis import dans un profil vierge → aperçu correct, articles créés.
8. Rechargement de la page → les données sont toujours là.

## 4. Qualité du code
- TypeScript strict, aucun `any` implicite.
- **Biome** pour le lint et le formatage.
- GitHub Actions sur chaque push / pull request : lint → vérification de types → tests unitaires → build → tests E2E (WebKit et Chromium).
- Le déploiement n'a lieu que si tout est vert.

## 5. Checklist manuelle sur iPhone (fin de chaque phase)
Sur la version déployée, app installée sur l'écran d'accueil. À refaire sur le téléphone Android au moins à la fin de la phase 1, de la v1.0 et de la v1.1 (partage).
- [ ] L'app s'ouvre en plein écran, sans barre Safari, et hors ligne (mode avion).
- [ ] Rien n'est masqué par l'encoche ou la barre d'accueil.
- [ ] La barre d'ajout reste visible au-dessus du clavier.
- [ ] Les fonctionnalités de la phase marchent au doigt.
- [ ] (Mode courses) L'écran ne s'éteint pas.
- [ ] Les données sont toujours là après avoir fermé l'app.
