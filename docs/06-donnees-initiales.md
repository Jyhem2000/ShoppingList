# 06 — Données initiales

Données embarquées dans l'app et copiées dans les données de l'utilisateur au premier lancement (voir [02 § 10](02-modele-metier.md#10-catalogue-de-départ)). Toutes sont ensuite modifiables.

Fichiers prévus dans `src/data/` : `categories.json`, `units.json`, `store-templates.json`, `catalog.json`, `keywords.json` ; les icônes d'articles sont dans `src/icons/drawn/` (§ 6).

---

## 1. Unités

| Slug        | Libellé (sing. / plur.)  | Abrév.    | Dimension | Facteur | Pas |
| ----------- | ------------------------ | --------- | --------- | ------- | --- |
| `piece`     | pièce / pièces           | — (`× n`) | autre     | —       | 1   |
| `g`         | gramme / grammes         | g         | masse     | 1       | 50  |
| `kg`        | kilogramme / kilogrammes | kg        | masse     | 1000    | 0,5 |
| `ml`        | millilitre / millilitres | ml        | volume    | 1       | 50  |
| `cl`        | centilitre / centilitres | cl        | volume    | 10      | 5   |
| `l`         | litre / litres           | L         | volume    | 1000    | 1   |
| `pack`      | pack / packs             | pack      | autre     | —       | 1   |
| `boite`     | boîte / boîtes           | boîte     | autre     | —       | 1   |
| `bouteille` | bouteille / bouteilles   | bouteille | autre     | —       | 1   |
| `sachet`    | sachet / sachets         | sachet    | autre     | —       | 1   |
| `paquet`    | paquet / paquets         | paquet    | autre     | —       | 1   |
| `pot`       | pot / pots               | pot       | autre     | —       | 1   |
| `botte`     | botte / bottes           | botte     | autre     | —       | 1   |
| `barquette` | barquette / barquettes   | barquette | autre     | —       | 1   |
| `tranche`   | tranche / tranches       | tranche   | autre     | —       | 1   |

Affichage :

- dans les listes, le **symbole** pour les poids et volumes (`1,2 kg`, `50 cl`) ; le litre s'écrit **`L`** majuscule (symbole admis par le système international) pour ne jamais confondre `1 l` et `11` ; les autres unités **en toutes lettres** (« 2 tranches », « 1 barquette ») : une abréviation comme « tr. » ou « barq. » n'est pas claire (elles restent reconnues à la saisie) ;
- dans le sélecteur d'unité, les unités sont **rangées par groupe** (`group`) : _Poids_ (gramme (g), kilogramme (kg)), _Volume_ (millilitre (ml), centilitre (cl), litre (L)), _Contenants_ (pack, boîte, bouteille, sachet, paquet, pot, barquette), _À l'unité_ (pièce, botte, tranche) ; les unités de _Cuisine_ ci-dessous ne servent qu'aux recettes ;
- dans la fiche d'une ligne, des **puces « unités habituelles »** proposent en un tap, dans un **ordre fixe** (choisir une puce ne la déplace pas) : l'unité par défaut de l'article, l'unité habituelle de sa catégorie, « pièce », puis celles déjà utilisées pour lui sur d'autres lignes (crevettes : au poids, en barquette ou à la pièce) — 4 au plus, aucune donnée en plus ;
- dans les phrases (panneaux, messages), l'unité **en toutes lettres** : « Déjà dans la liste : 6 litres », « Ajouter 1 litre ».

Pour les recettes, de petites unités sont utiles : `c-a-s` (cuillère à soupe), `c-a-c` (cuillère à café), `pincee`, `verre`, `dl` (décilitre) — dimension « autre », non convertibles : on ne les achète pas, l'ajout d'une recette à une liste prend à leur place la quantité par défaut de l'article (02 § 7). Le décilitre reste hors des volumes pour que `50 cl` ne devienne jamais `5 dl`.

### Unité et quantité par défaut d'un article : règles

L'unité par défaut doit correspondre à **ce qu'on compte devant le rayon**, et la quantité par défaut à **ce qu'on achète le plus souvent**.

1. **On compte les objets quand la taille des lots varie** : éponges (par 2, 3, 6), piles (4, 8), yaourts (4, 8, 12), œufs (6, 12), rouleaux de papier toilette (6, 9, 12…). Unité `pièce` et une quantité par défaut : « Éponges × 3 », « Papier toilette × 6 », jamais « 1 paquet d'éponges ». Il n'y a pas d'unité « rouleau » (ce serait une pièce sous un autre nom) ; le mot reste compris à la saisie (« 12 rouleaux de PQ »).
2. **Le contenant n'est l'unité que s'il est toujours le même** et que son contenu importe peu : un paquet de pâtes, un pot de moutarde, une bouteille d'huile, une boîte de thon, un pack d'eau de 6. Ce qu'on prend toujours **en lot** prend le lot pour unité : un pack de berlingots de lait aromatisé, un paquet de sachets de levure ou de barres chocolatées.
3. **Le poids pour le vrac et la coupe** : fruits et légumes vendus au poids, fromage, viande et charcuterie à la coupe. Un article au poids a **toujours une quantité par défaut** (250 g de fromage, 500 g de viande ou de poisson…) : sans elle, la saisie prendrait le pas de l'unité, soit 50 g.
4. **Le volume** pour ce qu'on achète en litres (lait, crème liquide) : « Lait 6 L ».
5. **Un nombre tapé seul compte des objets** (03 A2) : l'unité par défaut ne sert donc qu'à la saisie sans nombre. Les articles vendus au poids qui se comptent sont marqués **« se compte à la pièce »** (`countable` dans le catalogue) : fruits et légumes qu'on compte (pommes, poires, oranges, clémentines, pêches, nectarines, abricots, prunes, tomates, pommes de terre, carottes, navets, betteraves, panais, topinambours), blancs de poulet, noix de Saint-Jacques… Ce qui ne se compte pas (beurre, fromage à la coupe, cerises, raisin, haricots verts, viande et poisson à la coupe) compte en portions de la quantité par défaut.
6. **Ce qu'on achète rarement au poids passe à la pièce**, × 1 par défaut, même quand on ne sait pas combien : oignons, échalotes, poireaux, courgettes, endives, patates douces (plutôt qu'une ligne sans quantité).
7. Tout reste modifiable : l'utilisateur change l'unité ou la quantité d'une ligne, et peut changer les valeurs par défaut dans la fiche article.

Articles de base (extrait du catalogue) :

| Article                       | Unité     | Qté par défaut | Pourquoi                                                |
| ----------------------------- | --------- | -------------- | ------------------------------------------------------- |
| Œufs                          | pièce     | 6              | Boîtes de 4, 6, 10, 12 : on compte les œufs             |
| Yaourts                       | pièce     | 4              | Lots de 4, 8, 12, 16                                    |
| Éponges                       | pièce     | 2              | Lots de 2, 3, 6                                         |
| Piles                         | pièce     | 4              | Lots de 2, 4, 8, 12                                     |
| Papier toilette               | pièce     | 6              | Rouleaux, en paquets de 4 à 24                          |
| Essuie-tout                   | pièce     | 4              | Rouleaux, en paquets de 1 à 6                           |
| Mouchoirs                     | boîte     | 1              | La boîte (ou le paquet de poche) est l'unité            |
| Lait                          | L         | 6              | Bouteilles de 1 L, souvent par 6                        |
| Crème fraîche                 | pièce     | 1              | Un seul article ; types épaisse, liquide…               |
| Beurre                        | g         | 250            | Plaquettes de 125, 250, 500 g                           |
| Pommes, oranges, tomates      | kg        | 1              | Vendues au poids ; se comptent (« 3 pommes » → × 3)     |
| Oignons, échalotes, poireaux  | pièce     | 1              | Rarement achetés au poids                               |
| Bananes, citrons, avocats     | pièce     | 6 / 3 / 2      | On les compte                                           |
| Carottes, pommes de terre     | kg        | 1 / 2,5        | Vendues au poids ou en filet ; se comptent              |
| Cerises, haricots verts…      | g         | 500            | Barquettes ou sachets de 500 g, jamais « 0,5 kg »       |
| Salade, chou-fleur, concombre | pièce     | 1              | À l'unité                                               |
| Persil, coriandre, menthe     | botte     | 1              |                                                         |
| Baguette                      | pièce     | 1              |                                                         |
| Croissants, pains au chocolat | pièce     | 1              | À l'unité ; en supermarché, passer la ligne en `paquet` |
| Pain de mie                   | paquet    | 1              | Contenant toujours le même                              |
| Viande, poisson à la coupe    | g         | 500            |                                                         |
| Jambon, blanc de dinde        | tranche   | 4              | Paquets de 2, 4, 6, 8 tranches                          |
| Fromage à la coupe (comté…)   | g         | 250            |                                                         |
| Pâtes, riz, farine, sucre     | paquet    | 1              | Contenant toujours le même                              |
| Huile, vinaigre               | bouteille | 1              |                                                         |
| Conserves (thon, maïs…)       | boîte     | 1              |                                                         |
| Moutarde, confiture           | pot       | 1              |                                                         |
| Eau, eau aromatisée           | pack      | 1              | Pack de 6 bouteilles                                    |
| Lait aromatisé                | pack      | 1              | Packs de petits berlingots                              |
| Jus, sodas                    | bouteille | 1              |                                                         |
| Café                          | paquet    | 1              |                                                         |
| Lessive, liquide vaisselle    | bouteille | 1              |                                                         |
| Sacs poubelle                 | pièce     | 1              |                                                         |
| Couches                       | paquet    | 1              | La taille du paquet dépend de la taille de couche       |

### Libellés, alias, types et articles génériques : règles

1. **Libellé** comme sur une liste écrite à la main : **pluriel** pour ce qui se compte et s'achète à plusieurs (« Pommes », « Œufs », « Citrons »), **singulier** pour ce qui ne se compte pas ou s'achète seul (« Lait », « Farine », « Melon », « Salade »).
2. **Alias** : synonymes, abréviations, marques passées dans le langage courant, variantes régionales. **Jamais** la simple variante singulier/pluriel du libellé : la recherche ignore déjà le `s` ou `x` final.
3. **Types plutôt que doublons** : une variété, une couleur, un parfum ou une forme est un **type** de l'article, pas un article à part (_Citrons_ : jaunes, verts ; _Jus de fruits_ : orange, pomme… ; _Chocolat_ : noir, au lait, pâtissier ; _Crème fraîche_ : épaisse, liquide, entière, allégée). Une ligne peut accepter **plusieurs types** (« Gala ou Golden »). La saisie les reconnaît : `citron vert`, `jus d'orange`, `crème liquide`.
4. **Articles génériques** pour noter un besoin sans choisir encore, nommés **« … au choix »** : _Fruits au choix_, _Légumes au choix_, _Légumes verts au choix_, _Viande au choix_, _Poisson au choix_, _Fromage au choix_, _Dessert au choix_, _Apéritif au choix_, _Boissons au choix_ — chacun dans sa catégorie, `× 1`, sans type. Marqués `generic` dans le catalogue : **en tête** de leur catégorie dans le catalogue (séparés des autres articles) et de leur rayon dans la liste. Pas de « Surgelés au choix » : trop vague (dessert, légumes, plat…).
5. Chaque ligne de liste peut aussi recevoir une **note** libre (« bio », « la marque verte »).

## 2. Catégories (~35)

Volontairement fines pour être regroupées différemment selon les magasins. Unité par défaut suggérée pour les nouveaux articles de la catégorie. Dans un nom double, **chaque partie prend une majuscule** (« Pain & Viennoiseries », « Crèmerie & Œufs ») : ce sont des étiquettes. Pas de catégorie pour un seul article : les œufs sont rangés avec la crèmerie. Les deux catégories système vont dans « À placer » de chaque magasin.

Chaque catégorie (sauf les catégories système) a aussi un **nom court** et une **famille**, qui servent au titre des rayons sans nom (02 § 4). Ils sont dans `src/data/categories.json` (`short`, `family`) et `src/data/families.json`. Familles : Fruits & légumes, Boulangerie, Viandes & poissons, Frais, Épicerie salée, Épicerie sucrée, Boissons, Surgelés, Hygiène, Maison.

| Slug                      | Libellé                             | Unité par défaut suggérée | Nom court       | Famille            |
| ------------------------- | ----------------------------------- | ------------------------- | --------------- | ------------------ |
| `fruits`                  | Fruits                              | kg                        | Fruits          | Fruits & légumes   |
| `legumes`                 | Légumes                             | kg                        | Légumes         | Fruits & légumes   |
| `herbes-aromatiques`      | Herbes aromatiques                  | botte                     | Herbes          | Fruits & légumes   |
| `pain-viennoiseries`      | Pain & Viennoiseries                | pièce                     | Pain            | Boulangerie        |
| `viande`                  | Viande                              | g                         | Viande          | Viandes & poissons |
| `volaille`                | Volaille                            | g                         | Volaille        | Viandes & poissons |
| `charcuterie`             | Charcuterie                         | paquet                    | Charcuterie     | Frais              |
| `poisson-fruits-de-mer`   | Poisson & Fruits de mer             | g                         | Poisson         | Viandes & poissons |
| `traiteur`                | Traiteur & Plats préparés           | barquette                 | Traiteur        | Frais              |
| `lait-creme-beurre`       | Crèmerie & Œufs                     | pièce                     | Crèmerie & Œufs | Frais              |
| `yaourts-desserts`        | Yaourts & Desserts frais            | pièce                     | Yaourts         | Frais              |
| `fromages`                | Fromages                            | pièce                     | Fromages        | Frais              |
| `pates-riz-feculents`     | Pâtes, Riz & Féculents              | paquet                    | Pâtes & riz     | Épicerie salée     |
| `conserves-bocaux`        | Conserves & Bocaux                  | boîte                     | Conserves       | Épicerie salée     |
| `sauces-condiments`       | Sauces & Condiments                 | pot                       | Sauces          | Épicerie salée     |
| `epices`                  | Sel, Poivre & Épices                | pot                       | Épices          | Épicerie salée     |
| `huiles-vinaigres`        | Huiles & Vinaigres                  | bouteille                 | Huiles          | Épicerie salée     |
| `aperitif`                | Apéritif                            | sachet                    | Apéro           | Épicerie salée     |
| `cuisine-du-monde`        | Cuisine du monde                    | pièce                     | Monde           | Épicerie salée     |
| `farine-sucre-patisserie` | Farine, Sucre & Pâtisserie          | paquet                    | Pâtisserie      | Épicerie sucrée    |
| `petit-dejeuner`          | Céréales & Petit-déjeuner           | paquet                    | Petit-déj       | Épicerie sucrée    |
| `biscuits-gateaux`        | Biscuits & Gâteaux                  | paquet                    | Biscuits        | Épicerie sucrée    |
| `chocolat-confiserie`     | Chocolat & Confiserie               | pièce                     | Chocolat        | Épicerie sucrée    |
| `confitures-tartiner`     | Confitures & Pâtes à tartiner       | pot                       | Confitures      | Épicerie sucrée    |
| `cafe-the`                | Café & Thé                          | paquet                    | Café & thé      | Épicerie sucrée    |
| `eaux`                    | Eaux                                | pack                      | Eaux            | Boissons           |
| `jus-sodas`               | Jus & Sodas                         | bouteille                 | Jus & sodas     | Boissons           |
| `alcools`                 | Bières, Vins & Alcools              | bouteille                 | Alcools         | Boissons           |
| `surgeles`                | Surgelés                            | sachet                    | Surgelés        | Surgelés           |
| `glaces`                  | Glaces                              | pièce                     | Glaces          | Surgelés           |
| `hygiene-beaute`          | Hygiène & Beauté                    | pièce                     | Hygiène         | Hygiène            |
| `papier-mouchoirs`        | Papier toilette & Mouchoirs         | pièce                     | Papier          | Hygiène            |
| `entretien`               | Entretien & Lessive                 | pièce                     | Entretien       | Maison             |
| `cuisine-maison`          | Cuisine & Maison                    | pièce                     | Maison          | Maison             |
| `bebe`                    | Bébé                                | pièce                     | Bébé            | Hygiène            |
| `animaux`                 | Animaux                             | pièce                     | Animaux         | Maison             |
| `autres`                  | Autres _(système, non supprimable)_ | pièce                     | —               | —                  |
| `achats-ponctuels`        | Achats ponctuels _(système)_        | pièce                     | —               | —                  |

## 3. Magasins

Pas de modèles de magasin : ils regrouperaient les catégories de façon arbitraire, et faux pour le vrai magasin de l'utilisateur. Aucun magasin n'est créé au premier lancement ; un magasin se crée vide (au premier « C'est parti », ou dans Réglages) et ses rayons se rangent pendant les courses (03 C4).

## 3 bis. Rendements de recette proposés

`personnes` (par défaut), `cake`, `tarte`, `gâteau`, `fournée`, `bocal`, `pot`, `portion`, et saisie libre.

## 4. Catalogue de départ

- **~500 articles** courants en France (483 aujourd'hui), répartis dans toutes les catégories : 10 à 20 articles par catégorie, davantage pour les fruits et légumes. Un grand catalogue limite les créations manuelles, donc les doublons au moment du partage ([02 § 9](02-modele-metier.md#9-partage-dune-liste)).
- Format de chaque entrée — les textes sont **par langue**, la v1 ne remplit que `fr` :
  ```json
  {
    "key": "pommes",
    "name": { "fr": "Pommes" },
    "aliases": { "fr": ["pomme"] },
    "types": {
      "fr": [
        "Gala",
        "Golden",
        "Granny Smith",
        "Pink Lady",
        "Reine des reinettes"
      ]
    },
    "category": "fruits",
    "unit": "kg",
    "icon": "red-apple"
  }
  ```
  Ajouter l'anglais (v1.3) = ajouter `"en": …` dans ces champs (ou un fichier `catalog.en.json` fusionné au build), sans migration des données utilisateur.
- `key` = clé catalogue : identifiant technique **sans langue**, écrit sous forme de slug français pour rester lisible, **figé pour toujours** (même si le libellé change dans une version future). Il n'est jamais affiché.
- `types` uniquement quand c'est utile (pommes, pommes de terre, lait, farine…), sinon absent.
- `aliases` : synonymes, abréviations (`pdt`), marques passées dans le langage courant (`sopalin`, `kleenex`, `coca`), variantes régionales (`chocolatine`), orthographes alternatives (`nuoc mam`).
- **Même structure pour les catégories et les unités** : `key` sans langue + `name` (et pluriel, abréviation pour les unités) par langue.
- _v1.2 (D3)_ : `season` pour les fruits, légumes et herbes aromatiques : mois de saison **par zone**, la zone étant l'endroit où l'on fait ses courses, sans lien avec la langue (`"season": { "FR": [9, 10, 11, 12, 1, 2] }`, mois de début à fin). Seule zone : `FR`, la France métropolitaine (`SEASON_ZONE`, `src/data/catalog.ts`) ; une autre zone (autre pays, hémisphère sud) = une clé de plus, et un réglage de la zone. Écrits d'après les calendriers publics (ADEME, Interfel), relus par catégorie. Absent pour les produits importés (bananes, ananas, mangues, avocats, litchis, noix de coco, fruits de la passion, grenades, patates douces, gingembre, citronnelle) et les articles génériques ; les douze mois pour un produit de toute l'année (pommes de terre, carottes, oignons, champignons, thym, laurier, romarin).
- **Production** : généré par l'agent IA pendant le développement, puis **relu par catégorie** avant validation. C'est la donnée qui fait la qualité perçue de l'app.

## 5. Dictionnaire de mots-clés

Sert à deviner, pour un **article créé par l'utilisateur** (absent du catalogue), sa catégorie, son unité et son icône.

```json
[
  {
    "match": ["sauce", "ketchup", "mayonnaise", "moutarde", "pesto"],
    "category": "sauces-condiments",
    "unit": "pot",
    "icon": "jar"
  },
  {
    "match": ["jambon", "saucisson", "chorizo", "lardons", "rillettes"],
    "category": "charcuterie",
    "unit": "paquet",
    "icon": "cut-of-meat"
  },
  {
    "match": ["jus"],
    "category": "jus-sodas",
    "unit": "bouteille",
    "icon": "beverage-box"
  }
]
```

Règles : comparaison sur les mots du slug ; première règle trouvée gagnante ; mots plus spécifiques avant mots génériques. Si rien ne correspond : catégorie « Autres », unité « pièce », icône de la catégorie ou monogramme.

Les choix de l'utilisateur ne modifient pas le dictionnaire : ils sont enregistrés sur l'article lui-même.

## 6. Pack d'icônes

Voir [05 § 4](05-identite-visuelle.md#4-icônes). Une icône dessinée par article du catalogue (236, `src/icons/drawn/`, visibles dans la maquette `#/dev/ui`), chacune avec ses **mots-clés en français** (nom, alias et types de l'article) pour la recherche dans le sélecteur.

## 7. Mise à jour du catalogue sans réinstaller

Le catalogue embarqué a un numéro de version (`CATALOG_VERSION`, `src/data/catalogVersion.ts` : le lancement la compare à celle de la base sans charger le catalogue), gardé dans les réglages de l'app (`Settings.catalogVersion`). Une unité, une catégorie ou un article ajouté au catalogue porte `since` : la version qui l'a introduit (absent : 1).

Au lancement, si le catalogue de l'app est plus récent que celui de la base (`src/db/catalogUpdate.ts`) :

- les unités, catégories et articles apparus depuis sont **ajoutés**, sauf s'ils existent déjà (même clé, ou même nom pour un article créé à la main) ;
- rien de ce que l'utilisateur a créé, modifié ou supprimé n'est touché : un article du catalogue qu'il a supprimé ne revient pas ;
- une nouvelle catégorie n'est rangée dans aucun rayon : elle apparaît dans les « Catégories non rattachées » de chaque magasin (G3).

Les changements apportés à un article existant ne sont pas recopiés, sauf une **correction** listée dans `catalogFixes` (`src/data/catalog.ts` : unité par défaut, quantité par défaut, « se compte à la pièce ») : elle ne s'applique qu'à un article que l'utilisateur n'a jamais modifié (date de mise à jour égale à la date de création). Les **mois de saison**, arrivés avec le catalogue 10 (`SEASONS_SINCE`), sont copiés dans tous les articles du catalogue qui n'en ont pas encore, même modifiés depuis : un champ nouveau, que l'utilisateur n'a pas pu choisir. Pas besoin de réinstaller l'app pour profiter des nouveautés. Chaque enrichissement du catalogue augmente `CATALOG_VERSION`.
