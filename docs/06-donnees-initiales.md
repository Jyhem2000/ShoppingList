# 06 — Données initiales

Données embarquées dans l'app et copiées dans les données de l'utilisateur au premier lancement (voir [02 § 10](02-modele-metier.md#10-catalogue-de-départ)). Toutes sont ensuite modifiables.

Fichiers prévus dans `src/data/` : `categories.json`, `units.json`, `store-templates.json`, `catalog.json`, `keywords.json`, `icon-pack.json`.

---

## 1. Unités

| Slug | Libellé (sing. / plur.) | Abrév. | Dimension | Facteur | Pas |
|---|---|---|---|---|---|
| `piece` | pièce / pièces | — (`× n`) | autre | — | 1 |
| `g` | gramme / grammes | g | masse | 1 | 50 |
| `kg` | kilogramme / kilogrammes | kg | masse | 1000 | 0,5 |
| `ml` | millilitre / millilitres | ml | volume | 1 | 50 |
| `cl` | centilitre / centilitres | cl | volume | 10 | 5 |
| `l` | litre / litres | l | volume | 1000 | 0,5 |
| `pack` | pack / packs | pack | autre | — | 1 |
| `boite` | boîte / boîtes | boîte | autre | — | 1 |
| `bouteille` | bouteille / bouteilles | bout. | autre | — | 1 |
| `sachet` | sachet / sachets | sachet | autre | — | 1 |
| `paquet` | paquet / paquets | paquet | autre | — | 1 |
| `pot` | pot / pots | pot | autre | — | 1 |
| `botte` | botte / bottes | botte | autre | — | 1 |
| `barquette` | barquette / barquettes | barq. | autre | — | 1 |
| `tranche` | tranche / tranches | tr. | autre | — | 1 |
| `rouleau` | rouleau / rouleaux | rouleau | autre | — | 1 |

Pour les recettes, de petites unités sont utiles : `c-a-s` (cuillère à soupe), `c-a-c` (cuillère à café), `pincee` — dimension « autre », non convertibles.

## 2. Catégories (~35)

Volontairement fines pour être regroupées différemment selon les magasins. Unité par défaut suggérée pour les nouveaux articles de la catégorie.

| Slug | Libellé | Unité par défaut suggérée |
|---|---|---|
| `fruits` | Fruits | kg |
| `legumes` | Légumes | kg |
| `herbes-aromatiques` | Herbes aromatiques | botte |
| `pain-viennoiseries` | Pain & viennoiseries | pièce |
| `viande` | Viande | g |
| `volaille` | Volaille | g |
| `charcuterie` | Charcuterie | paquet |
| `poisson-fruits-de-mer` | Poisson & fruits de mer | g |
| `traiteur` | Traiteur & plats préparés | barquette |
| `oeufs` | Œufs | boîte |
| `lait-creme-beurre` | Lait, crème & beurre | pièce |
| `yaourts-desserts` | Yaourts & desserts frais | pack |
| `fromages` | Fromages | pièce |
| `pates-riz-feculents` | Pâtes, riz & féculents | paquet |
| `conserves-bocaux` | Conserves & bocaux | boîte |
| `sauces-condiments` | Sauces, condiments & épices | pot |
| `huiles-vinaigres` | Huiles & vinaigres | bouteille |
| `aperitif` | Apéritif | sachet |
| `cuisine-du-monde` | Cuisine du monde | pièce |
| `farine-sucre-patisserie` | Farine, sucre & pâtisserie | paquet |
| `petit-dejeuner` | Céréales & petit-déjeuner | paquet |
| `biscuits-gateaux` | Biscuits & gâteaux | paquet |
| `chocolat-confiserie` | Chocolat & confiserie | pièce |
| `confitures-tartiner` | Confitures & pâtes à tartiner | pot |
| `cafe-the` | Café & thé | paquet |
| `eaux` | Eaux | pack |
| `jus-sodas` | Jus & sodas | bouteille |
| `alcools` | Bières, vins & alcools | bouteille |
| `surgeles` | Surgelés | sachet |
| `glaces` | Glaces | pièce |
| `hygiene-beaute` | Hygiène & beauté | pièce |
| `papier-mouchoirs` | Papier toilette & mouchoirs | paquet |
| `entretien` | Entretien & lessive | pièce |
| `cuisine-maison` | Cuisine & maison (sacs, alu, piles…) | pièce |
| `bebe` | Bébé | pièce |
| `animaux` | Animaux | pièce |
| `autres` | Autres *(système, non supprimable)* | pièce |

## 3. Modèles de magasins

Le même catalogue de catégories, regroupé différemment : c'est ce qui permet de coller à la réalité de chaque magasin.

### « Supermarché »
| # | Rayon | Catégories |
|---|---|---|
| 1 | Fruits & légumes | fruits, legumes, herbes-aromatiques |
| 2 | Boulangerie | pain-viennoiseries |
| 3 | Boucherie | viande, volaille |
| 4 | Poissonnerie | poisson-fruits-de-mer |
| 5 | Charcuterie & traiteur | charcuterie, traiteur |
| 6 | Crèmerie | oeufs, lait-creme-beurre, yaourts-desserts |
| 7 | Fromages | fromages |
| 8 | Épicerie salée | pates-riz-feculents, conserves-bocaux, sauces-condiments, huiles-vinaigres, cuisine-du-monde |
| 9 | Apéritif | aperitif |
| 10 | Épicerie sucrée | farine-sucre-patisserie, petit-dejeuner, biscuits-gateaux, chocolat-confiserie, confitures-tartiner, cafe-the |
| 11 | Boissons | eaux, jus-sodas, alcools |
| 12 | Surgelés | surgeles, glaces |
| 13 | Hygiène | hygiene-beaute, papier-mouchoirs, bebe |
| 14 | Entretien & maison | entretien, cuisine-maison, animaux |
| — | Non classé | autres + toute catégorie non rattachée |

### « Supérette »
| # | Rayon | Catégories |
|---|---|---|
| 1 | Fruits & légumes | fruits, legumes, herbes-aromatiques |
| 2 | Frais | viande, volaille, charcuterie, poisson-fruits-de-mer, traiteur, oeufs, lait-creme-beurre, yaourts-desserts, fromages |
| 3 | Épicerie | pates-riz-feculents, conserves-bocaux, aperitif, sauces-condiments, huiles-vinaigres, cuisine-du-monde, farine-sucre-patisserie, petit-dejeuner, biscuits-gateaux, chocolat-confiserie, confitures-tartiner, cafe-the |
| 4 | Boissons | eaux, jus-sodas, alcools |
| 5 | Surgelés | surgeles, glaces |
| 6 | Droguerie | hygiene-beaute, papier-mouchoirs, entretien, cuisine-maison, bebe, animaux |
| — | Non classé | autres, pain-viennoiseries… |

### « Marché »
| # | Rayon | Catégories |
|---|---|---|
| 1 | Primeur | fruits, legumes, herbes-aromatiques |
| 2 | Fromager | fromages, oeufs, lait-creme-beurre |
| 3 | Boucher / charcutier | viande, volaille, charcuterie |
| 4 | Poissonnier | poisson-fruits-de-mer |
| 5 | Boulanger | pain-viennoiseries |
| — | Non classé | tout le reste |

Au premier lancement, un magasin **« Mon supermarché »** est créé à partir du modèle « Supermarché ».

## 4. Catalogue de départ

- **~400 à 600 articles** courants en France, répartis dans toutes les catégories.
- Format de chaque entrée :
  ```json
  {
    "key": "pommes",
    "name": "Pommes",
    "category": "fruits",
    "unit": "kg",
    "types": ["Gala", "Golden", "Granny Smith", "Pink Lady", "Reine des reinettes"],
    "icon": "red-apple",
    "aliases": ["pomme"]
  }
  ```
- `key` = clé catalogue, **stable pour toujours** (même si le libellé change dans une version future).
- `types` uniquement quand c'est utile (pommes, pommes de terre, lait, farine…), sinon absent.
- **Production** : généré par l'agent IA pendant le développement, puis **relu par catégorie** avant validation. C'est la donnée qui fait la qualité perçue de l'app.

## 5. Dictionnaire de mots-clés

Sert à deviner, pour un **article créé par l'utilisateur** (absent du catalogue), sa catégorie, son unité et son icône.

```json
[
  { "match": ["sauce", "ketchup", "mayonnaise", "moutarde", "pesto"], "category": "sauces-condiments", "unit": "pot", "icon": "jar" },
  { "match": ["jambon", "saucisson", "chorizo", "lardons", "rillettes"], "category": "charcuterie", "unit": "paquet", "icon": "cut-of-meat" },
  { "match": ["jus"], "category": "jus-sodas", "unit": "bouteille", "icon": "beverage-box" }
]
```
Règles : comparaison sur les mots du slug ; première règle trouvée gagnante ; mots plus spécifiques avant mots génériques. Si rien ne correspond : catégorie « Autres », unité « pièce », icône de la catégorie ou monogramme.

Les choix de l'utilisateur ne modifient pas le dictionnaire : ils sont enregistrés sur l'article lui-même.

## 6. Pack d'icônes

Voir [05 § 4](05-identite-visuelle.md#4-icônes). Liste des icônes embarquées (~300 à 500, alimentation, boissons, maison, hygiène, bébé, animaux), chacune avec ses **mots-clés en français** pour la recherche dans le sélecteur.
