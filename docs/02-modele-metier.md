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
- un **identifiant** interne, invisible, qui ne change jamais (même après renommage) ;
- un **libellé** affiché, librement modifiable ;
- pour les articles, catégories et unités : un **slug**, version normalisée du libellé, qui sert à détecter les doublons, à la recherche et à reconnaître les objets lors d'un import.

### Règles de `slugify`
1. Minuscules.
2. Suppression des accents (`é` → `e`, `ç` → `c`).
3. Ligatures : `œ` → `oe`, `æ` → `ae`.
4. Tout caractère non alphanumérique (espaces, apostrophes, ponctuation) → `-`, tirets multiples fusionnés, tirets en début/fin supprimés.

| Libellé | Slug |
|---|---|
| `Œufs bio` | `oeufs-bio` |
| `Crème fraîche épaisse` | `creme-fraiche-epaisse` |
| `Sauce nuoc-mâm` | `sauce-nuoc-mam` |
| `Pâte à tartiner` | `pate-a-tartiner` |
| `  Lait   1/2 écrémé ` | `lait-1-2-ecreme` |

### Règles d'unicité
- Deux articles ne peuvent pas avoir le même slug. Créer « tomates » quand « Tomates » existe → l'app propose l'article existant.
- Renommer un article met à jour son slug ; si le nouveau slug est déjà pris, l'app propose de **fusionner** les deux articles.
- Même règle pour les catégories et les unités.

### Recherche (distinct du slug)
Pour la recherche, on utilise en plus une **clé de recherche** plus tolérante : slug + singulier approximatif (suppression d'un `s` ou `x` final par mot). Ainsi `tomate` trouve *Tomates*, `oeuf` trouve *Œufs*. Cette clé n'est jamais utilisée pour l'unicité.

---

## 2. Article

Un produit que l'on achète.

| Propriété | Obligatoire | Description |
|---|---|---|
| Libellé | ✅ | « Pommes » |
| Slug | ✅ (calculé) | `pommes` |
| Catégorie | ✅ | « Fruits ». Par défaut « Autres » si l'app ne devine pas |
| Unité par défaut | ✅ | « kg ». Devinée à la création (voir 06), modifiable |
| Types | — | Liste des variétés possibles, **vide par défaut** : `Gala`, `Golden`, `Granny Smith`, `Pink Lady` |
| Icône | — | Icône choisie ; si absente, l'app en déduit une ou affiche un monogramme (voir 05) |
| Alias | — | Autres noms pour la recherche : `pdt` pour *Pommes de terre* |
| Favori | — | Épinglé dans les « Habituels » |
| Clé catalogue | — | Présente si l'article vient du catalogue de départ (voir § 10) ; ne change jamais |

**Suppression** : possible ; si l'article est utilisé dans des listes ou des recettes, l'app le signale et propose de le retirer de celles-ci ou d'annuler.

**Fusion** : deux articles peuvent être fusionnés (ex. doublon créé lors d'un import). Les lignes, ingrédients et l'historique du second sont transférés au premier.

---

## 3. Catégorie

Le type d'un article, **indépendant de tout magasin**. Volontairement **fine** (une trentaine, voir 06) pour pouvoir être regroupée différemment selon les magasins.

| Propriété | Description |
|---|---|
| Libellé, slug | « Charcuterie », `charcuterie` |
| Icône, couleur | Pour l'affichage dans le catalogue |

- La catégorie **« Autres »** existe toujours et ne peut pas être supprimée.
- Supprimer une catégorie : ses articles passent dans une catégorie choisie (« Autres » par défaut).
- Deux catégories peuvent être fusionnées.

---

## 4. Magasin et rayons

### Le problème
Tous les magasins n'ont pas les mêmes rayons. Dans un hypermarché, la charcuterie a son propre rayon ; dans une supérette, elle est dans un « Frais » générique avec les yaourts ; ailleurs, les conserves et l'apéritif partagent le même rayon. **Un rayon est donc un regroupement de catégories propre à chaque magasin.**

### Magasin
| Propriété | Description |
|---|---|
| Libellé | « Carrefour Market », « Marché du samedi » |
| Rayons | Liste **ordonnée** selon le parcours |
| Ordre verrouillé | Si oui, l'apprentissage automatique ne modifie plus l'ordre |

À la création d'un magasin, on part :
- d'un **modèle** (« Supermarché », « Supérette », « Marché », voir 06) ;
- ou d'une **copie** d'un magasin existant ;
- ou de **zéro** (un seul rayon « Non classé »).

Le dernier magasin créé ou utilisé est proposé par défaut.

### Rayon
| Propriété | Description |
|---|---|
| Libellé | « Frais libre-service » |
| Icône, couleur | Pour l'en-tête dans la liste |
| Catégories | Les catégories regroupées dans ce rayon |
| Position | Sa place dans le parcours du magasin |

Règles :
- **Dans un magasin, une catégorie appartient à un seul rayon au maximum.**
- Chaque magasin possède un rayon spécial **« Non classé »**, toujours affiché en dernier, qui reçoit les catégories que l'on n'a rattachées à aucun rayon (ex. une catégorie créée après le magasin).
- On peut créer, renommer, réordonner, fusionner, scinder et supprimer des rayons. Supprimer un rayon renvoie ses catégories dans « Non classé ».

### Exception par article
Un article peut être placé dans un autre rayon **pour un magasin donné** (« chez Lidl, les œufs sont en épicerie »). L'exception l'emporte sur sa catégorie.

### Rayon effectif d'un article dans un magasin
```
1. exception de l'article pour ce magasin, si elle existe
2. sinon, le rayon du magasin qui contient la catégorie de l'article
3. sinon, « Non classé »
```

### Déplacer un article en magasin
Quand on déplace un article vers un autre rayon (en mode courses ou en édition), l'app demande :
- **« Toute la catégorie *Charcuterie* dans ce magasin »** → la catégorie change de rayon ;
- **« Seulement *Jambon blanc* dans ce magasin »** → exception pour cet article.

---

## 5. Unité

La façon de compter un article. Les unités sont **éditables** (on peut ajouter « botte », « barquette », « tranche »).

| Propriété | Exemple `kg` | Exemple `pièce` |
|---|---|---|
| Libellé singulier / pluriel | kilogramme / kilogrammes | pièce / pièces |
| Abréviation | kg | — (affichage `× 3`) |
| Dimension | masse | autre |
| Facteur vers l'unité de base de la dimension | 1000 (base : g) | — |
| Pas | 0,1 | 1 |

Dimensions : **masse** (base g), **volume** (base ml), **autre** (pièce, pack, boîte, bouteille, sachet, botte…).

Règles :
- Deux unités sont **convertibles** si elles ont la même dimension et que cette dimension n'est pas « autre » (g ↔ kg, cl ↔ l). Une boîte et une bouteille ne sont jamais convertibles.
- Le **pas** sert aux boutons `+`/`−` et à l'arrondi des recettes.
- Supprimer une unité utilisée impose de choisir une unité de remplacement.

---

## 6. Liste et lignes

### Liste
| Propriété | Description |
|---|---|
| Libellé | « Courses de la semaine », « Anniversaire » |
| Dernier magasin utilisé | Mémorisé pour l'affichage, mais **la liste n'appartient à aucun magasin** : on choisit le magasin au moment de l'afficher ou de partir |

### Ligne
| Propriété | Obligatoire | Description |
|---|---|---|
| Article | ✅ | Le libellé est toujours lu depuis l'article, jamais recopié |
| Quantité | ✅ | 1 par défaut (ou le pas de l'unité) |
| Unité | ✅ | Par défaut, l'unité par défaut de l'article ; modifiable |
| Types acceptés | — | Sous-ensemble des types de l'article. **Vide = peu importe** |
| Note | — | « bio », « la marque verte » |
| Statut | ✅ | à acheter / dans le caddie / introuvable |
| Origine | — | « via recette Raclette (6 pers.) » |

**Affichage des types acceptés** : vide → rien ; un type → « Gala uniquement » ; plusieurs → « Gala ou Golden ». On peut ajouter un nouveau type à la volée depuis la ligne ; il est alors ajouté aux types de l'article.

### Une seule ligne par article dans une liste
Quand on ajoute un article **déjà présent** dans la liste, l'app **ne modifie rien d'office** : elle affiche « Déjà dans la liste : 2 kg » avec deux choix :
- **Ajouter** une quantité (sélecteur prérempli avec la quantité saisie, ou le pas de l'unité) ;
- **Ne rien faire** (choix par défaut : `Entrée` ou fermer = ne rien faire).

Fusion des quantités quand on choisit « Ajouter » (ou lors d'un ajout de recette) :
- même unité → addition ;
- unités convertibles → conversion dans l'unité de la ligne existante (300 g + 1 kg = 1,3 kg) ;
- unités non convertibles (3 pièces + 200 g) → l'app propose : garder l'existant, remplacer, ou ajouter la seconde quantité en note.

---

## 7. Recette

| Propriété | Description |
|---|---|
| Libellé, icône | « Raclette », 🧀 |
| Nombre de personnes | Référence des quantités (ex. 4) |
| Ingrédients | Article + quantité + unité + types acceptés + « facultatif » |
| Étapes / notes | Texte libre, facultatif |

### Ajouter une recette à une liste
1. Choisir la liste, puis **« Pour combien de personnes ? »** (prérempli avec le nombre de la recette).
2. Les quantités sont recalculées : `quantité × personnes demandées ÷ personnes de la recette`, puis **arrondies au pas supérieur de l'unité** (3 personnes au lieu de 4 pour 2 oignons → 1,5 → 2 oignons ; 375 g de farine avec un pas de 10 g → 380 g).
3. Aperçu des ingrédients avec cases à cocher (on décoche ce qu'on a déjà ; les ingrédients facultatifs sont décochés par défaut) et indication des articles déjà présents dans la liste.
4. Validation → ajout ou fusion des lignes (règles du § 6), avec l'origine « via recette ».

---

## 8. Courses et historique

- Une **session de courses** commence quand on lance le mode magasin sur une liste avec un magasin, et se termine quand on la clôture.
- Chaque article coché est enregistré dans l'**historique** : article, magasin, rayon, date et heure.
- À la clôture : les lignes cochées quittent la liste ; les lignes « introuvables » et non cochées restent.
- L'historique alimente l'**apprentissage de l'ordre des rayons** et les **suggestions anti-oubli** (voir 07 § 7).

---

## 9. Partage d'une liste

Simple, sans serveur : on **envoie** une liste à quelqu'un (conjoint), qui l'**importe** dans son app. Pas de synchronisation.

### Contenu envoyé
Le partage est **autonome** : chaque ligne embarque la description complète de son article (libellé, slug, clé catalogue éventuelle, catégorie, unité, types, icône), en plus de la quantité, des types acceptés et de la note. **Aucun magasin n'est inclus** : le destinataire choisit le sien.

### Import chez le destinataire
1. Il choisit : créer une nouvelle liste, ou fusionner dans une liste existante.
2. Pour chaque article reçu, l'app cherche une correspondance dans **son** catalogue :
   1. même **clé catalogue** (article issu du catalogue de départ) ;
   2. sinon même **slug** ;
   3. sinon un article ressemblant (recherche floue) → proposé, à confirmer ;
   4. sinon → **l'article est créé** chez le destinataire avec les informations reçues.
3. Même logique pour la catégorie et l'unité de chaque article créé (par slug ; créées si inconnues).
4. Un **écran d'aperçu** résume avant validation : « 12 articles reconnus, 2 nouveaux articles seront créés, 1 correspondance à confirmer ».

## 10. Catalogue de départ

Faut-il que les articles soient « partagés par tous », donc écrits dans le code ? **Oui, mais seulement comme point de départ.**
- L'app embarque un **catalogue de départ** (~400-600 articles, catégories, unités, modèles de magasins ; voir 06), comme des données par défaut.
- Au premier lancement, il est **copié** dans les données de l'utilisateur. Ensuite, ce sont ses données : il les modifie, supprime, complète librement.
- Chaque article copié garde sa **clé catalogue**. Comme deux utilisateurs de l'app partent du même catalogue, la grande majorité des articles partagés sont reconnus à coup sûr, même si l'un d'eux a renommé l'article.
- Lors d'une mise à jour de l'app qui enrichit le catalogue, seuls les **nouveaux** articles sont proposés à l'ajout ; les articles existants de l'utilisateur ne sont jamais écrasés.
