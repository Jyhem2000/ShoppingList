# 02 — Modèle métier

Ce document décrit les notions manipulées par l'app et leurs règles, sans détail technique (le schéma de données est dans [07](07-architecture-technique.md)).

```
                    ┌─────────────┐        ┌───────────┐
                    │  Catégorie  │◄───────│  Article  │──────► Unité par défaut
                    └─────────────┘  1   * └───────────┘
                          ▲ *                  ▲  ▲
                          │                    │  │
  Magasin 1──* Rayon ─────┘                    │  │
   (ordre)   (regroupe des catégories)         │  │
                                    Ligne ─────┘  └───── Ingrédient
                                      *                      *
                                      │                      │
                                    Liste                  Recette
```

Tout est **modifiable** par l'utilisateur : création, renommage, édition, suppression (avec les garde-fous indiqués).

---

## 1. Libellé, identifiant et slug

Chaque objet nommé (article, catégorie, unité, rayon, magasin, liste, recette) a :

- un **identifiant** interne, invisible, qui **ne change jamais**, même après renommage ;
- un **libellé** affiché, librement modifiable ;
- pour les articles, catégories et unités : un **slug**, version normalisée du libellé, qui sert à détecter les doublons, à la recherche et à reconnaître les objets lors d'un import.

L'identifiant **n'est pas** le slug : renommer « Tomates » en « Tomates cerises » change le slug (`tomates` → `tomates-cerises`) mais pas l'identifiant, donc les listes, recettes et l'historique qui pointent vers l'article restent intacts.

### Règles de `slugify`

1. Minuscules.
2. Suppression des accents (`é` → `e`, `ç` → `c`) : seuls les signes diacritiques combinants (U+0300 à U+036F, après décomposition NFD) sont retirés.
3. Ligatures : `œ` → `oe`, `æ` → `ae`.
4. Tout caractère qui n'est **ni une lettre ni un chiffre au sens Unicode** (espaces, apostrophes, ponctuation, symboles) → `-`, tirets multiples fusionnés, tirets en début/fin supprimés. Les lettres de **tous les alphabets** sont conservées : un nom en cyrillique, en grec ou en chinois donne un slug valide, jamais un slug vide.

| Libellé                 | Slug                    |
| ----------------------- | ----------------------- |
| `Œufs bio`              | `oeufs-bio`             |
| `Crème fraîche épaisse` | `creme-fraiche-epaisse` |
| `Sauce nuoc-mâm`        | `sauce-nuoc-mam`        |
| ` Lait   1/2 écrémé`    | `lait-1-2-ecreme`       |
| `Peanut butter`         | `peanut-butter`         |
| `Борщ`                  | `борщ`                  |
| `花生酱`                | `花生酱`                |

### Langues : libellé, slug et clé

**`slugify` ne traduit rien** : il normalise seulement les caractères du libellé tel qu'il est écrit, dans la langue où il a été écrit. Le slug ne sert donc qu'à repérer « la même écriture » (« tomates » = « Tomates »), jamais « le même produit dans une autre langue ».

Trois niveaux à distinguer :

| Niveau                                  | Exemple                                               | Langue                                                          | Voyage dans un partage ?                         |
| --------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| **Clé catalogue**                       | `beurre-de-cacahuete`                                 | Aucune : identifiant technique figé, qui aurait pu être `a0042` | ✅ et c'est elle qui permet la correspondance    |
| **Libellé du catalogue**                | fr : « Beurre de cacahuète » · en : « Peanut butter » | Une par langue disponible                                       | Non : chacun affiche le libellé de **sa** langue |
| **Libellé d'un article créé à la main** | « Peanut butter »                                     | Celle dans laquelle il a été tapé                               | ✅ tel quel (aucune traduction possible)         |

Conséquence : **tant que les articles viennent du catalogue, le multilingue est automatique** (même clé, chacun lit sa langue). La seule difficulté concerne les articles créés à la main, traitée en § 9.

L'app reste **en français uniquement** pour les versions prévues ; l'anglais (interface + catalogue) est une idée non planifiée ([03 I3](03-fonctionnalites.md#i3-multilingue)). Les données sont simplement organisées pour qu'elle reste possible sans migration (06 § 4).

### Règles d'unicité

- Deux articles ne peuvent pas avoir le même slug. Créer « tomates » quand « Tomates » existe → l'app propose l'article existant.
- Un libellé saisi qui correspond à l'**alias** d'un article existant (« coca » → _Coca-Cola_) → l'app propose aussi l'article existant.
- Renommer un article met à jour son slug ; si le nouveau slug est déjà pris, l'app propose de **fusionner** les deux articles.
- Même règle pour les catégories et les unités.

### Recherche (distinct du slug)

Pour la recherche, on utilise en plus une **clé de recherche** plus tolérante : slug + singulier approximatif (suppression d'un `s` ou `x` final par mot). Ainsi `tomate` trouve _Tomates_, `oeuf` trouve _Œufs_. Cette clé n'est jamais utilisée pour l'unicité.

---

## 2. Article

Un produit que l'on achète.

| Propriété           | Obligatoire  | Description                                                                                                                    |
| ------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Libellé             | ✅           | « Pommes »                                                                                                                     |
| Slug                | ✅ (calculé) | `pommes`                                                                                                                       |
| Catégorie           | ✅           | « Fruits ». Par défaut « Autres » si l'app ne devine pas                                                                       |
| Unité par défaut    | ✅           | « kg ». Devinée à la création (voir 06), modifiable                                                                            |
| Quantité par défaut | —            | Quantité ajoutée quand on n'en précise pas : **6** pour les œufs (unité « pièce »), 1 sinon (ou le pas de l'unité). Modifiable |
| Types               | —            | Liste des variétés possibles, **vide par défaut** : `Gala`, `Golden`, `Granny Smith`                                           |
| Alias               | —            | Autres noms : synonymes, abréviations, marques passées dans le langage courant, variantes régionales (voir ci-dessous)         |
| Icône               | —            | Icône choisie ; si absente, l'app en déduit une ou affiche un monogramme (voir 05)                                             |
| Favori              | —            | Épinglé dans les « Habituels »                                                                                                 |
| Mois de saison      | —            | _Plus tard_ — fruits et légumes uniquement : mois où l'article est de saison (D3)                                              |
| Clé catalogue       | —            | Présente si l'article vient du catalogue de départ (§ 10) ; ne change jamais                                                   |

### Alias

Les alias évitent les doublons et rendent la recherche naturelle. Exemples :

| Article          | Alias                   |
| ---------------- | ----------------------- |
| Coca-Cola        | coca, coca cola         |
| Pain au chocolat | chocolatine             |
| Essuie-tout      | sopalin                 |
| Mouchoirs        | kleenex                 |
| Pommes de terre  | pdt, patates            |
| Sauce nuoc-mâm   | nuoc mam, sauce poisson |

- Ils sont fournis par le catalogue de départ et **s'enrichissent automatiquement** : quand, lors d'un import, l'utilisateur indique qu'un article reçu « est le même que » un des siens, le libellé reçu devient un alias de son article (§ 9).
- Pas d'alias anglais systématiques : l'app est en français. Les anglicismes courants (cookies, chips, ketchup) sont déjà des libellés français.
- Une marque précise que l'on veut **vraiment** (« Nutella, pas une autre ») se gère plutôt comme un **type** de l'article (_Pâte à tartiner_ → type _Nutella_).

**Suppression** : possible ; si l'article est utilisé dans des listes ou des recettes, l'app le signale et propose de le retirer de celles-ci ou d'annuler.

**Fusion** : deux articles peuvent être fusionnés (ex. doublon créé lors d'un import). Les lignes, ingrédients et l'historique du second sont transférés au premier, et le libellé du second devient un alias du premier.

---

## 3. Catégorie

Le type d'un article, **indépendant de tout magasin**. Volontairement **fine** (une trentaine, voir 06) pour pouvoir être regroupée différemment selon les magasins.

| Propriété      | Description                        |
| -------------- | ---------------------------------- |
| Libellé, slug  | « Charcuterie », `charcuterie`     |
| Icône, couleur | Pour l'affichage dans le catalogue |

- La catégorie **« Autres »** existe toujours et ne peut pas être supprimée.
- Supprimer une catégorie : ses articles passent dans une catégorie choisie (« Autres » par défaut).
- Deux catégories peuvent être fusionnées.

---

## 4. Magasin et rayons

### Le problème

Tous les magasins n'ont pas les mêmes rayons. Dans une supérette, la charcuterie est dans un « Frais » générique avec les yaourts ; ailleurs, les conserves et l'apéritif partagent le même rayon ; dans un hypermarché, la viande se trouve à la fois au rayon boucherie à la coupe, en libre-service au rayon frais et au rayon terroir. **Un rayon est donc un regroupement de catégories propre à chaque magasin, et une catégorie peut se trouver dans plusieurs rayons.**

### Magasin

| Propriété        | Description                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Libellé          | « Carrefour Market », « Marché du samedi »                                                                     |
| Rayons           | Liste **ordonnée** selon le parcours                                                                           |
| Ordre verrouillé | Si oui, l'apprentissage automatique ne modifie plus l'ordre (affiché « Apprentissage de l'ordre : désactivé ») |

À la création d'un magasin, on part :

- d'un **modèle** (« Hypermarché », « Supermarché », « Supérette », « Marché », voir 06) ;
- ou d'une **copie** d'un magasin existant ;
- ou de **zéro** (un seul rayon « Non classé »).

### Rayon

| Propriété      | Description                                                                                |
| -------------- | ------------------------------------------------------------------------------------------ |
| Numéro         | **Calculé, jamais stocké** : son rang dans l'ordre de passage (1, 2…), sans « Non classé » |
| Libellé        | **Facultatif** : « Frais libre-service », « Sucré & petit-déj »                            |
| Repère         | Facultatif : « au fond du magasin »                                                        |
| Icône, couleur | Pour l'en-tête dans la liste                                                               |
| Catégories     | Les catégories présentes dans ce rayon, chacune marquée **principale** ou **secondaire**   |
| Position       | Sa place dans le parcours du magasin                                                       |

**Rayons numérotés** (décision du 13 novembre 2026, après le premier essai réel) : un rayon réel ne porte pas toujours le nom d'une catégorie (« Boulangerie » n'existe pas dans tous les magasins : le pain peut être avec le sucré, le petit-déjeuner et le café). Un rayon est donc désigné par **son numéro dans l'ordre de passage** (« Rayon 3 »), puis par **son nom** s'il en a un, sinon par **ses catégories principales** (« Pain & Viennoiseries · Petit-déjeuner · Café & Thé »). Le numéro suit l'ordre appris : il peut changer quand l'ordre du parcours change. Les rayons créés depuis un modèle n'ont pas de nom ; à la mise à jour (schéma 2), les noms restés tels que le modèle les avait donnés ont été retirés, ceux tapés par l'utilisateur gardés.

### Catégorie présente dans plusieurs rayons

Dans un magasin, une catégorie peut être rattachée à **plusieurs rayons** :

- **un seul rayon principal** : c'est là que vont par défaut les articles de cette catégorie ;
- **des rayons secondaires** : la catégorie y est aussi présente.

Exemple « Hypermarché » : _Viande_ → principal **Boucherie** ; secondaires **Frais libre-service** et **Terroir**.

À quoi servent les rayons secondaires :

- lors d'un déplacement d'article (ci-dessous), ils sont proposés en premier ;
- un article de la catégorie peut être placé dans l'un d'eux (exception par article) : _Steak haché_ → Frais libre-service, _Rôti_ → Boucherie (principal), _Terrine_ → Terroir.

L'ajout d'un article ne pose **jamais** de question : il va dans le rayon principal ou dans son exception si elle existe. On corrige d'un geste en magasin, et l'app s'en souvient.

> Si un même produit existe vraiment à deux endroits (jambon à la coupe ou en barquette), ce sont en pratique deux articles différents (_Jambon à la coupe_, _Jambon blanc_), ou un type (_à la coupe_).

Autres règles :

- Chaque magasin possède un rayon spécial **« Non classé »**, toujours en dernier, qui reçoit les catégories rattachées à aucun rayon.
- On peut créer, renommer, réordonner, fusionner, scinder (créer un rayon, puis y ranger une partie des catégories) et supprimer des rayons. Supprimer un rayon renvoie les catégories dont il était le rayon principal dans « Non classé » (ou vers un de leurs rayons secondaires, au choix).

### Exception par article

Un article peut être placé dans un autre rayon **pour un magasin donné**. L'exception l'emporte sur sa catégorie.

### Rayon effectif d'un article dans un magasin

```
1. exception de l'article pour ce magasin, si elle existe
2. sinon, le rayon principal de sa catégorie dans ce magasin
3. sinon, « Non classé »
```

### Déplacer un article

Quand on déplace un article vers un autre rayon (en mode courses ou en édition), l'app propose d'abord les rayons où sa catégorie est présente, puis tous les autres, et demande :

- **« Seulement _Steak haché_ dans ce magasin »** → exception pour cet article ;
- **« Toute la catégorie _Viande_ dans ce magasin »** → ce rayon devient le rayon principal de la catégorie (l'ancien devient secondaire).

---

## 5. Unité

La façon de compter un article. Les unités sont **éditables** (on peut ajouter « botte », « barquette », « tranche »).

| Propriété                                    | Exemple `kg`             | Exemple `pièce`     |
| -------------------------------------------- | ------------------------ | ------------------- |
| Libellé singulier / pluriel                  | kilogramme / kilogrammes | pièce / pièces      |
| Abréviation                                  | kg                       | — (affichage `× 3`) |
| Dimension                                    | masse                    | autre               |
| Facteur vers l'unité de base de la dimension | 1000 (base : g)          | —                   |
| Pas                                          | 0,5                      | 1                   |

Dimensions : **masse** (base g), **volume** (base ml), **autre** (pièce, pack, boîte, bouteille, sachet, botte…).

### Conversions

- Deux unités sont **convertibles** si elles ont la même dimension et que cette dimension n'est pas « autre » (g ↔ kg, cl ↔ l). Une boîte et une bouteille ne sont jamais convertibles.
- **Changer l'unité d'une ligne convertit la quantité** quand c'est possible : 1200 g → passer en kg → **1,2 kg** (et non 1200 kg). Si les unités ne sont pas convertibles, la quantité est conservée telle quelle.
- **Simplification des quantités** (réglage, activée par défaut) : une quantité est exprimée dans **la plus grande unité de même dimension qui donne une valeur ≥ 1 avec 3 décimales au plus**. Exemples : 1200 g → 1,2 kg ; 1250 ml → 1,25 l ; 250 g reste 250 g ; 33 cl reste 33 cl. Appliquée après une saisie, une fusion ou un calcul de recette, avec un message d'information « Converti en 1,2 kg — Annuler ». **Jamais à la quantité par défaut d'un article** : elle s'affiche telle qu'elle est définie (_Cerises_ ajoutées sans quantité : « 500 g »). Les quantités par défaut du catalogue s'écrivent donc déjà comme on les lit en magasin : 500 g plutôt que 0,5 kg.
- Le **pas** sert aux boutons `+`/`−` et à l'arrondi des recettes.
- Supprimer une unité utilisée impose de choisir une unité de remplacement.

> Conversions **entre dimensions** (200 g de farine ≈ combien de verres ?) : voir l'idée « Convertisseur d'unités » en [03 § Idées](03-fonctionnalites.md#idées-non-planifiées).

---

## 6. Liste et lignes

### Liste

| Propriété               | Description                                                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Libellé                 | « Courses de la semaine », « Anniversaire »                                                                                                                 |
| Dernier magasin utilisé | Proposé au départ des courses, mais **la liste n'appartient à aucun magasin** : elle se range par catégorie, et par rayon seulement en mode courses (03 B1) |

### Ligne

| Propriété      | Obligatoire | Description                                                                     |
| -------------- | ----------- | ------------------------------------------------------------------------------- |
| Article        | ✅          | Le libellé est toujours lu depuis l'article, jamais recopié                     |
| Quantité       | ✅          | Quantité par défaut de l'article (1 si non définie, ou le pas de l'unité)       |
| Unité          | ✅          | Par défaut, l'unité par défaut de l'article ; modifiable (avec conversion, § 5) |
| Types acceptés | —           | Sous-ensemble des types de l'article. **Vide = peu importe**                    |
| Note           | —           | « bio », « la marque verte »                                                    |
| Statut         | ✅          | à acheter / dans le caddie / pas pris                                           |
| Origine        | —           | « via recette Raclette (6 pers.) »                                              |

**Affichage des types acceptés** : vide → rien ; un type → « Gala uniquement » ; plusieurs → « Gala ou Golden ». On peut ajouter un nouveau type à la volée depuis la ligne ; il est alors ajouté aux types de l'article.

### Une seule ligne par article dans une liste

Quand on ajoute un article **déjà présent** dans la liste, l'app **ne modifie rien d'office** : elle affiche « Déjà dans la liste : 2 kg » avec deux choix :

- **Ajouter** une quantité (sélecteur prérempli avec la quantité saisie, ou le pas de l'unité) ;
- **Ne rien faire** (choix par défaut : `Entrée` ou fermer = ne rien faire).

Fusion des quantités quand on choisit « Ajouter » (ou lors d'un ajout de recette) :

- même unité → addition ;
- unités convertibles → conversion puis addition (300 g + 1 kg = 1,3 kg), puis simplification (§ 5) ;
- unités non convertibles (3 pièces + 200 g) → l'app propose : garder l'existant, remplacer, ou ajouter la seconde quantité en note.

### Ajouter une liste dans une autre

On peut ajouter le contenu d'une ou plusieurs autres listes à une liste, par exemple à sa création : « Courses du samedi » = « Base de la semaine » + « Apéro ». Aperçu avec cases à cocher (on décoche ce qu'on a déjà), puis ajout ou fusion des lignes selon les règles ci-dessus ; une ligne aux unités non convertibles garde la quantité existante et reçoit l'autre en note. Les listes ajoutées ne changent pas ; seules leurs lignes non cochées et non archivées sont reprises, avec leurs types acceptés et leur note.

---

## 7. Recette

| Propriété      | Description                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Libellé, icône | « Raclette », 🧀                                                                                                                              |
| **Rendement**  | Quantité de référence + unité de rendement : **« 4 personnes »** (par défaut), ou **« 1 cake »**, « 2 tartes », « 24 cookies », « 3 bocaux »… |
| Ingrédients    | Article + quantité + unité + types acceptés + « facultatif » + **« quantité fixe »**                                                          |
| Étapes / notes | Texte libre, facultatif                                                                                                                       |

Une **quantité fixe** ne suit pas le nombre de personnes : le pot de crème fraîche de la raclette sert pour 4 comme pour 10 ; les ingrédients ordinaires, eux, sont recalculés.

**Liste ou recette ?** Une **recette** convient à ce qui se cuisine et dépend du nombre de convives (raclette, cake). Une **liste** convient à un ensemble fixe qu'on rachète tel quel (« Base de la semaine », « Apéro ») : on l'ajoute à la liste du jour (§ 6, « Ajouter une liste »).

Le rendement « personnes » convient aux plats ; un rendement libre convient aux recettes qu'on fait « en un exemplaire pour tout le monde » : _Cake aux olives — 1 cake_. Pour en avoir plus, on en fait 2.

### Ajouter une recette à une liste

1. Choisir la liste, puis la quantité voulue dans l'unité de rendement : **« Pour combien de personnes ? »** ou **« Combien de cakes ? »** (prérempli avec le rendement de la recette, nombres entiers).
2. Les quantités sont recalculées, sauf les quantités fixes : `quantité × demandé ÷ rendement de référence`, puis **arrondies au pas supérieur de l'unité** (3 personnes au lieu de 4 pour 2 oignons → 1,5 → 2 oignons ; 375 g de farine avec un pas de 50 g → 400 g), puis simplifiées (§ 5).
3. Aperçu des ingrédients avec cases à cocher (on décoche ce qu'on a déjà ; les ingrédients facultatifs sont décochés par défaut) et indication des articles déjà présents dans la liste.
4. Validation → ajout ou fusion des lignes (§ 6), avec l'origine « via recette ».

---

## 8. Courses, clôture et historique

### Session de courses

- Commence quand on lance le **mode courses** sur une liste avec un magasin.
- Chaque article coché est enregistré : article, magasin, rayon, quantité, date et heure.

### Clôture

Un bouton **« Terminer les courses »** clôture explicitement la session. C'est ce signal qui déclenche les calculs :

- **ordre des rayons** du magasin (apprentissage, 07 § 7) ;
- **ordre des articles** dans les rayons ;
- **fréquences d'achat** (articles habituels, suggestions anti-oubli) ;
- **articles pas pris** dans ce magasin ;
- récapitulatif : articles achetés, pas pris, durée.

À la clôture, les lignes cochées quittent la liste (elles sont dans l'historique) ; les lignes pas prises et non cochées restent. Les lignes pas prises sont signalées « Pas pris la dernière fois » et redeviennent à acheter au début des courses suivantes.

### Réouverture

Oubli constaté à la caisse ? **« Rouvrir les courses »** est disponible sur la liste après la clôture, **tant qu'aucune nouvelle session n'a démarré** sur cette liste :

- l'app revient en mode courses avec la même session ; les articles déjà achetés réapparaissent cochés ;
- on ajoute et coche les oublis ;
- une nouvelle clôture **remplace** les calculs de la première (ils ne sont jamais comptés deux fois).

### Session oubliée

Si une session est restée ouverte et que l'app est rouverte plusieurs heures après le dernier article coché, l'app propose : « Tu as terminé tes courses de _hier 18 h_ ? — **Terminer** · **Continuer** ».

---

## 9. Partage d'une liste

Simple, sans serveur : on **envoie** une liste à quelqu'un (conjoint), qui l'**importe** dans son app. Pas de synchronisation.

### Contenu envoyé

Le partage est **autonome** : chaque ligne embarque la description complète de son article (libellé, slug, alias, clé catalogue éventuelle, icône, types), **sa catégorie et son unité avec leur clé catalogue éventuelle**, la quantité, les types acceptés et la note, ainsi que la **langue** de l'expéditeur. **Aucun magasin n'est inclus** : le destinataire choisit le sien.

### Import chez le destinataire

1. Il choisit : créer une nouvelle liste, ou fusionner dans une liste existante.
2. Pour chaque article reçu, l'app cherche automatiquement une correspondance chez lui, dans cet ordre :
   1. même **clé catalogue** (article issu du catalogue, même renommé, quelle que soit la langue de chacun) ;
   2. même **slug** ;
   3. **alias croisés** : le slug reçu correspond à un alias du destinataire, ou un alias reçu correspond à un de ses articles (« Coca » ↔ _Coca-Cola_) ;
   4. **le catalogue comme dictionnaire** : le libellé reçu est cherché dans **tous** les libellés et alias du catalogue de départ, toutes langues confondues (le catalogue complet est embarqué dans l'app). S'il y est trouvé, on obtient une clé catalogue, et donc l'article correspondant du destinataire. Exemple : « Peanut butter » créé à la main → trouvé dans les libellés anglais du catalogue → clé `beurre-de-cacahuete` → _Beurre de cacahuète_ du destinataire ;
   5. sinon un article ressemblant (recherche floue) → **proposé**, à confirmer.
3. Ce qui reste est **« non reconnu »** et passe par l'aide décrite ci-dessous.
4. Catégories et unités : par clé catalogue, puis par slug ; créées si inconnues.
5. Un **écran d'aperçu** résume avant validation : « 12 articles reconnus, 1 à confirmer, 2 non reconnus ».

### Aider à trouver un article qu'on ne sait pas avoir

On ne peut pas demander « C'est le même que… ? » à quelqu'un qui ne sait pas qu'il possède l'article. L'aperçu fait donc le travail de recherche à sa place. Pour chaque article non reconnu, il affiche :

- l'article reçu : **icône**, libellé, **catégorie** (dans la langue du destinataire si la catégorie vient du catalogue), quantité ;
- **« Peut-être chez toi : »** une courte liste de candidats, classés ainsi :
  1. articles du destinataire ayant **la même icône et la même catégorie** (🥜 _Confitures & pâtes à tartiner_ → _Beurre de cacahuète_) ;
  2. articles ayant la même icône ;
  3. articles de la même catégorie qu'il achète souvent ;
- un bouton **« Voir tous mes articles de cette catégorie »** (quelques dizaines au plus, parcourus en un coup d'œil), et une recherche libre.

Deux issues, toutes deux en un tap :

- **« C'est celui-là »** → association : le libellé reçu devient un alias de l'article choisi ; la prochaine fois, la correspondance est automatique ;
- **« Créer »** (par défaut) → nouvel article, avec un **libellé modifiable** au moment de la création (on peut taper « Beurre de cacahuète » à la place de « Peanut butter ») ; le libellé reçu est gardé en alias.

Et si un doublon passe quand même, ce n'est pas grave : on **fusionne** les deux articles plus tard, et l'écran Articles signale les **doublons probables** (même icône et même catégorie, libellés proches ou alias en commun).

### En résumé : pourquoi deux noms différents sont un problème, et comment on le traite

Aucune méthode automatique (slug, n-grammes…) ne peut deviner que « Coca » et « Coca-Cola », ou « Peanut butter » et « Beurre de cacahuète », désignent le même produit. La solution combine :

1. **En amont, un grand catalogue de départ avec alias** (§ 10) : on choisit l'article du catalogue au lieu d'en créer un → même clé des deux côtés → correspondance garantie, dans n'importe quelle langue.
2. **À l'import, le catalogue sert de dictionnaire** pour les articles créés à la main.
3. **Pour le reste, l'aperçu propose les candidats** (icône, catégorie) au lieu d'attendre que l'utilisateur s'en souvienne, et mémorise chaque association.
4. **Après coup, la fusion**, aidée par la détection des doublons probables.

## 10. Catalogue de départ

- L'app embarque un **catalogue de départ** d'environ **1 000 articles** courants en France, avec leurs **alias** (synonymes, abréviations, marques passées dans le langage courant, variantes régionales), ainsi que les catégories, unités et modèles de magasins (voir 06). C'est une donnée par défaut, comme un dictionnaire.
- Au premier lancement, il est **copié** dans les données de l'utilisateur. Ensuite, ce sont ses données : il les modifie, supprime, complète librement.
- Chaque article copié garde sa **clé catalogue**. Comme deux utilisateurs de l'app partent du même catalogue, la grande majorité des articles partagés sont reconnus à coup sûr, même renommés.
- Plus le catalogue est complet, moins on crée d'articles soi-même, et moins il y a de doublons au partage.
- Le catalogue est structuré **par langue** (un libellé et des alias par langue, une seule clé) ; la v1 ne contient que le français (06 § 4).
- Le catalogue complet reste **embarqué dans l'app** même après la copie initiale : il sert de dictionnaire lors des imports (§ 9) et de source pour les nouveaux articles des mises à jour.
- Lors d'une mise à jour de l'app qui enrichit le catalogue, seuls les **nouveaux** articles (et nouveaux alias) sont ajoutés ; les articles existants de l'utilisateur ne sont jamais écrasés.
