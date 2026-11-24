# 05 — Identité visuelle

## 1. Ambiance

Un **thème sombre, franchement « dark mode »**, par défaut : fond quasi noir et neutre (gris très foncé), et **deux couleurs** réservées aux éléments d'interface : le **violet** (couleur principale) et l'**or** (couleur secondaire) ; des touches de couleurs douces par rayon pour la variété, des icônes colorées, des coins arrondis généreux, des animations souples et de petits sons.

Un **thème clair** lui correspond, rôle pour rôle (même design system, mêmes noms de tokens) : fonds blancs et gris très clairs, violet profond, or. Choix dans Réglages → **Thème** (H11) : _Automatique_ (suit le téléphone), _Sombre_, _Clair_.

## 2. Couleurs

### Design system : couleurs de base (tokens CSS)

Définis une seule fois dans `src/styles/index.css` ; les composants n'utilisent que ces noms (classes Tailwind `bg-surface`, `text-primary`…), jamais de valeur en dur.

| Rôle                   | Token                | Valeur    | Usage                                                                                                                                                                                                                                                                                                                             |
| ---------------------- | -------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fond 1                 | `--bg`               | `#111114` | Fond de l'app (gris quasi noir, neutre)                                                                                                                                                                                                                                                                                           |
| Fond 2                 | `--surface`          | `#1f1f26` | Cartes, lignes, panneaux, barre d'onglets                                                                                                                                                                                                                                                                                         |
| Fond 3                 | `--raised`           | `#2e2e38` | Éléments surélevés, champs de saisie, appui sur une ligne                                                                                                                                                                                                                                                                         |
| Séparateur             | `--border`           | `#3e3e4a` | Bordures, séparateurs                                                                                                                                                                                                                                                                                                             |
| Texte principal        | `--text`             | `#e4e4e8` | Libellés, contenu                                                                                                                                                                                                                                                                                                                 |
| Texte secondaire       | `--text-muted`       | `#a3a3ad` | Descriptions, notes, titres de section                                                                                                                                                                                                                                                                                            |
| **Couleur principale** | `--primary`          | `#a37ef2` | **Violet** : tout ce qui s'actionne (boutons, y compris ceux faits d'une icône seule, interrupteurs, liens, focus, icônes en tête des tuiles, des lignes de menu, des lignes de réglage et des actions d'un menu) et les **titres d'écran**                                                                                       |
|                        | `--primary-strong`   | `#8e67e4` | Violet appuyé (bouton pressé)                                                                                                                                                                                                                                                                                                     |
|                        | `--on-primary`       | `#140d22` | Texte sur fond violet                                                                                                                                                                                                                                                                                                             |
| **Couleur secondaire** | `--secondary`        | `#c3b0fd` | **Violet clair** : les **repères**, rares, qu'on lit sans les toucher — onglet actif (icône, libellé et trait au-dessus), quantités, progression, numéro de version, chevrons et flèches des lignes qui mènent ailleurs, puces et numéros (nouveautés, installation), icône d'un encadré de conseil, illustration d'un écran vide |
|                        | `--secondary-strong` | `#b199f4` | Violet clair appuyé                                                                                                                                                                                                                                                                                                               |
|                        | `--secondary-fill`   | `#f5c451` | Or des **aplats** : bouton « Terminer », barre de progression, pastille de quantité, trait de l'onglet actif                                                                                                                                                                                                                      |
|                        | `--on-secondary`     | `#1d1606` | Texte sur fond or                                                                                                                                                                                                                                                                                                                 |
| Succès                 | `--success`          | `#2ec27e` | Vert franc : coche, rayon terminé, message de réussite                                                                                                                                                                                                                                                                            |
| Information            | `--info`             | `#3d9bff` | Bleu : message d'information (conversion automatique…)                                                                                                                                                                                                                                                                            |
| Attention              | `--warning`          | `#ff7b3a` | Orange : « À récupérer », catégories non rattachées                                                                                                                                                                                                                                                                               |
| Danger                 | `--danger`           | `#f2484f` | Rouge franc : suppression, message d'erreur                                                                                                                                                                                                                                                                                       |
| Saison                 | `--season`           | `#5fd38a` | Vert feuille : pastille « de saison » et mois choisis du calendrier (D3), distinct des repères or                                                                                                                                                                                                                                 |

L'or ne sert qu'aux **aplats** (`--secondary-fill`), comme en clair : des repères or en texte et en icônes faisaient trop de jaune sur fond sombre. Les fonds sont nettement écartés (fond 1 très sombre, fond 3 et séparateurs plus clairs) pour ne pas se confondre sur iPhone. Le filet sombre des icônes dessinées (`--icon-gap`) et le fond du logo restent `#18181d`.

### Thème clair

Mêmes tokens, redéfinis sous `:root[data-theme="light"]` dans `src/styles/index.css`. Violet **`#5B21B6`** et or **`#FBBF24`**. Fond de l'app **blanc**, cartes et panneaux **gris très clair** (fond 2), éléments surélevés **violet très clair** (fond 3) ; barre d'ajout et recherche du catalogue sur le fond de l'app, bordées d'or (`--field-border`) ; les champs des fiches restent blancs, bordés de gris, pour ne pas alourdir les panneaux. Sur fond blanc, l'or vif est trop pâle pour un petit texte ou une icône au trait : il sert aux **aplats** (`--secondary-fill` : bouton « Terminer », barre de progression, trait de l'onglet actif) et à la bordure des champs ; les **repères** (icônes, quantités, onglet actif) passent en **violet** (`--secondary` = violet principal ; un ambre foncé ferait « rouille »), comme en sombre où ils sont violet clair. En thème clair : **aucun fond sous les articles** (liste et mode courses : blanc), blocs bordés d'un trait fin de leur couleur, en-tête teinté de leur couleur, nom de la couleur du texte, pastille du nombre d'articles pleine de leur couleur. Dans les deux thèmes, cartes du catalogue (catégories, habituels, articles) **sans fond ni bordure**. En thème sombre, l'écran a déjà les couleurs des icônes d'articles, les blocs de rayon restent sobres : **sans cadre** (seule la bordure gauche de leur couleur), en-tête sur le fond 2, nom dans leur couleur, pastille teintée de leur couleur. Libellés d'article en poids moyen (un texte clair sur fond sombre paraît plus gras). Barre d'ajout et recherche sans fond propre dans les deux thèmes. Le filet qui détache deux objets dans une icône d'article prend le fond de la ligne en thème clair (`--icon-gap` reste `#18181d` en sombre).

| Rôle                   | Token              | Valeur    |
| ---------------------- | ------------------ | --------- |
| Fond 1                 | `--bg`             | `#ffffff` |
| Fond 2                 | `--surface`        | `#f7f7fa` |
| Fond 3                 | `--raised`         | `#efeafc` |
| Séparateur             | `--border`         | `#dcdce4` |
| Bordure des champs     | `--field-border`   | `#fbbf24` |
| Texte principal        | `--text`           | `#16161b` |
| Texte secondaire       | `--text-muted`     | `#5b5b67` |
| **Couleur principale** | `--primary`        | `#5b21b6` |
|                        | `--primary-strong` | `#4c1d95` |
|                        | `--on-primary`     | `#ffffff` |
| **Couleur secondaire** | `--secondary`      | `#5b21b6` |
|                        | `--secondary-fill` | `#fbbf24` |
|                        | `--on-secondary`   | `#1d1606` |
| Succès                 | `--success`        | `#15803d` |
| Information            | `--info`           | `#1d4ed8` |
| Attention              | `--warning`        | `#c2410c` |
| Danger                 | `--danger`         | `#dc2626` |
| Saison                 | `--season`         | `#15803d` |

La palette des rayons et catégories garde ses teintes, plus soutenues (`--pal-…`) pour rester lisible sur blanc. Le filet qui détache deux objets dans les icônes dessinées suit le thème (`--surface`, voir § 4). L'icône de l'app et le logo gardent leur fond sombre.

Règles :

- les fonds restent **neutres** (aucune teinte violette) ;
- **violet = ce qui s'actionne** : boutons (plein pour l'action principale de l'écran, contour pour les autres), boutons faits d'une icône seule (⋯, retour, ▶ « écouter », + et −), interrupteurs, liens, icône en tête d'une ligne qu'on touche ou qui porte un réglage (menu, réglage, action d'un menu) ;
- **repère (`--secondary`) = rare**, jamais sur ce qui s'actionne : onglet actif, quantités, progression, chevrons des lignes qui mènent ailleurs, puces et numéros (sauf dans une recette), coche du choix retenu (liste en cours…), icône d'un conseil ou d'un écran vide ; violet clair en sombre, violet en clair ;
- **or = aplats seulement** : bouton « Terminer », barre de progression, pastilles, trait de l'onglet actif, étiquette « Tu es ici » ;
- **gris = indice** : la loupe d'un champ de recherche, comme son texte d'exemple ;
- **une icône dans un bouton avec texte prend la couleur du texte du bouton** ;
- les icônes d'articles (dessinées pour l'app) gardent leurs propres couleurs.

### Palette des rayons et catégories

Couleurs douces, utilisées en pastille, sur l'icône et la bordure gauche d'un rayon, en fond très atténué de son en-tête en clair (≈ 10 %) et des monogrammes (≈ 15 %). Le nom d'un rayon ou d'une catégorie est de sa couleur en sombre, de la couleur du texte en clair (où l'en-tête est déjà teinté). En sombre, toutes ont la **même clarté** et une saturation modérée, avec des teintes bien écartées et **un seul jaune** (blé) : aucun rayon ne ressort plus qu'un autre. Valeurs du thème sombre ci-dessous ; en clair, mêmes teintes plus soutenues.

| Nom     | Valeur    | Exemple d'usage par défaut |
| ------- | --------- | -------------------------- |
| sauge   | `#90c79b` | Fruits & Légumes           |
| blé     | `#c8b778` | Boulangerie                |
| corail  | `#e8a493` | Boucherie                  |
| canard  | `#72c9c3` | Poissonnerie               |
| rose    | `#e5a1b5` | Charcuterie & Traiteur     |
| crème   | `#aec083` | Crèmerie                   |
| ambre   | `#deac7d` | Fromages                   |
| terre   | `#c5a793` | Épicerie salée             |
| prune   | `#d7a4d1` | Épicerie sucrée            |
| ciel    | `#96b9ee` | Boissons                   |
| glacier | `#76c4dd` | Surgelés                   |
| lilas   | `#bbade9` | Hygiène                    |
| ardoise | `#a2afc1` | Entretien & Maison         |
| gris    | `#94949e` | À placer / Autres          |

> Contrastes visés sur tous les écrans, dans les deux thèmes : WCAG AA (4,5:1 pour le texte, 3:1 pour les éléments graphiques). En thème clair, les couleurs de la palette sont assez foncées pour rester lisibles en titre de rayon sur leur fond teinté ; le violet appuyé (`--primary-strong`) est assez clair sous le texte des boutons.

## 3. Typographie

- **Plus Jakarta Sans** (moderne, nette, chaleureuse sans être enfantine) — licence libre (OFL), **embarquée dans l'app** (pas de chargement depuis Google pour rester hors ligne).
- Chiffres à chasse fixe pour les quantités (`font-variant-numeric: tabular-nums`).
- Tailles : titres d'écran 24 px extra-gras en violet ; sous-titres 20 px gras (couleur du texte) ; **en-tête de rayon 18 px extra-gras**, sur une ligne (deux pour un rayon du mode courses titré d'après ses catégories) ; intertitre d'une catégorie dans « À placer » 18 px gras, sur une ligne, pas plus petit que ses articles ; **lignes d'article 16 px**, en poids moyen en sombre et demi-gras en clair, jamais plus grandes que l'en-tête de leur rayon, y compris en mode courses (lisibilité assurée par la hiérarchie et des lignes de 48 px) ; descriptions 14 px.

## 4. Icônes

### Deux familles

| Usage                               | Choix                                             | Style                                                                                                    |
| ----------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Interface (onglets, boutons, menus) | **Lucide** (licence ISC, gratuite)                | Trait fin, monochrome, couleur du texte                                                                  |
| Catégories et rayons                | **Lucide**                                        | Trait, dans la couleur de la catégorie ou du rayon (sur fond atténué de cette couleur dans le catalogue) |
| Articles, recettes                  | **Icônes dessinées pour l'app** (une par article) | Plat, coloré, doux                                                                                       |

Les icônes colorées sont réservées aux articles : on les repère d'un coup d'œil, et les catégories et rayons, plus sobres, structurent sans leur faire concurrence. Une catégorie ou un rayon stocke le nom de son icône Lucide (`apple`) ; la liste des icônes proposées est dans `src/icons/lucide.ts`. Lucide n'a pas d'icône de fromage : un triangle en tient lieu.

### Icônes dessinées pour l'app

**Toutes les icônes d'articles sont dessinées pour l'app**, une par article du catalogue (236), dans un style plat inspiré de Fluent Emoji (grille 32 × 32, aplats, une ombre et un reflet). Cohérence partout, et aucun article sans icône.

- Source : `src/icons/drawn/<clé de l'article>.svg`. Vite les réunit au build dans le pack (`src/icons/packData.ts`) ; libellé et mots-clés viennent de l'article de même clé (nom, alias, types), et l'entrée garde sa catégorie (`c`).
- Chaque article pointe sur son icône (`"icon": "framboises"`) ; le dictionnaire de mots-clés (06 § 5) aussi, pour les articles créés par l'utilisateur.
- **Reprise et variantes** : pour ne pas multiplier les dessins à relire, un article peut **reprendre** le dessin d'un article proche (Cannelle → Épices, Kit fajitas → Tortillas : `"icon"` désigne alors l'autre clé), ou recevoir une **variante recolorée** d'un dessin existant (huiles, sauces en flacon, pots d'épices…), qui reste son propre fichier. Un même modèle sert à **5 articles au plus** (un peu plus seulement au cas par cas : les conserves, qui se ressemblent en vrai, se distinguent par l'étiquette et la couleur) ; au-delà, un dessin propre (la muscade en noix, l'origan en brins…). Le dessin d'un article générique n'est pas décliné pour un article précis : Poisson et Champagne gardent le leur, la truite, la dorade, le bar, le cidre ou le crémant ont le leur. Chaque dessin porte la clé d'un article.
- **Modèle déjà très utilisé** : avant de dessiner le nouvel article sous sa vraie forme, on regarde si les articles qui utilisent ce modèle lui correspondent vraiment. Souvent, le modèle générique va mieux au nouvel article et c'est un ancien article, à la forme plus parlante, qui reçoit un dessin propre. Le fichier change alors de nom pour la clé de l'article qu'il représente. Exemples : un pot d'épice va mieux à Ras el hanout ou à Quatre-épices qu'au piment d'Espelette ou au curcuma, dessinés en vrai (piment, rhizome) ; une pointe de fromage va mieux au Beaufort qu'à la tomme, ronde à croûte grise.
- **Icônes de plats** : six dessins pour les recettes (soupe, cake, tarte, gâteau, gratin, salade composée) dans `src/icons/dishes/`, qui ne correspondent à aucun article. Leur clé dans le pack est préfixée (`plat-soupe`) et leur catégorie est `plats` ; libellé et mots-clés sont dans `src/i18n/fr.ts` (`recipes.dishes`). Le choix de l'icône d'une recette les montre en tête, sous « Plats et desserts », avec les icônes du Traiteur, des Desserts frais et des Biscuits & Gâteaux.
- Les icônes se relisent dans la maquette (`#/dev/ui`, hors production).

Règles de dessin, tirées des relectures (à appliquer à toute nouvelle icône) :

- plusieurs objets qui se chevauchent : un **filet sombre** (couleur `--surface`) détoure celui de devant ;
- dans une corbeille, les produits sont **dedans** (fond de corbeille derrière, bord devant), jamais en lévitation ;
- **fidèle au produit** : framboise creuse et sans queue, fruit de la passion marron, pêche unie et sans sillon, abricot pas tout à fait rond, melon charentais entier, tranche du même diamètre que le légume ;
- un lien ou une étiquette **contraste** avec ce qu'il tient (pas de violet sur du vert) ; un dégradé est permis quand il aide (base pâle des asperges) ;
- proportions proches de l'emoji connu (aubergine allongée, courgette longue à queue courte).
- contours lisses (une mangue ne doit pas sembler cabossée), aplats nets plutôt que taches de couleur ;
- un légume coupé montre sa **face coupée au bout** du légume (et une rondelle à part), jamais un disque collé dessus ;
- rien ne dépasse du cadre 32 × 32 (feuilles comprises).
- les détails intérieurs (traits, rayures, reflets) restent **dans** la forme ; le filet sombre ne sépare que des objets distincts, jamais deux parties d'un même objet (tête de brioche) ;
- un générique ne montre que son produit type, dans son support (« Poisson au choix » : un poisson dans le bac, sans crevette) ;
- une viennoiserie ou un produit fourré se montre **coupé** quand c'est l'intérieur qui le fait reconnaître (pain au chocolat).
- **sobriété** : un seul produit (un œuf, pas une boîte), aucun accessoire (cuillère, couvercle, blini, part en trop), aucun socle sous un fromage ; bols petits ; croûte d'un fromage sur le petit côté de la part ; forme la plus parlante (nid de tagliatelles, coquillettes, chèvre cendré, une sardine).
- bols sans pied, contenant qui **contraste** avec son contenu (pas de bol blanc pour du riz) ; part de fromage = dessus et face coupée, la croûte n'apparaissant qu'en liseré sur le petit côté ; fromage rond entamé avec une encoche nette ; formes organiques plutôt que géométriques (œuf plus large à la base, pâte irrégulière).
- **perspective** : sur un pot ou une boîte vu un peu du dessus, l'étiquette ou la bande suit la courbure ; dans un bol vu en perspective, le contenu remplit l'ouverture et passe derrière le bord avant ; un motif sur une étiquette est centré sur elle ;
- **tas** : ni symétrique ni demi-sphère (un tas de sucre est une petite pyramide au sommet arrondi), sans miettes autour ; une seule sorte de forme par tas (des dés, pas des dés et une cerise) ; plusieurs objets posés au hasard plutôt qu'en éventail, qui ferait croire à un seul objet ;
- alcools forts de cuisine (cognac, calvados, kirsch) : une même **flasque** au col large, colorée selon l'alcool, étiquette propre à chacun.

### Le pack d'icônes : pourquoi on n'est jamais bloqué

- `src/icons/packData.ts` réunit les dessins au build (`import.meta.glob`) : aucun fichier généré à versionner, ni étape à lancer à la main, et le build n'a besoin d'aucun réseau. Chaque dessin y arrive déjà prêt à afficher (identifiants préfixés, filet du thème : `scripts/iconSvg.ts`, utilisé par Vite et Vitest), rien n'est retravaillé dans le téléphone. Le pack, rangé par libellé avec ses clés de recherche, forme un fichier à part, chargé à la demande.
- Le pack est stocké par l'app et mis en cache pour le hors-ligne dès la première ouverture.
- Un article ne stocke que le **nom** de son icône (`framboises`).
- **Ajouter un article en plein magasin, hors ligne** : l'app cherche une icône dans le pack via le dictionnaire de mots-clés (06 § 5) → affichage immédiat. Rien à télécharger, aucun build nécessaire.
- Chaque icône du pack a un **libellé et des mots-clés français** (nom, alias et types de son article) pour la recherche dans le sélecteur (G5).

### Cascade d'affichage d'une icône d'article

```
1. Icône choisie par l'utilisateur ou définie dans le catalogue de départ
2. Icône devinée par le dictionnaire de mots-clés
3. Icône Lucide de la catégorie de l'article, dans sa couleur (si l'utilisateur l'a activé dans la fiche catégorie)
4. Monogramme
```

### Monogramme

Carré arrondi, fond = couleur de la catégorie à ~15 %, 1 ou 2 lettres en gras de la couleur de la catégorie. `Sauce nuoc-mâm` → `SN`, `Lessive` → `L`. Même taille que les icônes : visuellement homogène.

## 5. Composants clés

Le design system, ce sont aussi des **composants partagés** (`src/ui`), utilisés partout : un élément présent à deux endroits n'est jamais recopié, il devient un composant, et un changement de style se fait une seule fois (des champs recopiés finissent toujours par diverger). Les principaux :

- **Voile et ombres** : tokens `--overlay` (voile sous les panneaux et les bulles d'aide) et `--shadow` (ombre des éléments flottants), jamais de noir écrit en dur. La barre d'état prend la valeur de `--bg` du thème posé (seuls `index.html` et le manifeste, lus avant les styles, la répètent en dur).
- **Titre d'écran** (`PageTitle`) : 24 px, extra-gras, violet — Liste, Catalogue, Réglages, nom du magasin en mode courses.
- **En-tête d'écran** (`PageHeader`) : collant, titre (ou nom de la liste à toucher), retour ou bouton à gauche, bouton à droite, ligne en dessous (barre de progression du mode courses) ; le même pour tous les écrans.
- **Étapes de recette** (`markdownStyles`) : titre 20 px gras en `--secondary` (or en sombre, violet en clair), pour le distinguer d'un mot en gras (couleur du texte) ; puces et numéros des listes en violet (`--primary`) dans les deux thèmes.
- **Sous-titre** (`SectionTitle`) : 18 px gras, couleur du texte, précédé d'un **trait vertical or** de 20 px (`--secondary-fill`, or dans les deux thèmes) — « Mes données », « Application », « Favoris »… Plus de petites majuscules grises, trop discrètes.
- **Champ de recherche** (`SearchField`) : pilule bordée de 2 px (`--field-border`), sans fond propre, loupe, bouton pour effacer.
- **Ligne touchable** (`RowButton`) : icône, titre et détail sur une ligne chacun, élément à droite, chevron si elle mène à un autre écran ; la même dans une section d'écran, un panneau ou une liste de suggestions (`SuggestionList`).
- **Formulaires** (`form.tsx`) : intitulé de champ (`FieldLabel`), champ, liste déroulante, zone de texte, case à cocher sur toute une ligne (`CheckRow`), repère d'un choix (`ChoiceMark` : coche si choisi), puce, ligne de menu, **boutons de confirmation** (`ConfirmActions` : l'action en rouge, ou en or pour « Terminer les courses », puis « Annuler », l'un sous l'autre) et « Fusionner / Supprimer » d'une fiche (`MergeDeleteActions`).
- **Choix** : catégorie (`CategorySelect`, triées par nom) et unité (`UnitSelect`, par groupe).
- **Bouton « Ajouter »** (`AddButton`) : pleine largeur, en contour, avec un +.
- **Menu d'un écran** (`MenuButton`) : `⋯` à droite de l'en-tête, ouvre un panneau de lignes de menu (`MenuItem`) : les actions sur ce que l'écran affiche (la liste, les recettes). Pas de menu « burger » (☰), qui désigne d'habitude la navigation : elle passe ici par la barre d'onglets.
- **Liste réordonnable** (`SortableList`, `DragHandle`) : glisser la poignée, au doigt ou au clavier, annoncé en français.

1. **Ligne d'article** : **indentée** sous l'en-tête de son rayon · icône 28 px · libellé 16 px · types acceptés / note en `--text-muted` · quantité + unité en couleur de repère (`--secondary`), alignée à droite · toute la ligne cliquable. Hauteur 44 px, 48 px en mode courses ; ligne cochée barrée, icône grisée avec une petite coche verte.
2. **Bloc de rayon** : la couleur du rayon forme la **bordure gauche de tout le bloc** (en-tête et articles) ; en-tête : icône 28 px · libellé 18 px sur une ligne · pastille du nombre d'articles · chevron ; repliable. En sombre, en-tête sur le fond 2, libellé de la couleur du rayon, pastille teintée ; en clair, en-tête teinté de la couleur (~10 %), libellé de la couleur du texte, pastille pleine de la couleur. Rayon terminé en mode courses : libellé vert et coche à la place du compteur. En mode courses, le mot **« RAYON »** (14 px, majuscules) surmonte son nom ou le titre tiré de ses catégories (02 § 4, sur 2 lignes au plus), avec son repère éventuel en dessous ; le rayon en cours porte à côté du mot « RAYON » l'étiquette **« Tu es ici »** (pastille or, épingle de carte), jamais de cadre qui ressemblerait à un focus ; encore vide, il affiche une courte explication, et le bloc « À placer » (gris, icône panier) suit le rayon en cours ; ses catégories y forment des intertitres de la taille des articles. Dans la liste, le bloc est une catégorie. Pas de fond sous les articles ; en clair, un trait fin de sa couleur fait le tour du bloc (en plus de la bordure gauche) ; en sombre, pas de cadre : seule la bordure gauche. 16 px d'écart entre deux rayons.
3. **Barre d'ajout** : fond de l'app (`--bg`), en pilule, **bordure de 2 px** (`--field-border` : violet en sombre, or en clair) pour ressortir de l'interface, sans ombre, loupe grise (`--text-muted`), bouton « + » violet, flottante au-dessus de la barre d'onglets ; saisie en 16 px (pas de zoom automatique sur iPhone). Même style pour tous les champs de recherche (`SearchField`).
4. **Carte du catalogue** : sans bordure ni fond, dans les deux thèmes (catégories, habituels, articles) ; grande icône (56 px), libellé sur 2 lignes max, pastille de quantité or si dans la liste, entourée d'un fin liseré de la couleur de la carte pour rester lisible sur une icône jaune ; feuille verte « de saison » (`SeasonBadge`) en haut à gauche, aussi après le libellé d'une ligne de la liste.
5. **Boutons** : **deux styles seulement** — principal (fond violet `--primary`, texte `--on-primary`, hauteur ≥ 48 px en taille `lg`) pour l'action principale de l'écran, et secondaire (contour violet) pour les autres actions. Variantes : suppression (style principal en rouge), bouton fait d'une icône seule en violet (⋯, retour, ▶ ; avec contour dans un formulaire : + et −), atténué (fermer, retirer) ou rouge (supprimer une ligne). **Appui bien visible** : le bouton rétrécit (95 %) et fonce pendant le toucher. **Désactivé : gris** (fond 3 en sombre, séparateur en clair, texte secondaire ; contour gris pour le style secondaire), jamais la couleur pâlie.
6. **Panneaux glissants** : fond `--surface`, poignée en haut, coins supérieurs arrondis. En-tête fixe avec **✕ toujours visible** (même clavier ouvert) ; on ferme aussi en glissant la poignée vers le bas ou en touchant à côté. Panneau à étapes (déplacer un article) : bouton **←** pour revenir à l'étape précédente. Une fiche à consulter d'abord (ligne, quantité, création d'article) s'ouvre **sans focus sur un champ** : le clavier ne cache pas le reste.
7. **Bulles d'aide** (H12) : voile sombre sur tout l'écran sauf l'élément concerné (découpe arrondie bordée de violet, qui ne déborde pas du bloc de rayon pour une ligne d'article), bulle violette (`--primary`, texte `--on-primary`) avec une flèche vers lui, « Touche l'écran pour continuer » en dessous ; apparition en fondu selon le réglage Animations.
8. **Messages (toasts)** : **en haut**, au-dessus de tout (panneaux compris) et jamais sous le clavier ; ils descendent, puis remontent seuls après 3 secondes (5 avec « Annuler »). Un seul à la fois, fond `--raised`, **bordure de 2 px et icône de la couleur du ton** : **réussite** (`--success` : « 3 lignes ajoutées »), **information** (`--info` : « Converti en 1,2 kg — Annuler »), **attention** (`--warning`), **erreur** (`--danger` : enregistrement impossible). Ton neutre, couleur des repères (`--secondary`) avec une flèche de retour, pour une action annulable (« Pommes : retiré de la liste — Annuler », « Pâtes : introuvable — Annuler »).

## 6. Animations

Bibliothèque **Motion**.

- Ajout : la ligne apparaît à sa place dans son rayon avec un léger rebond ; si l'article était déjà là, la ligne existante défile jusqu'à l'écran et « pulse » une fois le panneau « Déjà dans la liste » fermé, quel que soit le choix ; si elle était dans un rayon, une catégorie ou un bloc replié, celui-ci se déplie d'abord.
- Cocher : le trait barré se trace de gauche à droite, puis la ligne glisse vers le bas.
- Rayon terminé : repli + coche menthe. Tout rayon se déplie et se replie en douceur.
- Panneaux : glissement depuis le bas avec ressort.
- Écrans vides (liste, catégorie, magasins…) : apparition en fondu.
- Animations toujours présentes, sauf si le téléphone demande de les réduire (`prefers-reduced-motion`, H1) ; pas de réglage dans l'app.

## 7. Sons

### Sons (H6)

Petits sons courts, doux et discrets, **à volume bas** (un son léger, jamais plus fort que le reste du téléphone) : fichiers WAV de **Kenney Interface Sounds** (licence **CC0**, domaine public, usage commercial libre, mention facultative, créditée dans l'écran Licences), dans `public/sounds/`, mis en cache pour le hors-ligne.

| Action             | Fichier Kenney d'origine |
| ------------------ | ------------------------ |
| Ajout d'un article | `drop_001`               |
| Cocher             | `click_003`              |
| Rayon terminé      | `confirmation_001`       |
| Courses terminées  | `confirmation_002`       |
| Suppression        | `close_001`              |
| Action impossible  | `back_002`               |

« Suppression » accompagne toute suppression faite (ligne, liste, article, catégorie, unité, rayon, magasin) ; « Action impossible », tout refus ou échec signalé par un message d'avertissement ou d'erreur (nom déjà pris, sauvegarde illisible, enregistrement impossible…).

Lecture via la **Web Audio API**. Sur iPhone, le moteur audio peut rester bloqué après un passage en arrière-plan : il est fermé quand l'app est masquée et recréé au son suivant.

Points d'attention :

- sur iPhone, le son ne peut démarrer qu'après un premier geste de l'utilisateur (le premier tap suffit) ;
- **mode silencieux** : sur iPhone, la session audio est déclarée « ambient » (Audio Session API, iOS 17+) : les sons sont coupés quand le bouton silencieux est activé et n'interrompent pas la musique en cours. Android ne permet pas de connaître le mode silencieux depuis le web : les sons suivent le volume multimédia ;
- réglage **Sons** général et **un interrupteur par son**, chacun pouvant être écouté (Réglages → Préférences → Sons).

### Pas de vibrations

L'API Vibration n'existe pas sur iPhone, et l'astuce non officielle de retour haptique (interrupteur natif masqué) n'y fonctionne pas. Pour garder la même app sur les deux téléphones, il n'y a de vibrations nulle part.

## 8. Icône de l'app et écran de démarrage

Icône d'écran d'accueil : **caddie violet (`--primary`) portant une coche or (`#f5c451`)**, sur fond plein `--surface`, détourée d'un filet de fond qui la détache du caddie. Source unique `public/logo.svg` (512 × 512) ; `npm run icons` en tire toutes les tailles (`pwa-assets.config.ts`) :

- icônes standard (64, 192, 512) et favicon : carrées, fond plein, **sans marge transparente** ;
- iPhone (`apple-touch-icon` 180 × 180) : fond plein jusqu'aux bords, sans coins arrondis (iOS les arrondit lui-même) ;
- Android (`maskable` 512 × 512) : marge de 10 % de la couleur du fond, pour que le dessin tienne dans la découpe du téléphone (cercle, carré arrondi…).

Écran de démarrage aux couleurs `--bg`.
