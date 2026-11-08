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
2. Suppression des accents (`é` → `e`, `ç` → `c`).
3. Ligatures : `œ` → `oe`, `æ` → `ae`.
4. Tout caractère non alphanumérique (espaces, apostrophes, ponctuation) → `-`, tirets multiples fusionnés, tirets en début/fin supprimés.

| Libellé | Slug |
|---|---|
| `Œufs bio` | `oeufs-bio` |
| `Crème fraîche épaisse` | `creme-fraiche-epaisse` |
| `Sauce nuoc-mâm` | `sauce-nuoc-mam` |
| `  Lait   1/2 écrémé ` | `lait-1-2-ecreme` |

### Slug « en français ou en anglais » ?
**Ni l'un ni l'autre : `slugify` ne traduit rien**, il normalise seulement les caractères du libellé tel qu'il est écrit. L'app étant en français, les libellés et donc les slugs sont en français. Conséquences :
- aucune pour l'unicité et la recherche ;
- le slug ne reconnaît pas les synonymes (« Coca » et « Coca-Cola » ont des slugs différents) → c'est le rôle des **alias** (§ 2) et du **catalogue de départ** (§ 10) ;
- les clés du catalogue de départ sont des slugs français figés (`pommes`, `coca-cola`) : ce sont de simples identifiants techniques lisibles, qui ne changent jamais.

### Règles d'unicité
- Deux articles ne peuvent pas avoir le même slug. Créer « tomates » quand « Tomates » existe → l'app propose l'article existant.
- Un libellé saisi qui correspond à l'**alias** d'un article existant (« coca » → *Coca-Cola*) → l'app propose aussi l'article existant.
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
| Types | — | Liste des variétés possibles, **vide par défaut** : `Gala`, `Golden`, `Granny Smith` |
| Alias | — | Autres noms : synonymes, abréviations, marques passées dans le langage courant, variantes régionales (voir ci-dessous) |
| Icône | — | Icône choisie ; si absente, l'app en déduit une ou affiche un monogramme (voir 05) |
| Favori | — | Épinglé dans les « Habituels » |
| Mois de saison | — | *Plus tard* — fruits et légumes uniquement : mois où l'article est de saison (D3) |
| Clé catalogue | — | Présente si l'article vient du catalogue de départ (§ 10) ; ne change jamais |

### Alias
Les alias évitent les doublons et rendent la recherche naturelle. Exemples :
| Article | Alias |
|---|---|
| Coca-Cola | coca, coca cola |
| Pain au chocolat | chocolatine |
| Essuie-tout | sopalin |
| Mouchoirs | kleenex |
| Pommes de terre | pdt, patates |
| Sauce nuoc-mâm | nuoc mam, sauce poisson |

- Ils sont fournis par le catalogue de départ et **s'enrichissent automatiquement** : quand, lors d'un import, l'utilisateur indique qu'un article reçu « est le même que » un des siens, le libellé reçu devient un alias de son article (§ 9).
- Pas d'alias anglais systématiques : l'app est en français. Les anglicismes courants (cookies, chips, ketchup) sont déjà des libellés français.
- Une marque précise que l'on veut **vraiment** (« Nutella, pas une autre ») se gère plutôt comme un **type** de l'article (*Pâte à tartiner* → type *Nutella*).

**Suppression** : possible ; si l'article est utilisé dans des listes ou des recettes, l'app le signale et propose de le retirer de celles-ci ou d'annuler.

**Fusion** : deux articles peuvent être fusionnés (ex. doublon créé lors d'un import). Les lignes, ingrédients et l'historique du second sont transférés au premier, et le libellé du second devient un alias du premier.

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
Tous les magasins n'ont pas les mêmes rayons. Dans une supérette, la charcuterie est dans un « Frais » générique avec les yaourts ; ailleurs, les conserves et l'apéritif partagent le même rayon ; dans un hypermarché, la viande se trouve à la fois au rayon boucherie à la coupe, en libre-service au rayon frais et au rayon terroir. **Un rayon est donc un regroupement de catégories propre à chaque magasin, et une catégorie peut se trouver dans plusieurs rayons.**

### Magasin
| Propriété | Description |
|---|---|
| Libellé | « Carrefour Market », « Marché du samedi » |
| Rayons | Liste **ordonnée** selon le parcours |
| Ordre verrouillé | Si oui, l'apprentissage automatique ne modifie plus l'ordre |

À la création d'un magasin, on part :
- d'un **modèle** (« Hypermarché », « Supermarché », « Supérette », « Marché », voir 06) ;
- ou d'une **copie** d'un magasin existant ;
- ou de **zéro** (un seul rayon « Non classé »).

### Rayon
| Propriété | Description |
|---|---|
| Libellé | « Frais libre-service » |
| Icône, couleur | Pour l'en-tête dans la liste |
| Catégories | Les catégories présentes dans ce rayon, chacune marquée **principale** ou **secondaire** |
| Position | Sa place dans le parcours du magasin |

### Catégorie présente dans plusieurs rayons
Dans un magasin, une catégorie peut être rattachée à **plusieurs rayons** :
- **un seul rayon principal** : c'est là que vont par défaut les articles de cette catégorie ;
- **des rayons secondaires** : la catégorie y est aussi présente.

Exemple « Hypermarché » : *Viande* → principal **Boucherie** ; secondaires **Frais libre-service** et **Terroir**.

À quoi servent les rayons secondaires :
- lors d'un déplacement d'article (ci-dessous), ils sont proposés en premier ;
- un article de la catégorie peut être placé dans l'un d'eux (exception par article) : *Steak haché* → Frais libre-service, *Rôti* → Boucherie (principal), *Terrine* → Terroir.

L'ajout d'un article ne pose **jamais** de question : il va dans le rayon principal ou dans son exception si elle existe. On corrige d'un geste en magasin, et l'app s'en souvient.

> Si un même produit existe vraiment à deux endroits (jambon à la coupe ou en barquette), ce sont en pratique deux articles différents (*Jambon à la coupe*, *Jambon blanc*), ou un type (*à la coupe*).

Autres règles :
- Chaque magasin possède un rayon spécial **« Non classé »**, toujours en dernier, qui reçoit les catégories rattachées à aucun rayon.
- On peut créer, renommer, réordonner, fusionner, scinder et supprimer des rayons. Supprimer un rayon renvoie les catégories dont il était le rayon principal dans « Non classé » (ou vers un de leurs rayons secondaires, au choix).

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
- **« Seulement *Steak haché* dans ce magasin »** → exception pour cet article ;
- **« Toute la catégorie *Viande* dans ce magasin »** → ce rayon devient le rayon principal de la catégorie (l'ancien devient secondaire).

---

## 5. Unité

La façon de compter un article. Les unités sont **éditables** (on peut ajouter « botte », « barquette », « tranche »).

| Propriété | Exemple `kg` | Exemple `pièce` |
|---|---|---|
| Libellé singulier / pluriel | kilogramme / kilogrammes | pièce / pièces |
| Abréviation | kg | — (affichage `× 3`) |
| Dimension | masse | autre |
| Facteur vers l'unité de base de la dimension | 1000 (base : g) | — |
| Pas | 0,5 | 1 |

Dimensions : **masse** (base g), **volume** (base ml), **autre** (pièce, pack, boîte, bouteille, sachet, botte…).

### Conversions
- Deux unités sont **convertibles** si elles ont la même dimension et que cette dimension n'est pas « autre » (g ↔ kg, cl ↔ l). Une boîte et une bouteille ne sont jamais convertibles.
- **Changer l'unité d'une ligne convertit la quantité** quand c'est possible : 1200 g → passer en kg → **1,2 kg** (et non 1200 kg). Si les unités ne sont pas convertibles, la quantité est conservée telle quelle.
- **Simplification des quantités** (réglage, activée par défaut) : une quantité est exprimée dans **la plus grande unité de même dimension qui donne une valeur ≥ 1 avec 3 décimales au plus**. Exemples : 1200 g → 1,2 kg ; 1250 ml → 1,25 l ; 250 g reste 250 g ; 33 cl reste 33 cl. Appliquée après une saisie, une fusion ou un calcul de recette, avec un message « Converti en 1,2 kg — Annuler ».
- Le **pas** sert aux boutons `+`/`−` et à l'arrondi des recettes.
- Supprimer une unité utilisée impose de choisir une unité de remplacement.

> Conversions **entre dimensions** (200 g de farine ≈ combien de verres ?) : voir l'idée « Convertisseur d'unités » en [03 § Idées](03-fonctionnalites.md#idées-non-planifiées).

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
| Unité | ✅ | Par défaut, l'unité par défaut de l'article ; modifiable (avec conversion, § 5) |
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
- unités convertibles → conversion puis addition (300 g + 1 kg = 1,3 kg), puis simplification (§ 5) ;
- unités non convertibles (3 pièces + 200 g) → l'app propose : garder l'existant, remplacer, ou ajouter la seconde quantité en note.

---

## 7. Recette

| Propriété | Description |
|---|---|
| Libellé, icône | « Raclette », 🧀 |
| **Rendement** | Quantité de référence + unité de rendement : **« 4 personnes »** (par défaut), ou **« 1 cake »**, « 2 tartes », « 24 cookies », « 3 bocaux »… |
| Ingrédients | Article + quantité + unité + types acceptés + « facultatif » |
| Étapes / notes | Texte libre, facultatif |

Le rendement « personnes » convient aux plats ; un rendement libre convient aux recettes qu'on fait « en un exemplaire pour tout le monde » : *Cake aux olives — 1 cake*. Pour en avoir plus, on en fait 2.

### Ajouter une recette à une liste
1. Choisir la liste, puis la quantité voulue dans l'unité de rendement : **« Pour combien de personnes ? »** ou **« Combien de cakes ? »** (prérempli avec le rendement de la recette, nombres entiers).
2. Les quantités sont recalculées : `quantité × demandé ÷ rendement de référence`, puis **arrondies au pas supérieur de l'unité** (3 personnes au lieu de 4 pour 2 oignons → 1,5 → 2 oignons ; 375 g de farine avec un pas de 50 g → 400 g), puis simplifiées (§ 5).
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
- **articles introuvables** dans ce magasin ;
- récapitulatif : articles achetés, introuvables, durée.

À la clôture, les lignes cochées quittent la liste (elles sont dans l'historique) ; les lignes introuvables et non cochées restent.

### Réouverture
Oubli constaté à la caisse ? **« Rouvrir les courses »** est disponible sur la liste après la clôture, **tant qu'aucune nouvelle session n'a démarré** sur cette liste :
- l'app revient en mode courses avec la même session ; les articles déjà achetés réapparaissent cochés ;
- on ajoute et coche les oublis ;
- une nouvelle clôture **remplace** les calculs de la première (ils ne sont jamais comptés deux fois).

### Session oubliée
Si une session est restée ouverte et que l'app est rouverte plusieurs heures après le dernier article coché, l'app propose : « Tu as terminé tes courses de *hier 18 h* ? — **Terminer** · **Continuer** ».

---

## 9. Partage d'une liste

Simple, sans serveur : on **envoie** une liste à quelqu'un (conjoint), qui l'**importe** dans son app. Pas de synchronisation.

### Contenu envoyé
Le partage est **autonome** : chaque ligne embarque la description complète de son article (libellé, slug, alias, clé catalogue éventuelle, catégorie, unité, types, icône), en plus de la quantité, des types acceptés et de la note. **Aucun magasin n'est inclus** : le destinataire choisit le sien.

### Import chez le destinataire
1. Il choisit : créer une nouvelle liste, ou fusionner dans une liste existante.
2. Pour chaque article reçu, l'app cherche une correspondance dans **son** catalogue, dans cet ordre :
   1. même **clé catalogue** (article issu du catalogue de départ, même renommé de part et d'autre) ;
   2. même **slug** ;
   3. le slug reçu correspond à un **alias** du destinataire, ou un alias reçu correspond à un de ses articles (« Coca » ↔ *Coca-Cola*) ;
   4. sinon un article ressemblant (recherche floue) → **proposé**, à confirmer ;
   5. sinon → **« Nouvel article »** par défaut, avec la possibilité de choisir **« C'est le même que… »** (recherche dans son catalogue).
3. Quand le destinataire associe manuellement un article reçu à un des siens, **le libellé reçu devient un alias** de son article : la prochaine fois, la correspondance est automatique.
4. Même logique pour la catégorie et l'unité de chaque article créé (par slug ; créées si inconnues).
5. Un **écran d'aperçu** résume avant validation : « 12 articles reconnus, 1 à confirmer, 2 nouveaux ».

### Le cas « Coca » / « Coca-Cola » (ou noms très différents)
Aucune méthode automatique (slug, n-grammes…) ne peut deviner que deux noms totalement différents désignent le même produit. La solution combine trois niveaux :
1. **En amont, un grand catalogue de départ avec alias** (§ 10) : en tapant « coca », chacun trouve *Coca-Cola* du catalogue au lieu de créer un nouvel article. Les deux personnes ont alors la même clé catalogue → correspondance garantie.
2. **À l'import, l'association manuelle** « C'est le même que… », mémorisée comme alias.
3. **Après coup, la fusion** de deux articles si un doublon a quand même été créé.

## 10. Catalogue de départ

- L'app embarque un **catalogue de départ** d'environ **1 000 articles** courants en France, avec leurs **alias** (synonymes, abréviations, marques passées dans le langage courant, variantes régionales), ainsi que les catégories, unités et modèles de magasins (voir 06). C'est une donnée par défaut, comme un dictionnaire.
- Au premier lancement, il est **copié** dans les données de l'utilisateur. Ensuite, ce sont ses données : il les modifie, supprime, complète librement.
- Chaque article copié garde sa **clé catalogue**. Comme deux utilisateurs de l'app partent du même catalogue, la grande majorité des articles partagés sont reconnus à coup sûr, même renommés.
- Plus le catalogue est complet, moins on crée d'articles soi-même, et moins il y a de doublons au partage.
- Lors d'une mise à jour de l'app qui enrichit le catalogue, seuls les **nouveaux** articles (et nouveaux alias) sont ajoutés ; les articles existants de l'utilisateur ne sont jamais écrasés.
