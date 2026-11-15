# 09 — Plan de développement

Développement confié à un agent IA, par **phases courtes et vérifiables**. Chaque phase se termine par : tests verts, app déployée en préproduction, checklist téléphone ([08 § 5](08-tests-et-qualite.md#5-checklist-manuelle-sur-téléphone-fin-de-chaque-phase)) validée par toi.

| Version                                                                              | Phases                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —                                                                                    | 0. Validation de la doc ✅                                                                                                                                                             |
| **v1.0 — Cœur et recettes** (0.N.0 à chaque phase N validée, puis 0.9 en usage réel) | 1. Socle · 2. Maquette visuelle · 3. Données et logique · 4. Liste · 5. Mode courses · 6. Tout modifiable · 7. Magasins construits en magasin · 8. Réglages et finitions · 9. Recettes |
| **v1.1 — Partage**                                                                   | 10. Partage                                                                                                                                                                            |
| **v1.2 — Anti-oubli**                                                                | 11. Anti-oubli                                                                                                                                                                         |

Le 13 novembre 2026, une phase 7 a été insérée (magasins construits pendant les courses, après le premier essai réel) : les anciennes phases 7 à 10 sont devenues 8 à 11. Le 15 novembre 2026, les recettes ont rejoint la v1.0 (développées pendant l'usage réel de la 0.9, visibles seulement hors production jusqu'à la `1.0.0`) et le partage passe avant l'anti-oubli : partage en v1.1 (phase 10), anti-oubli en v1.2 (phase 11).

Numérotation : la version **`0.N.0` sort quand la phase N est validée** ; elle peut contenir en avant-première le travail de la phase suivante. Correctifs entre deux : `0.N.1`, `0.N.2`… Détails et déploiements : [07 § 9 — Cycle des versions](07-architecture-technique.md#cycle-des-versions).

### Versions publiées

| Version | Date             | Contenu                                                                                                                                                                                                                                                                                                                                                                       |
| ------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0.4.0` | 12 novembre 2026 | Phases 1 à 4 validées ; mode courses (phase 5) en avant-première, à valider par un essai en magasin.                                                                                                                                                                                                                                                                          |
| `0.5.0` | 12 novembre 2026 | Phase 5 publiée **avant** l'essai en magasin, à la demande de l'utilisateur (seul utilisateur) : l'essai se fait sur la production ; correctifs en `0.5.x` ou dans la `0.6.0`. Thème clair, recherche du catalogue, retours de test.                                                                                                                                          |
| `0.6.0` | 12 novembre 2026 | Phase 6 (tout modifiable : magasins et rayons, articles et doublons, icônes, catégories, unités), publiée pour un essai réel par l'utilisateur ; validation sur la production, correctifs en `0.6.x`.                                                                                                                                                                         |
| `0.9.0` | 15 novembre 2026 | Installation définitive de la production sur les deux téléphones (toujours sans migration de données tant que l'app n'a pas d'autres utilisateurs : au besoin, on réinstalle). Catégorie « Crèmerie & Œufs ». Début des 2-3 semaines d’usage réel avant la `1.0.0`.                                                                                                           |
| `0.8.0` | 15 novembre 2026 | Phase 8 validée : réglages retirés (on décide pour l'utilisateur), copies automatiques des 7 derniers jours, écran d'aide, catalogue complet (428 articles et leurs icônes), finitions (états vides, accessibilité, animations et sons) ; retours d'essai (« À placer » repliable, « Rayon suivant » plus visible, œufs avec la crèmerie) et corrections de la revue de code. |
| `0.7.2` | 14 novembre 2026 | Phase 7 validée ; ses retours : Réglages organisés en accueil (« Mes données » en tête, sauvegarde à part, préférences regroupées), menu de la liste limité à la liste courante, quantités toujours simplifiées, composants partagés ; corrections de la relecture complète du code.                                                                                          |
| `0.7.1` | 14 novembre 2026 | Retours d'essai de la `0.7.0` : les articles d'une catégorie qu'on vient de ranger restent dans « À placer » jusqu'à leur coche ; « Rouvrir les courses » le jour même seulement.                                                                                                                                                                                             |
| `0.7.0` | 13 novembre 2026 | Phase 7 (magasins construits pendant les courses : « À placer », « Rayon suivant », titres des rayons tirés de leurs catégories, bulles d'aide), sauvegarde par presse-papiers ; publiée pour l'essai réel, validation sur la production, correctifs en `0.7.x`.                                                                                                              |
| `0.6.1` | 13 novembre 2026 | Retours du premier essai réel : liste par catégorie (rayons en mode courses), sauvegarde (export, import), catalogue mis à jour sans réinstaller, « où l'as-tu pris ? », quantité modifiable en magasin, « Pas pris ».                                                                                                                                                        |

Les `0.1.0` et `0.3.0` publiées les 8 et 9 novembre 2026 ont disparu avec la reprise à zéro de l'historique git (12 novembre 2026).

## Phase 0 — Validation de la documentation ✅

- Tous les documents de `docs/` sont au statut « Validé » (le 8 novembre 2026).

## v1.0 — Cœur

### Phase 1 — Socle technique

- Initialisation : Vite, React, TypeScript strict, Tailwind v4, shadcn/ui, ESLint + Prettier, Vitest, Playwright (WebKit/iPhone + Chromium/Android), vite-plugin-pwa, police Plus Jakarta Sans, tokens de couleurs (05 § 2).
- Structure de dossiers (07 § 8), coquille de l'app : onglets, zones de sécurité, écran de premier lancement (installation iPhone et Android), bandeau de mise à jour, écran « À propos » (version, nouveautés, licences).
- Déploiement Cloudflare Pages connecté au dépôt (préproduction sur `dev`, production sur `main`) et script de publication `npm run release` — voir 07 § 9.
- Réglages → **Fonctionnalités** : sons (général et un par un, avec écoute), écran allumé pendant les courses ; grisées si le téléphone ne les permet pas. Écran À propos avec « Rechercher une mise à jour ».
- À vérifier sur les deux téléphones : installation, plein écran, hors ligne, sons et mode silencieux, mise à jour après un nouveau déploiement. Le Wake Lock en situation réelle se vérifie en phase 5 (mode courses).
- ✅ _L'app vide s'installe, s'ouvre hors ligne et se met à jour sur les deux téléphones._ → version `0.1.0`.
- **Prérequis de ton côté** : compte Cloudflare (gratuit) et projet Pages connecté au dépôt GitHub — procédure dans `docs/deploiement-cloudflare.md`.

### Phase 2 — Maquette visuelle

- Page interne `#/dev/ui` présentant tous les composants clés (05 § 5) avec de fausses données : lignes, en-têtes de rayon, barre d'ajout, cartes du catalogue, panneaux, boutons, monogrammes, sons.
- Script `build-icon-pack` et premier pack d'icônes (274 icônes), monogramme pour les articles sans icône.
- Maquette accessible hors production par Réglages → À propos → « Maquette des composants ».
- ✅ _Tu valides le rendu sur iPhone (couleurs, tailles, icônes, sons) avant de construire les fonctionnalités._ → `0.2.0`.

### Phase 3 — Données et logique métier

- Schéma Dexie, données initiales (06) avec un premier catalogue de ~150 articles (238 livrés), initialisation au premier lancement.
- `src/domain/` : slugify, recherche (avec alias), parseEntry, rayon effectif (principal/secondaire), groupement, quantités (conversion, simplification) + tests unitaires.
- ✅ _Tests unitaires verts sur tous les cas de 03 § A2, la simplification et le tri par rayon._ → `0.3.0`.

### Phase 4 — Remplir et afficher la liste

A1 à A7, B1 à B6, H8. Résolution d'icône en cascade et monogramme, sons d'ajout.

- ✅ _Scénarios E2E 1, 2, 3 et 6 verts._ → `0.4.0`.

### Phase 5 — Mode courses, clôture et apprentissage

C1 à C8.

- ✅ _Scénario E2E 4 vert ; tests unitaires clôture/apprentissage/réouverture verts ; essai réel en magasin (préproduction)._ → `0.5.0`.

### Phase 6 — Tout est modifiable

G1 à G5 (articles et alias, catégories, magasins et rayons avec glisser-déposer et rayons principaux/secondaires, apprentissage de l'ordre activé ou non par magasin, unités, sélecteur d'icône).

- ✅ _Scénario E2E 5 vert._ → `0.6.0`.

### Phase 7 — Magasins construits pendant les courses _(plan validé le 13 novembre 2026, réalisé, validé le 14 novembre 2026)_

Décision du 13 novembre 2026, après le premier essai réel : des rayons préremplis par un modèle sont faux pour presque tout le monde (dans le vrai supermarché de l'utilisateur, le pain est avec le sucré, le petit-déjeuner et le café). Le magasin se construit donc **pendant la première course**, et un rayon se nomme d'après ce qu'il contient.

**1. Plus de modèles de magasin, plus de magasin au premier lancement**

- Suppression des modèles (« Hypermarché », « Supermarché », « Supérette », « Marché ») : fichier `store-templates.json`, 06 § 3, choix « Rayons de départ ». Un nouveau magasin est **vide** ou la **copie** d'un magasin existant. Pas de migration des données existantes (choix de l'utilisateur : il refait son magasin) ; la version 2 du schéma reste déclarée, sans changement de données.
- Premier lancement : seulement la liste « Courses ». Rien n'est supprimé chez un utilisateur existant (son « Mon supermarché » reste) ; même le dernier magasin peut être supprimé.
- ~~« Repartir de zéro »~~ : abandonné (il suffit de supprimer le magasin et d'en créer un au départ des courses).

**2. Premier « C'est parti » sans magasin**

- Le panneau « Faire les courses » demande le nom du magasin (« Nouveau magasin ») ; il propose toujours cette option, à côté des magasins existants.

**3. Mode courses : ranger en cochant**

- Les articles dont la catégorie n'a pas de rayon dans ce magasin sont dans un bloc **« À placer »**, rangé par catégorie, placé juste après le rayon en cours (en tête s'il n'y en a pas encore). À la première course, tout y est.
- **Cocher** un article de « À placer » le range dans le **rayon en cours** (créé à la première coche) : sa catégorie y devient principale ; si la catégorie a déjà un rayon dans ce magasin, ou si c'est une catégorie système (« Autres », « Achats ponctuels »), seul l'article est rangé là (exception par article).
- Bouton bien visible **« Rayon suivant »**, au-dessus de la barre du bas : il ouvre un nouveau rayon juste après le rayon en cours, qui devient le rayon en cours ; les coches suivantes de « À placer » y vont. Un rayon resté vide n'est pas recréé deux fois, et il est supprimé à la clôture.
- Aux courses suivantes : les catégories connues sont rangées par rayon ; les nouvelles arrivent dans « À placer » et se rangent de la même façon. « Où as-tu pris… ? », « Changer de rayon » et l'apprentissage de l'ordre continuent de fonctionner.
- « Non classé » disparaît de l'affichage : « À placer » le remplace.

**4. Le nom d'un rayon, sans numéro**

- Le numéro (« Rayon 3 ») n'est plus affiché : il bouge avec l'apprentissage et ne correspond pas aux panneaux du magasin. Au-dessus du titre, le mot **« RAYON »** seul, pour ne pas confondre avec une catégorie.
- Chaque catégorie reçoit un **nom court** et une **famille** (tableau ci-dessous, à relire), modifiables dans la fiche de la catégorie ; une catégorie créée par l'utilisateur a son nom pour nom court et aucune famille. Pas de schéma 3 : le nom court d'une catégorie du catalogue vient du catalogue (par sa clé) tant que l'utilisateur ne le change pas, la famille aussi.
- **Titre** d'un rayon, dans cet ordre :
  1. le nom donné par l'utilisateur ;
  2. une seule catégorie principale : son nom court (« Fromages ») ;
  3. toutes ses catégories principales de la même famille : le nom de la famille (« Épicerie sucrée ») ;
  4. sinon : les deux catégories les plus achetées dans ce rayon (à égalité : l'ordre où elles y ont été rangées), puis le nombre des autres (« Pain · Café & thé +2 »).
- La liste complète reste dans la fiche du rayon, avec le repère (« au fond du magasin ») sous le titre.

| Catégorie                     | Nom court       | Famille            |
| ----------------------------- | --------------- | ------------------ |
| Fruits                        | Fruits          | Fruits & légumes   |
| Légumes                       | Légumes         | Fruits & légumes   |
| Herbes aromatiques            | Herbes          | Fruits & légumes   |
| Pain & Viennoiseries          | Pain            | Boulangerie        |
| Viande                        | Viande          | Viandes & poissons |
| Volaille                      | Volaille        | Viandes & poissons |
| Poisson & Fruits de mer       | Poisson         | Viandes & poissons |
| Charcuterie                   | Charcuterie     | Frais              |
| Traiteur & Plats préparés     | Traiteur        | Frais              |
| Crèmerie & Œufs               | Crèmerie & Œufs | Frais              |
| Yaourts & Desserts frais      | Yaourts         | Frais              |
| Fromages                      | Fromages        | Frais              |
| Pâtes, Riz & Féculents        | Pâtes & riz     | Épicerie salée     |
| Conserves & Bocaux            | Conserves       | Épicerie salée     |
| Sauces & Condiments           | Sauces          | Épicerie salée     |
| Sel, Poivre & Épices          | Épices          | Épicerie salée     |
| Huiles & Vinaigres            | Huiles          | Épicerie salée     |
| Apéritif                      | Apéro           | Épicerie salée     |
| Cuisine du monde              | Monde           | Épicerie salée     |
| Farine, Sucre & Pâtisserie    | Pâtisserie      | Épicerie sucrée    |
| Céréales & Petit-déjeuner     | Petit-déj       | Épicerie sucrée    |
| Biscuits & Gâteaux            | Biscuits        | Épicerie sucrée    |
| Chocolat & Confiserie         | Chocolat        | Épicerie sucrée    |
| Confitures & Pâtes à tartiner | Confitures      | Épicerie sucrée    |
| Café & Thé                    | Café & thé      | Épicerie sucrée    |
| Eaux                          | Eaux            | Boissons           |
| Jus & Sodas                   | Jus & sodas     | Boissons           |
| Bières, Vins & Alcools        | Alcools         | Boissons           |
| Surgelés                      | Surgelés        | Surgelés           |
| Glaces                        | Glaces          | Surgelés           |
| Hygiène & Beauté              | Hygiène         | Hygiène            |
| Papier toilette & Mouchoirs   | Papier          | Hygiène            |
| Bébé                          | Bébé            | Hygiène            |
| Entretien & Lessive           | Entretien       | Maison             |
| Cuisine & Maison              | Maison          | Maison             |
| Animaux                       | Animaux         | Maison             |

« Autres » et « Achats ponctuels » (catégories système) n'ont ni nom court ni famille : elles ne sont jamais rangées en entier dans un rayon.

**5. Bulles d'aide (guide allégé, nouvelle H12)**

- Une bulle, montrée **une seule fois**, sur un écran légèrement assombri, avec une flèche vers l'élément concerné ; un toucher n'importe où la ferme :
  - première course, sur le premier article de « À placer » : « Touche un article quand il est dans le caddie : l'app retient dans quel rayon il se trouve. » ;
  - après la première coche, sur « Rayon suivant » : « Tu changes de rayon ? Touche ici : les articles suivants iront dans le nouveau rayon. » ;
  - au bilan de la première course : « Ton magasin est enregistré : la prochaine fois, ta liste suivra ton parcours. ».
- Mémorisées sur le téléphone (préférences de l'appareil) ; Réglages → Aide → « Revoir les conseils ».
- Le **guide de démonstration complet** (parcours pas à pas, flèches sur chaque action) reste pour plus tard.

**6. Tests et docs**

- Tests unitaires : règle de rangement d'une coche, « Rayon suivant » (insertion après le rayon en cours, pas de rayon vide en double, rayons vides retirés à la clôture), titre d'un rayon, nom court et famille de chaque catégorie, plus de magasin au premier lancement.
- Scénarios E2E : 3 réécrit (première course qui construit le magasin, puis la liste suit ce parcours à la course suivante), 5 adapté (sans modèle).
- Docs 02, 03 (B5, C1, C4, C7, G2, G3, H10, H12), 04 (2.3, 2.8, 2.11), 06 (§ 2 nom court et famille, § 3 retiré), 07, 08 ; maquette `#/dev/ui`.

**7. Ajouts demandés pendant la phase**

- Article **« Lait aromatisé »** (types fraise, chocolat, vanille ; icône de la brique de lait, bande marron), catalogue version 3.
- Sauvegarde : **« Copier dans le presse-papiers »** et **« Coller une sauvegarde »**, en plus du fichier (03 H4).
- Liste et mode courses, dans les deux thèmes : pas de fond sous les articles, bloc bordé d'un trait fin de sa couleur.
- Retours avant publication : « À placer » avec un intertitre par catégorie, marge sous « Rayon suivant », litière en paquets (première correction du catalogue, 06 § 7).
- Retours après la `0.7.0` : les autres articles d'une catégorie qu'on vient de ranger restent dans « À placer » jusqu'à leur coche (plus rien ne saute à l'écran) ; « Rouvrir les courses » seulement le jour même, et jamais si le magasin a été supprimé.

- ✅ _Scénarios E2E 3 et 5 verts ; essai réel : un magasin construit pendant une course, puis une course qui suit ce parcours._ → `0.7.0`.

### Phase 8 — Réglages, sauvegarde, finitions

H1 à H6 (plan validé le 14 novembre 2026) : réglages Animations, Affichage compact et Lignes cochées **retirés** (on décide pour l'utilisateur, 03 H1 à H3) ; H4 avancée en partie dans la `0.6.1` (export et import en remplacement), reste les copies automatiques internes avec « Restaurer une copie » et leurs libellés — import en fusion et rappel des 30 jours **abandonnés** (03 H4), H9 et H10 (écran d'aide : mode d'emploi, ce que l'app règle toute seule, conseil de suivre le même parcours pendant l'apprentissage), catalogue complété à **~500 articles** (contre 240 : les catégories maigres passent à 10-20 articles chacune), en lots par famille relus sur une page temporaire de préproduction, avec peu de nouvelles icônes (une par type de produit, ou une icône existante recolorée), passe d'animations et de sons, accessibilité, états vides.

Retours de la validation de la phase 7 (14 novembre 2026) :

- Menu `⋯` de la liste : seulement des actions sur la liste courante ; « Toutes mes listes » retiré (les autres listes s'ouvrent en touchant le nom), « Ajouter une autre liste » devient « Y ajouter le contenu d'une autre liste » (04 § 2.1).
- Réglage « Simplifier les quantités » retiré : simplification toujours active, avec « Annuler » (03 H8).
- Réglages organisés en accueil (04 § 2.7) : « Mes données » en tête, en grandes tuiles avec leur nombre, et la sauvegarde dans un écran à part (quatre actions de même poids) ; les préférences (sons, écran allumé, thème) derrière une seule ligne « Préférences ».

Retours de l'essai du 15 novembre 2026 : catégories de « À placer » repliables (et les blocs « À placer » et « À récupérer »), « Rayon suivant » en bouton plein, œufs rangés avec la crèmerie (« Lait, Crème, Beurre & Œufs »). Puis revue de code de la phase : copie de sécurité avant chaque remplacement des données, copies complètes à part (schéma 4), ligne qui pulse même dans un groupe replié.

- ✅ _Essai réel en magasin sur les deux téléphones (préproduction) : phase 8 validée le 15 novembre 2026._ → `0.8.0`.

### Publication 0.9 puis 1.0

- 🚀 **`npm run release -- 0.9.0`** : installation définitive de la production sur les deux téléphones. _Publiée le 15 novembre 2026 ; la phase 9 (recettes) avance en parallèle sur `dev`._
- 2-3 semaines d'usage réel ; correctifs publiés en `0.9.1`, `0.9.2`…

### Phase 9 — Recettes _(plan validé le 15 novembre 2026, en cours)_

E1, E2 : onglet Recettes, fiche recette avec rendement fixe (personnes ou unité libre), ajout à une liste avec recalcul, arrondi, simplification et fusion des quantités. Développée sur `dev` pendant l'usage réel de la 0.9 ; l'onglet n'apparaît que hors production jusqu'à la `1.0.0`, pour que les correctifs `0.9.x` restent publiables.

**Préalable, fait le 15 novembre 2026** : une ligne par article **et par choix de types** (02 § 6) — sucre en poudre et sucre glace, 2 Golden et 3 Granny Smith sont deux lignes ; une recette ne fusionne un ingrédient qu'avec la ligne aux mêmes types. Retours d'essai du même jour, faits aussi : « Une autre sorte, sur une ligne à part » au deuxième ajout, suggestions par type (`pommes g` → « Pommes · Golden ») et début de type reconnu, bouton ‹ qui revient à l'écran d'où l'on vient. Puis : réglage du catalogue avec toutes les lignes de l'article (chacune avec sa sorte), pas du litre à 1 L, « puis » et le point de fin de phrase comme séparateurs pour la dictée, aide mise à jour (sortes, dictée). En préproduction pour un essai réel avant de commencer la phase 9.

Plan (pas de migration de données : au besoin, on réinstalle l'app, 07 § 5) :

0. ✅ **Tests E2E** : leurs textes sont lus dans `src/i18n/fr.ts` et `src/data/categories.json` au lieu d'être recopiés ; correction du scénario 5 instable sur iPhone.
1. ✅ **Calculs** (`src/domain/recipes.ts`, fonctions pures) : `scaleRecipe` (quantités fixes inchangées, sinon `q × demandé ÷ rendement`, arrondi au pas supérieur, simplification) ; `planRecipeAdd` (aperçu : facultatifs décochés, quantité déjà dans la liste, fusion par `mergeQuantity`, quantité en note si les unités ne se convertissent pas). Tests unitaires sur les critères de 03 E2.
2. **Données** (`src/db/recipes.ts`) : créer, modifier, dupliquer, supprimer une recette ; l'ajouter à une liste (`fromRecipes`, origine « via Raclette », jamais de libellé recopié). Ce qui arrive ensuite aux lignes ne touche jamais la recette. Seule la suppression d'un article du catalogue la concerne : « utilisé dans N recettes », retirer l'ingrédient ou annuler (02 § 2) ; fusion d'articles et suppression d'unité reportées sur les ingrédients.
3. **Écrans** : onglet Recettes (`chef-hat`, hors production seulement jusqu'à la `1.0.0`) ; liste avec recherche, « Nouvelle recette », état vide ; fiche avec rendement fixe, ingrédients, étapes, dupliquer et supprimer en bas ; édition sur la même fiche (ingrédients par la barre d'ajout, cases « facultatif » et « quantité fixe », unités de cuisine, rendement nombre + unité, icône). Tout élément présent à deux endroits devient un composant de `src/ui` (aperçu à cocher partagé avec « Y ajouter le contenu d'une autre liste »).
4. **« Ajouter à une liste »** : panneau avec la liste cible, `− 4 personnes +` ou `− 1 cake +`, aperçu à cocher, « Ajouter ».
5. **Catalogue** : ~55 ingrédients de cuisine et de pâtisserie manquants (cassonade, cacao non sucré, noisettes, amandes effilées, pâte d'amande, fleur d'oranger, fruits confits, gousses de vanille, pruneaux, abricots secs, dattes, pignons, graines, chapelure, feuilles de brick, vermicelles, haricots blancs, anchois, confit de canard, choucroute, sauce Worcestershire, miso, tahini, crème de coco, girofle, genièvre, safran, quatre-épices, ras el hanout, cerfeuil, sauge, marjolaine, citronnelle, cognac, calvados, madère, **kirsch**, beaufort, fromage à fondue, mont-d'or, gorgonzola, burrata, blettes, topinambours, foies de volaille, gésiers…), chacun avec son icône dessinée, en lots relus ; six icônes de plats (soupe, cake, tarte, gâteau, gratin, salade composée). Pour l'icône d'une recette, plats et desserts du pack proposés en premier. (Harissa : déjà au catalogue.)
6. **Vérifications** : scénario E2E 7, `npm run check`, `npm run e2e`, contrôle en taille téléphone, doc et nouveautés, puis validation en préproduction.

- ✅ _Tests unitaires `scaleRecipe` / `mergeQuantity` verts ; scénario E2E 7 vert ; validation en préproduction._

### Publication 1.0

- 🎉 _**Validation de la 0.9 et des recettes → `npm run release -- 1.0.0`**, avec l'onglet Recettes visible en production et des nouveautés réécrites : une seule entrée « 1.0.0 » remplace celles des versions `0.x` (07 § 9). Les données restent en place._

## v1.1 — Partage

### Phase 10 — Partage

F1, F2, A8 : envoyer une liste, l'importer (lien sur Android, « Coller une liste partagée » sur iPhone), aperçu d'import avec « C'est le même que… », coller une liste en texte.

- ✅ _Scénario E2E 8 vert ; essai réel iPhone → Android et Android → iPhone._
- 🎉 _**Publication v1.1.0.**_

## v1.2 — Anti-oubli

### Phase 11 — Anti-oubli

D1, D2 : suggestions basées sur la fréquence d'achat, revue rapide par catégorie.

- 🎉 _**Publication v1.2.0.**_

## Plus tard et idées

- Plus tard : saisonnalité (D3), partage de recettes (E3), guide de démonstration complet (écran assombri, flèches sur chaque action, voir phase 7 § 5).
- Idées non planifiées, peut-être jamais : scan de code-barres (I1), convertisseur d'unités (I2).

---

## Conventions git

- Dépôt public : `https://github.com/Jyhem2000/ShoppingList`.
- Auteur des commits : **Jyhem2000**, adresse masquée GitHub `32844022+Jyhem2000@users.noreply.github.com` (configurée localement dans le dépôt). **Pas de ligne `Co-Authored-By`** dans les messages de commit.
- Messages de commit en français, format _Conventional Commits_ : `feat: barre d'ajout éclair`, `fix: arrondi des recettes`, `docs: …`, `test: …`, `chore: …`.
- On travaille **directement sur `dev`** (branche par défaut) : chaque commit poussé met à jour la préproduction, sans branche de travail ni pull request. La checklist téléphone se fait en préproduction.
- `main` = production : n'avance que par `npm run release`, jamais de travail ni de fusion directe.
- Publication d'une version : `npm run release` depuis `dev`, sur demande explicite (07 § 9 : nouveautés, contrôles, version, tag, avance de `main`, déploiement automatique).
- Toute décision qui s'écarte de `docs/` → mise à jour de `docs/` dans le même commit.

## Travailler avec l'agent

- Une phase = une demande, avec les identifiants de fonctionnalités et les critères d'acceptation de [03](03-fonctionnalites.md).
- Pour les phases 3 à 7 et 9 : demander d'abord un **plan**, le valider, puis lancer l'implémentation.
- L'agent doit lancer lint, types, tests unitaires et E2E, et regarder l'app en taille téléphone avant de déclarer une tâche terminée.
- Relire soi-même les fonctions de `src/domain/` et les données initiales : c'est là que se jouent la justesse et la qualité perçue.
- Essais sur téléphone : sur la préproduction `dev` (le service worker et le Wake Lock exigent HTTPS).
