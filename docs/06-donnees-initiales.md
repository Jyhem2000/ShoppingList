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
| `l`         | litre / litres           | L         | volume    | 1000    | 0,5 |
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

- dans les listes, le **symbole** pour les poids et volumes (`1,2 kg`, `50 cl`) ; le litre s'écrit **`L`** majuscule (symbole admis par le système international) pour ne jamais confondre `1 l` et `11` ; les autres unités **en toutes lettres** (« 2 tranches », « 1 barquette ») : une abréviation comme « tr. » ou « barq. » n'est pas claire (elles restent reconnues à la saisie) ;
- dans le sélecteur d'unité, les unités sont **rangées par groupe** (`group`) : _Poids_ (gramme (g), kilogramme (kg)), _Volume_ (millilitre (ml), centilitre (cl), litre (L)), _Contenants_ (pack, boîte, bouteille, sachet, paquet, pot, barquette), _À l'unité_ (pièce, botte, tranche) ; les unités de _Cuisine_ ci-dessous ne servent qu'aux recettes ;
- dans la fiche d'une ligne, des **puces « unités habituelles »** proposent en un tap, dans un **ordre fixe** (choisir une puce ne la déplace pas) : l'unité par défaut de l'article, l'unité habituelle de sa catégorie, « pièce », puis celles déjà utilisées pour lui sur d'autres lignes (crevettes : au poids, en barquette ou à la pièce) — 4 au plus, aucune donnée en plus ;
- dans les phrases (panneaux, messages), l'unité **en toutes lettres** : « Déjà dans la liste : 6 litres », « Ajouter 1 litre ».

Pour les recettes, de petites unités sont utiles : `c-a-s` (cuillère à soupe), `c-a-c` (cuillère à café), `pincee` — dimension « autre », non convertibles.

### Unité et quantité par défaut d'un article : règles

L'unité par défaut doit correspondre à **ce qu'on compte devant le rayon**, et la quantité par défaut à **ce qu'on achète le plus souvent**.

1. **On compte les objets quand la taille des lots varie** : éponges (par 2, 3, 6), piles (4, 8), yaourts (4, 8, 12), œufs (6, 12), rouleaux de papier toilette (6, 9, 12…). Unité `pièce` et une quantité par défaut : « Éponges × 3 », « Papier toilette × 6 », jamais « 1 paquet d'éponges ». Il n'y a pas d'unité « rouleau » (retirée le 12 novembre 2026 : c'était une pièce sous un autre nom) ; le mot reste compris à la saisie (« 12 rouleaux de PQ »).
2. **Le contenant n'est l'unité que s'il est toujours le même** et que son contenu importe peu : un paquet de pâtes, un pot de moutarde, une bouteille d'huile, une boîte de thon, un pack d'eau de 6.
3. **Le poids pour le vrac et la coupe** : fruits et légumes vendus au poids, fromage, viande et charcuterie à la coupe.
4. **Le volume** pour ce qu'on achète en litres (lait, crème liquide) : « Lait 6 L ».
5. Tout reste modifiable : l'utilisateur change l'unité ou la quantité d'une ligne, et peut changer les valeurs par défaut dans la fiche article.

Articles de base (extrait du futur catalogue, phase 3) :

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
| Pommes, oranges, tomates      | kg        | 1              | Vendues au poids                                        |
| Bananes, citrons, avocats     | pièce     | 6 / 3 / 2      | On les compte                                           |
| Carottes, pommes de terre     | kg        | 1 / 2,5        | Vendues au poids ou en filet                            |
| Cerises, haricots verts…      | g         | 500            | Barquettes ou sachets de 500 g, jamais « 0,5 kg »       |
| Salade, chou-fleur, concombre | pièce     | 1              | À l'unité                                               |
| Persil, coriandre, menthe     | botte     | 1              |                                                         |
| Baguette                      | pièce     | 1              |                                                         |
| Croissants, pains au chocolat | pièce     | 1              | À l'unité ; en supermarché, passer la ligne en `paquet` |
| Pain de mie                   | paquet    | 1              | Contenant toujours le même                              |
| Viande, poisson à la coupe    | g         | 500            |                                                         |
| Jambon                        | tranche   | 4              | Paquets de 2, 4, 6, 8 tranches                          |
| Fromage à la coupe (comté…)   | g         | 250            |                                                         |
| Pâtes, riz, farine, sucre     | paquet    | 1              | Contenant toujours le même                              |
| Huile, vinaigre               | bouteille | 1              |                                                         |
| Conserves (thon, maïs…)       | boîte     | 1              |                                                         |
| Moutarde, confiture           | pot       | 1              |                                                         |
| Eau                           | pack      | 1              | Pack de 6 bouteilles                                    |
| Jus, sodas                    | bouteille | 1              |                                                         |
| Café                          | paquet    | 1              |                                                         |
| Lessive, liquide vaisselle    | bouteille | 1              |                                                         |
| Sacs poubelle                 | pièce     | 1              |                                                         |
| Couches                       | paquet    | 1              | La taille du paquet dépend de la taille de couche       |

### Libellés, alias, types et articles génériques : règles

1. **Libellé** comme sur une liste écrite à la main : **pluriel** pour ce qui se compte et s'achète à plusieurs (« Pommes », « Œufs », « Citrons »), **singulier** pour ce qui ne se compte pas ou s'achète seul (« Lait », « Farine », « Melon », « Salade »).
2. **Alias** : synonymes, abréviations, marques passées dans le langage courant, variantes régionales. **Jamais** la simple variante singulier/pluriel du libellé : la recherche ignore déjà le `s` ou `x` final.
3. **Types plutôt que doublons** : une variété, une couleur, un parfum ou une forme est un **type** de l'article, pas un article à part (_Citrons_ : jaunes, verts ; _Jus de fruits_ : orange, pomme… ; _Chocolat_ : noir, au lait, pâtissier ; _Crème fraîche_ : épaisse, liquide, entière, allégée). Une ligne peut accepter **plusieurs types** (« Gala ou Golden »). La saisie les reconnaît : `citron vert`, `jus d'orange`, `crème liquide`.
4. **Articles génériques** pour noter un besoin sans choisir encore, nommés **« … au choix »** : _Fruits au choix_, _Légumes au choix_, _Légumes verts au choix_, _Viande au choix_, _Poisson au choix_, _Fromage au choix_, _Dessert au choix_, _Apéritif au choix_, _Boissons au choix_ — chacun dans sa catégorie, `× 1`, sans type. Marqués `generic` dans le catalogue : **en tête** de leur catégorie dans le catalogue (séparés des autres articles) et de leur rayon dans la liste. Pas de « Surgelés au choix » : trop vague (dessert, légumes, plat…).
5. Chaque ligne de liste peut aussi recevoir une **note** libre (« bio », « la marque verte »).

## 2. Catégories (~35)

Volontairement fines pour être regroupées différemment selon les magasins. Unité par défaut suggérée pour les nouveaux articles de la catégorie. Dans un nom double, **chaque partie prend une majuscule** (« Pain & Viennoiseries », « Lait, Crème & Beurre ») : ce sont des étiquettes. Les deux catégories système vont dans le rayon « Non classé ».

| Slug                      | Libellé                             | Unité par défaut suggérée |
| ------------------------- | ----------------------------------- | ------------------------- |
| `fruits`                  | Fruits                              | kg                        |
| `legumes`                 | Légumes                             | kg                        |
| `herbes-aromatiques`      | Herbes aromatiques                  | botte                     |
| `pain-viennoiseries`      | Pain & Viennoiseries                | pièce                     |
| `viande`                  | Viande                              | g                         |
| `volaille`                | Volaille                            | g                         |
| `charcuterie`             | Charcuterie                         | paquet                    |
| `poisson-fruits-de-mer`   | Poisson & Fruits de mer             | g                         |
| `traiteur`                | Traiteur & Plats préparés           | barquette                 |
| `oeufs`                   | Œufs                                | pièce                     |
| `lait-creme-beurre`       | Lait, Crème & Beurre                | pièce                     |
| `yaourts-desserts`        | Yaourts & Desserts frais            | pièce                     |
| `fromages`                | Fromages                            | pièce                     |
| `pates-riz-feculents`     | Pâtes, Riz & Féculents              | paquet                    |
| `conserves-bocaux`        | Conserves & Bocaux                  | boîte                     |
| `sauces-condiments`       | Sauces, Condiments & Épices         | pot                       |
| `huiles-vinaigres`        | Huiles & Vinaigres                  | bouteille                 |
| `aperitif`                | Apéritif                            | sachet                    |
| `cuisine-du-monde`        | Cuisine du monde                    | pièce                     |
| `farine-sucre-patisserie` | Farine, Sucre & Pâtisserie          | paquet                    |
| `petit-dejeuner`          | Céréales & Petit-déjeuner           | paquet                    |
| `biscuits-gateaux`        | Biscuits & Gâteaux                  | paquet                    |
| `chocolat-confiserie`     | Chocolat & Confiserie               | pièce                     |
| `confitures-tartiner`     | Confitures & Pâtes à tartiner       | pot                       |
| `cafe-the`                | Café & Thé                          | paquet                    |
| `eaux`                    | Eaux                                | pack                      |
| `jus-sodas`               | Jus & Sodas                         | bouteille                 |
| `alcools`                 | Bières, Vins & Alcools              | bouteille                 |
| `surgeles`                | Surgelés                            | sachet                    |
| `glaces`                  | Glaces                              | pièce                     |
| `hygiene-beaute`          | Hygiène & Beauté                    | pièce                     |
| `papier-mouchoirs`        | Papier toilette & Mouchoirs         | pièce                     |
| `entretien`               | Entretien & Lessive                 | pièce                     |
| `cuisine-maison`          | Cuisine & Maison                    | pièce                     |
| `bebe`                    | Bébé                                | pièce                     |
| `animaux`                 | Animaux                             | pièce                     |
| `autres`                  | Autres _(système, non supprimable)_ | pièce                     |
| `achats-ponctuels`        | Achats ponctuels _(système)_        | pièce                     |

## 3. Modèles de magasins

Le même catalogue de catégories, regroupé différemment : c'est ce qui permet de coller à la réalité de chaque magasin. Dans les tableaux, une catégorie est **principale** dans son rayon sauf mention _(secondaire)_ (voir [02 § 4](02-modele-metier.md#catégorie-présente-dans-plusieurs-rayons)).

### « Hypermarché »

| #   | Rayon                    | Catégories                                                                                                                                                |
| --- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Fruits & Légumes         | fruits, legumes, herbes-aromatiques                                                                                                                       |
| 2   | Boulangerie & Pâtisserie | pain-viennoiseries, biscuits-gateaux _(secondaire)_                                                                                                       |
| 3   | Boucherie à la coupe     | viande, volaille                                                                                                                                          |
| 4   | Charcuterie à la coupe   | charcuterie                                                                                                                                               |
| 5   | Poissonnerie             | poisson-fruits-de-mer                                                                                                                                     |
| 6   | Fromagerie à la coupe    | fromages                                                                                                                                                  |
| 7   | Terroir                  | viande _(secondaire)_, charcuterie _(secondaire)_, fromages _(secondaire)_                                                                                |
| 8   | Frais libre-service      | traiteur, oeufs, lait-creme-beurre, yaourts-desserts, viande _(secondaire)_, volaille _(secondaire)_, charcuterie _(secondaire)_, fromages _(secondaire)_ |
| 9   | Épicerie salée           | pates-riz-feculents, conserves-bocaux, sauces-condiments, huiles-vinaigres                                                                                |
| 10  | Cuisine du monde         | cuisine-du-monde                                                                                                                                          |
| 11  | Apéritif                 | aperitif                                                                                                                                                  |
| 12  | Épicerie sucrée          | farine-sucre-patisserie, petit-dejeuner, biscuits-gateaux, chocolat-confiserie, confitures-tartiner, cafe-the                                             |
| 13  | Boissons                 | eaux, jus-sodas                                                                                                                                           |
| 14  | Cave                     | alcools                                                                                                                                                   |
| 15  | Surgelés                 | surgeles, glaces                                                                                                                                          |
| 16  | Hygiène & Beauté         | hygiene-beaute, papier-mouchoirs                                                                                                                          |
| 17  | Bébé                     | bebe                                                                                                                                                      |
| 18  | Entretien & Maison       | entretien, cuisine-maison                                                                                                                                 |
| 19  | Animaux                  | animaux                                                                                                                                                   |
| —   | Non classé               | autres + toute catégorie non rattachée                                                                                                                    |

### « Supermarché »

| #   | Rayon                  | Catégories                                                                                                    |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | Fruits & Légumes       | fruits, legumes, herbes-aromatiques                                                                           |
| 2   | Boulangerie            | pain-viennoiseries                                                                                            |
| 3   | Boucherie              | viande, volaille                                                                                              |
| 4   | Poissonnerie           | poisson-fruits-de-mer                                                                                         |
| 5   | Charcuterie & Traiteur | charcuterie, traiteur, viande _(secondaire)_                                                                  |
| 6   | Crèmerie               | oeufs, lait-creme-beurre, yaourts-desserts                                                                    |
| 7   | Fromages               | fromages                                                                                                      |
| 8   | Épicerie salée         | pates-riz-feculents, conserves-bocaux, sauces-condiments, huiles-vinaigres, cuisine-du-monde                  |
| 9   | Apéritif               | aperitif                                                                                                      |
| 10  | Épicerie sucrée        | farine-sucre-patisserie, petit-dejeuner, biscuits-gateaux, chocolat-confiserie, confitures-tartiner, cafe-the |
| 11  | Boissons               | eaux, jus-sodas, alcools                                                                                      |
| 12  | Surgelés               | surgeles, glaces                                                                                              |
| 13  | Hygiène                | hygiene-beaute, papier-mouchoirs, bebe                                                                        |
| 14  | Entretien & Maison     | entretien, cuisine-maison, animaux                                                                            |
| —   | Non classé             | autres + toute catégorie non rattachée                                                                        |

### « Supérette »

| #   | Rayon            | Catégories                                                                                                                                                                                                            |
| --- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Fruits & Légumes | fruits, legumes, herbes-aromatiques                                                                                                                                                                                   |
| 2   | Frais            | viande, volaille, charcuterie, poisson-fruits-de-mer, traiteur, oeufs, lait-creme-beurre, yaourts-desserts, fromages                                                                                                  |
| 3   | Épicerie         | pates-riz-feculents, conserves-bocaux, aperitif, sauces-condiments, huiles-vinaigres, cuisine-du-monde, farine-sucre-patisserie, petit-dejeuner, biscuits-gateaux, chocolat-confiserie, confitures-tartiner, cafe-the |
| 4   | Boissons         | eaux, jus-sodas, alcools                                                                                                                                                                                              |
| 5   | Surgelés         | surgeles, glaces                                                                                                                                                                                                      |
| 6   | Droguerie        | hygiene-beaute, papier-mouchoirs, entretien, cuisine-maison, bebe, animaux                                                                                                                                            |
| —   | Non classé       | autres, pain-viennoiseries…                                                                                                                                                                                           |

### « Marché »

| #   | Rayon                | Catégories                          |
| --- | -------------------- | ----------------------------------- |
| 1   | Primeur              | fruits, legumes, herbes-aromatiques |
| 2   | Fromager             | fromages, oeufs, lait-creme-beurre  |
| 3   | Boucher / charcutier | viande, volaille, charcuterie       |
| 4   | Poissonnier          | poisson-fruits-de-mer               |
| 5   | Boulanger            | pain-viennoiseries                  |
| —   | Non classé           | tout le reste                       |

Au premier lancement, un magasin **« Mon supermarché »** est créé à partir du modèle « Supermarché ».

## 3 bis. Rendements de recette proposés

`personnes` (par défaut), `cake`, `tarte`, `gâteau`, `fournée`, `bocal`, `pot`, `portion`, et saisie libre.

## 4. Catalogue de départ

- **~1 000 articles** courants en France, répartis dans toutes les catégories. Un grand catalogue limite les créations manuelles, donc les doublons au moment du partage ([02 § 9](02-modele-metier.md#9-partage-dune-liste)).
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
  Ajouter l'anglais plus tard = ajouter `"en": …` dans ces champs (ou un fichier `catalog.en.json` fusionné au build), sans migration des données utilisateur.
- `key` = clé catalogue : identifiant technique **sans langue**, écrit sous forme de slug français pour rester lisible, **figé pour toujours** (même si le libellé change dans une version future). Il n'est jamais affiché.
- `types` uniquement quand c'est utile (pommes, pommes de terre, lait, farine…), sinon absent.
- `aliases` : synonymes, abréviations (`pdt`), marques passées dans le langage courant (`sopalin`, `kleenex`, `coca`), variantes régionales (`chocolatine`), orthographes alternatives (`nuoc mam`).
- **Même structure pour les catégories et les unités** : `key` sans langue + `name` (et pluriel, abréviation pour les unités) par langue.
- _Plus tard (D3)_ : `season` pour les fruits et légumes, liste des mois de saison (`[9, 10, 11, 12, 1, 2]`).
- **Production** : généré par l'agent IA pendant le développement, puis **relu par catégorie** avant validation. C'est la donnée qui fait la qualité perçue de l'app.
- Livraison progressive : ~150 articles dès la phase données (238 livrés, relus le 9 novembre 2026), le catalogue complet avant la fin de la v1.0.

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

Règles : comparaison sur les mots du slug ; première règle trouvée gagnante ; mots plus spécifiques avant mots génériques. Si rien ne correspond : catégorie « Autres », unité « pièce », icône de la catégorie ou monogramme.

Les choix de l'utilisateur ne modifient pas le dictionnaire : ils sont enregistrés sur l'article lui-même.

## 6. Pack d'icônes

Voir [05 § 4](05-identite-visuelle.md#4-icônes). Une icône dessinée par article du catalogue (236, `src/icons/drawn/`, visibles dans la maquette `#/dev/ui`), chacune avec ses **mots-clés en français** (nom, alias et types de l'article) pour la recherche dans le sélecteur.

## 7. Mise à jour du catalogue sans réinstaller

Le catalogue embarqué a un numéro de version (`CATALOG_VERSION`, `src/data/catalog.ts`), gardé dans les réglages de l'app (`Settings.catalogVersion`). Une catégorie ou un article ajouté au catalogue porte `since` : la version qui l'a introduit (absent : 1).

Au lancement, si le catalogue de l'app est plus récent que celui de la base (`src/db/catalogUpdate.ts`) :

- les catégories et articles apparus depuis sont **ajoutés**, sauf s'ils existent déjà (même clé, ou même nom pour un article créé à la main) ;
- rien de ce que l'utilisateur a créé, modifié ou supprimé n'est touché : un article du catalogue qu'il a supprimé ne revient pas ;
- une nouvelle catégorie n'est rangée dans aucun rayon : elle apparaît dans les « Catégories non rattachées » de chaque magasin (G3).

Les changements apportés à un article existant (nouveaux types, autre unité) ne sont pas recopiés : l'utilisateur les a peut-être modifiés. Plus besoin de réinstaller l'app pour profiter des nouveautés.

| Version | Ajouts                                                                                         |
| ------- | ---------------------------------------------------------------------------------------------- |
| 2       | Catégorie « Sel, Poivre & Épices » ; articles Gnocchis, Brandade de morue, Conserves au choix. |
