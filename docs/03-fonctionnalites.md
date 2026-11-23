# 03 — Fonctionnalités

Chaque fonctionnalité a un identifiant (`A1`, `B2`…) réutilisé dans le plan de développement et les tests, et une version cible :

| Version  | Thème                      | Fonctionnalités                                |
| -------- | -------------------------- | ---------------------------------------------- |
| **v1.0** | Cœur et recettes           | A1-A7 · B1-B6 · C1-C8 · E1-E2 · G1-G5 · H1-H12 |
| **v1.1** | Partage                    | F1-F2 · A8 · E3                                |
| **v1.2** | Anti-oubli et saisonnalité | D1-D3                                          |
| **v1.3** | Anglais                    | I3                                             |

Les règles métier citées sont détaillées dans [02](02-modele-metier.md).

---

## A. Ajouter des articles à une liste

### A1. Barre d'ajout éclair — _v1.0_

Barre de saisie fixée en bas de l'écran Liste, accessible au pouce. Son libellé, « Ajouter un ou plusieurs articles… », rappelle qu'on peut en saisir plusieurs, séparés par des virgules (A2) ; en mode courses, à côté de « Terminer », la place manque : « Ajouter… ».

- Recherche dès la 1ʳᵉ lettre dans les libellés **et alias**, insensible aux accents, à la casse et au pluriel (`oeuf` → _Œufs_, `coca` → _Coca-Cola_).
- Suggestions (5 max) : icône, libellé, catégorie ; classées par pertinence puis fréquence d'achat. Un article déjà dans la liste est marqué de sa quantité.
- `Entrée` ou tap sur une suggestion = ajout ; la barre reste ouverte et se vide pour enchaîner.

**Critères** : taper `tom` puis `Entrée` ajoute _Tomates_ avec l'unité et la quantité par défaut de l'article (`oeu` → _Œufs_ × 6) ; taper `chocolatine` trouve _Pain au chocolat_.

### A2. Saisie naturelle — _v1.0_

| Saisie                                   | Résultat                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `3 tomates`                              | Tomates × 3 (un nombre seul compte des objets, voir ci-dessous)        |
| `tomates x3` / `tomates *3`              | idem                                                                   |
| `500g farine` / `farine 500 g`           | Farine, 500 g                                                          |
| `1,5 kg pommes`                          | Pommes, 1,5 kg                                                         |
| `1200 g boeuf`                           | Bœuf, 1,2 kg (simplification, 02 § 5)                                  |
| `deux baguettes` / `une douzaine d'œufs` | Baguette × 2 / Œufs × 12                                               |
| `pommes gala`                            | Pommes, type accepté _Gala_ (si _Gala_ est un type connu de l'article) |
| `pommes gol`                             | Pommes, type accepté _Golden_ (début de type sans ambiguïté)           |
| `2 baguettes, du beurre et 6 œufs`       | 3 lignes                                                               |

- Nombres en lettres jusqu'à vingt, « une douzaine », « une demi-douzaine ».
- Plusieurs articles séparés par `,`, `;`, `et`, `puis`, retour à la ligne, une puce entourée d'espaces (`- beurre - lait`, `• pain`) ou collée au mot d'avant quand le retour à la ligne a disparu (`beurre- lait`), ou un point de fin de phrase suivi d'une majuscule (`Des pommes. Du lait.`, ajouté par la dictée) ; jamais la virgule ou le point d'un nombre (`1,5 kg`) ni le point d'une abréviation (`2 tr. de jambon`). Articles partitifs ignorés (`du`, `de la`, `des`, `d'`), comme une puce ou une case à cocher en tête (`- [ ] œufs`).
- **Liste collée** : une liste à puces ou numérotée collée dans la barre (Notes, une autre app) y arrive en une ligne, ses articles séparés par des virgules, sans puces ni numéros ; le champ n'a qu'une ligne et perdrait sinon les retours à la ligne.
- **Unités de cuisine** (cuillère, pincée, verre, décilitre) : elles ne s'achètent pas. Dans une liste, « 1 verre de vin » ajoute le vin avec sa quantité habituelle (1 bouteille) ; l'unité n'est lue que devant « de » (« 6 verres en plastique » reste 6 verres en plastique). Dans une recette, elles se lisent comme les autres unités.
- **Suggestions par type** : dès qu'on tape après le nom d'un article le début d'un de ses types (`pommes g`), les suggestions proposent d'abord « Pommes · Gala », « Pommes · Golden »… (puis « Pommes ») ; en toucher une ajoute la ligne avec ce type. Tant qu'on ne tape que le nom, rien ne change (liste courte). Pas de « Créer… » quand la saisie désigne un article et un de ses types.
- **Un nombre seul compte des objets**, dans la liste comme dans une recette. Selon l'unité par défaut de l'article :
  - pièce, contenant (paquet, pot, bouteille…), ou unité de cuisine dans une recette : le nombre de cette unité (« 6 œufs », « 3 pâtes » → 3 paquets) ;
  - poids, article qui **se compte à la pièce** (02 § 2) : des pièces (« 3 pommes » → Pommes × 3, « 1 échalote » → × 1) ;
  - poids, autre article : le nombre de portions, c'est-à-dire **N fois la quantité par défaut** (« 2 beurres » → 500 g, « 2 cerises » → 1 kg), puis simplification ;
  - volume : le nombre dans cette unité (« 2 laits » → 2 L).
- Sans nombre, rien ne change : la quantité et l'unité par défaut de l'article (« pommes » → 1 kg). Des pièces ajoutées à une ligne au poids ne se convertissent pas : elles vont en note (02 § 5).
- Si l'unité saisie est incompatible avec l'unité par défaut de l'article, l'unité saisie l'emporte pour cette ligne.
- **Unité selon l'usage** _(v1.2)_ : sans unité tapée, l'article prend l'unité qu'on achète le plus pour lui, d'après les achats des courses terminées, à partir de 3 achats (deux lignes des mêmes courses comptent pour un ; recalculée à chaque fois, aucun compteur stocké), avec la quantité la plus prise dans cette unité ; à égalité, la plus récente. Les règles ci-dessus (nombre seul…) s'appliquent à cette unité. Une unité ou une quantité par défaut **choisie à la main dans la fiche article** l'emporte ; « Suivre mes achats » y revient (proposé seulement quand les achats donnent une autre unité). « Se compte à la pièce » s'affiche quand l'unité de la fiche ou celle des achats est une masse. La fiche le dit sous « Unité par défaut » (« D'après tes achats : 1 pack à l'ajout »), l'aide aussi. Vaut pour la barre d'ajout, le catalogue, une liste collée et un ingrédient en unité de cuisine ajouté à une liste ; pas pour les ingrédients d'une recette.

**Critères** (unité selon l'usage) : lait acheté 3 fois en pack (courses terminées) → « lait » ajoute 1 pack, « 2 lait » 2 packs, « 1 bouteille de lait » 1 bouteille ; une course encore ouverte ne compte pas ; deux lignes de lait dans les mêmes courses → un achat ; unité ou quantité choisie dans la fiche → elle l'emporte.

**Critères** : batterie de tests unitaires couvrant chaque ligne du tableau.

### A3. Article déjà dans la liste — _v1.0_

Voir [02 § 6](02-modele-metier.md#une-ligne-par-article-et-par-choix-de-types) : seulement pour une ligne du même article **avec les mêmes types** ; avec d'autres types (`3 pommes granny` quand la liste a des Golden), c'est une nouvelle ligne. Si l'article a des types, le panneau propose aussi « Ou ajouter [quantité] d'une autre sorte, sur une ligne à part » : la quantité dite est celle tapée (ou celle de l'article) (02 § 6). Un panneau léger (non bloquant) affiche « Déjà dans la liste : 2 kg » et propose **Ajouter [quantité]** ou **Ne rien faire** (par défaut).

**Critères** : ajouter _Pommes_ déjà présent puis `Entrée` → quantité inchangée ; choisir « Ajouter 1 kg » → 3 kg.

### A4. Créer un article inconnu — _v1.0_

Si aucun article ni alias ne correspond : suggestion « Créer _Sauce nuoc-mâm_ ».

- Un tap ouvre une **fiche rapide** préremplie : catégorie et **unité devinées** (dictionnaire de mots-clés, voir 06 § 5), icône devinée. Catégorie et unité sont **obligatoires** ; elles sont toujours remplies (au pire « Autres » / « pièce »).
- « Créer et ajouter » en un tap si les valeurs devinées conviennent.
- Si le slug existe déjà (variation d'écriture), l'article existant est proposé à la place.
- **Achat ponctuel** : « Juste cette fois » (une friteuse…) range l'article dans la catégorie système « Achats ponctuels », sans lui demander de catégorie ; il va dans « À placer » en magasin et reste dans le catalogue sous « Achats ponctuels » pour être réutilisé. « Garder dans le catalogue » (fiche de la ligne ou du catalogue) en fait un article normal : choisir une vraie catégorie est alors obligatoire.

### A5. Catalogue visuel — _v1.0_

Grille de catégories (icône + libellé) → grille d'articles (grande icône + libellé).

- Tap sur un article absent de la liste = ajout avec la quantité par défaut.
- Article déjà présent : pastille de quantité (plusieurs lignes : additionnées par unité) ; un tap ouvre le réglage de **toutes ses lignes** : une rangée par ligne, étiquetée par sa sorte (« Peu importe », « entier ») quand il y en a plusieurs, avec `−` / `+` (pas de l'unité, qui change d'unité en chemin : 950 g → 1 kg → 1,5 kg, [02 § 5](02-modele-metier.md#conversions)) et 🗑, puis « Ajouter une autre sorte » si l'article a des types. Une sorte touchée ajoute sa ligne dans le panneau, avec la quantité par défaut de l'article, réglable sur place ; « Terminé » ferme. Chaque quantité est sur la rangée de sa sorte : une quantité sans étiquette au-dessus des sortes ferait croire qu'elle s'applique à la nouvelle sorte.
- Recherche en haut du catalogue, avec **suggestions dès la première lettre** (nom, alias, sans tenir compte des accents ; la partie tapée en gras ; quantité si l'article est déjà dans la liste). Tap ou Entrée sur la première = même effet qu'un tap sur la carte ; au-delà de 8 suggestions, « Voir les N résultats » ouvre la grille complète.

### A6. Habituels et favoris — _v1.0_

En tête du catalogue : les articles les plus achetés (calculés à partir de l'historique des courses clôturées) et les favoris épinglés.

### A7. Dictée vocale — _v1.0_

Aucun développement spécifique : le **micro du clavier** (iPhone comme Android) fonctionne dans la barre d'ajout, gratuitement. A2 sait découper « deux baguettes, du beurre et six œufs » en trois lignes.

**Séparer les articles à la voix** : la dictée du clavier n'écrit une virgule que si on dit « virgule » ; sans séparateur, toute la phrase devient un seul article. Il suffit de dire **« et »** (ou « puis », ou « virgule ») entre deux articles : « deux baguettes et du beurre et six œufs ». La dictée d'Android (Gboard) se comporte de même pour la virgule. Les coupures sans séparateur (« deux baguettes trois tomates ») ne sont pas devinées : « farine 500 g » met la quantité après le nom, la coupure serait ambiguë. L'écran d'aide le dit (H10).

### A8. Coller une liste — _v1.1_

Liste → `⋯` → « Coller une liste » (avec F2) : chaque ligne d'un texte (SMS, note, recette trouvée sur le web) est analysée avec A2 ; aperçu avant ajout (le même que pour une liste reçue). Le texte est d'abord nettoyé : la mise en forme d'une messagerie autour des mots (`*gras*`, `_italique_`, `~barré~` de WhatsApp) est retirée, et les lignes sans lettre ni chiffre (séparateurs `-----`) sont ignorées. Si certaines lignes commencent par une puce (•, -, *, case à cocher, numéro), seules celles-là comptent : les autres sont des titres ou des phrases. C'est ainsi que le message de partage (F1) se relit même sans son lien. Une précision entre parenthèses en fin de ligne est ignorée. Une puce au milieu d'une ligne ne sépare deux articles que si c'est celle du début de la ligne (liste dont les retours à la ligne ont sauté : `- beurre - lait`) ; ailleurs, un tiret ou deux-points avant la quantité est retiré (« Lait - 2 L » → Lait, 2 L).

---

## B. La liste de courses

### B1. Liste par catégorie, courses par rayon — _v1.0_

Une liste **n'appartient à aucun magasin**, elle se range donc **par catégorie** ; le regroupement **par rayon** n'apparaît qu'en **mode courses**, une fois le magasin choisi (et dans le réglage des magasins).

- **Liste** : lignes groupées par **catégorie**, dans l'ordre du catalogue (06 § 2), catégories créées ensuite par ordre alphabétique, « Autres » et « Achats ponctuels » en dernier. Dans une catégorie : l'article générique en tête, puis alphabétique. En-tête : icône, couleur et nom de la catégorie, nombre de lignes.
- **Mode courses** : lignes groupées par **rayon effectif** (02 § 4) du magasin choisi, rayons dans l'ordre du parcours, le bloc **« À placer »** (C4) juste après le rayon en cours ; dans un rayon, ordre appris des articles, sinon alphabétique. L'en-tête porte le mot **« RAYON »** au-dessus de son nom, ou du titre tiré de ses catégories (« Pain · Café & thé +2 », 02 § 4), et son repère éventuel en dessous.

### B2. Plusieurs listes — _v1.0_

Créer, renommer, dupliquer, supprimer (avec confirmation ; des courses restées ouvertes pour cette liste sont alors terminées, sans apprentissage, et leurs achats restent dans l'historique), réordonner. Changement rapide de liste depuis l'en-tête. **Ajouter une ou plusieurs autres listes** à la liste courante, notamment à sa création (« Base de la semaine » + « Apéro ») : aperçu avec cases à cocher, puis fusion des quantités (voir [02 § 6](02-modele-metier.md#ajouter-une-liste-dans-une-autre)).

### B3. Éditer une ligne — _v1.0_

Tap sur une ligne → fiche : quantité (boutons `−`/`+` selon le pas de l'unité, qui passent d'eux-mêmes de 950 g à 1 kg et inversement, voir [02 § 5](02-modele-metier.md#conversions) ; ou saisie directe), unité (**changer d'unité convertit la quantité** quand c'est possible : 1200 g → kg = 1,2 kg ; sélecteur rangé par groupes et puces des unités habituelles, voir 06 § 1), **types acceptés** (puces sélectionnables, « Peu importe » par défaut, ajout d'un nouveau type), note. Lien « Modifier l'article » vers sa fiche complète.

### B4. Supprimer une ligne — _v1.0_

Glisser vers la gauche ou bouton dans la fiche ; message « Annuler » pendant 4 secondes. Le glissé doit être long (ou rapide) et nettement horizontal : faire défiler la liste du pouce en partant d'une ligne, un peu en diagonale, ne la supprime pas.

### B5. Choisir le magasin — _v1.0_

Au départ des courses (« C'est parti ») : le dernier magasin utilisé pour cette liste est proposé, avec **« Un autre magasin »** pour en créer un en le nommant. Sans aucun magasin (premier lancement, ou après avoir supprimé le dernier), seul son nom est demandé : il est créé vide, et ses rayons se rangent pendant les courses (C4). La liste elle-même n'affiche pas de magasin (B1).

### B6. Vider — _v1.0_

« Vider la liste » (avec confirmation). Pas de « Retirer les lignes cochées » : une ligne n'est cochée qu'en courses encore ouvertes, et la retirer la sortirait de l'historique et de l'apprentissage ; c'est « Terminer les courses » qui fait partir les cochées.

---

## C. Mode courses

### C1. Écran « En magasin » — _v1.0_

Lancé par un bouton bien visible sur la liste ; confirmation du magasin.

- Lignes plus grandes, texte ≥ 18 px, cibles tactiles ≥ 48 px.
- **L'écran reste allumé** (Wake Lock, voir 07 § 3).
- Barre de progression `12 / 18`.

### C2. Cocher — _v1.0_

- Tap sur une ligne = dans le caddie : barrée, puis glisse en fin de rayon (H3), avec un son (H6).
- Dernière ligne d'un rayon cochée → le rayon se **replie** avec une coche ; le rayon suivant devient le rayon courant (mis en évidence) : le premier rayon qui a encore des articles à prendre, à partir de celui de la dernière coche.
- Re-tap = décocher.

### C3. Pas pris — _v1.0_

Glisser une ligne → « Pas pris » : elle passe en bas, grisée, et restera dans la liste après les courses. La raison n'importe pas (introuvable, rupture, plus besoin, trop cher) : l'article n'est simplement pas dans le caddie. En interne, le statut s'appelle `unavailable`.

### C4. Ranger le magasin en cochant ; ajouter pendant les courses — _v1.0_

**Ranger en cochant** : un magasin se construit pendant les courses, sans rien régler avant.

- Les articles dont la catégorie n'a pas encore de rayon dans ce magasin sont dans le bloc **« À placer »**, rangé par catégorie avec un intertitre par catégorie (icône, nom, couleur, nombre d'articles à prendre) qui la replie ou la déplie d'un toucher, affiché juste après le rayon en cours (en tête s'il n'y en a pas encore). À la première course dans un magasin, tout y est.
- **Cocher** un article de « À placer » le range dans le **rayon en cours** (ouvert à la première coche) : toute sa catégorie y devient principale. Si sa catégorie a déjà un rayon dans ce magasin, ou si c'est « Autres » ou « Achats ponctuels », seul l'article y est rangé (exception par article). Le rayon prend l'icône et la couleur de sa première catégorie.
- Bouton **« Rayon suivant »**, au-dessus de la barre d'ajout, tant qu'il reste des articles à placer : il ouvre un nouveau rayon juste après le rayon en cours, qui devient le rayon en cours. Le rayon en cours s'affiche même vide, avec une explication. Un rayon ouvert et resté vide n'est jamais doublé, et il disparaît à la fin des courses.
- Le rayon en cours : celui ouvert par « Rayon suivant », ou celui de la dernière coche si elle est plus récente. Il porte l'étiquette or **« Tu es ici »** et rebondit quand il le devient (pas de cadre violet, qui ressemblerait à un focus). « Rayon suivant » se confirme : son, message « Nouveau rayon : les articles cochés ensuite y seront rangés. », et l'écran va au nouveau rayon ; retouché sur un rayon neuf encore vide, il le dit au lieu de ne rien faire.
- Rien ne saute à l'écran : quand une catégorie est rangée en cochant un de ses articles, ses **autres articles déjà dans la liste**, encore à prendre, **restent dans « À placer »** jusqu'à ce qu'on les coche (ils vont alors dans le rayon en cours, sans exception s'il s'agit du rayon de leur catégorie). Un article ajouté ensuite va directement dans son rayon (ou « À récupérer » s'il est passé). Aux courses suivantes, tous sont dans le rayon de leur catégorie.

**Ajouter pendant les courses** : la barre d'ajout reste disponible. Si le rayon de l'article ajouté est **déjà passé** (on y a coché quelque chose, puis coché ailleurs), l'app l'indique (« Rayon Crèmerie déjà passé ») et place la ligne dans un groupe **« À récupérer »** affiché en haut.

Après l'ajout, un panneau propose : **« OK, à prendre »** ; **« Je l'ai déjà dans le caddie »** (article pris en passant : la ligne est cochée et l'achat compte pour l'apprentissage) ; **« Il est dans un autre rayon… »** (même choix que C5, retenu pour les prochaines courses).

« Je l'ai déjà dans le caddie » sur un article sans rayon : il est rangé dans le rayon en cours, comme dans « À placer ». Quand l'article a un rayon qui n'est pas celui où l'on est (celui de la dernière coche) : l'app demande **« Où as-tu pris … ? »** — **« Ici, au rayon X »** (coché dans ce rayon, et rangé dans ce rayon pour ce magasin : exception par article), **« Dans son rayon, Y »**, ou **« Dans un autre rayon… »** (choix du rayon, puis coché). L'achat compte ainsi dans le bon rayon pour l'apprentissage.

### C5. Changer un article de rayon — _v1.0_

Appui long sur une ligne → « Déplacer vers… » → le rayon où l'on est, puis ceux où la catégorie est présente, puis les autres (jamais « À placer ») → « Seulement cet article dans ce magasin » ou « Toute la catégorie dans ce magasin » (voir 02 § 4).

### C6. Terminer les courses (clôture) — _v1.0_

Bouton **« Terminer les courses »**, toujours visible en mode courses → confirmation → récapitulatif (articles achetés, pas pris, durée). Voir [02 § 8](02-modele-metier.md#8-courses-clôture-et-historique) :

- les lignes cochées quittent la liste et vont dans l'historique ; les autres restent ;
- les calculs sont faits à ce moment : ordre des rayons (C7), ordre des articles, fréquences d'achat, articles pas pris.

### C7. Apprentissage de l'ordre des rayons — _v1.0_

À chaque clôture, l'ordre dans lequel les rayons ont été parcourus (l'ordre des coches, pas leur heure) met à jour l'ordre du magasin (algorithme en 07 § 7.6), sauf si l'apprentissage est désactivé pour ce magasin. Les rayons non visités gardent leur place.

**Apprentissage activé / désactivé, par magasin** (G3) : activé par défaut. On le désactive quand l'ordre convient, ou pour des courses inhabituelles, et on le réactive quand on veut. Désactivé, le magasin garde son ordre ; on peut toujours le changer à la main (glisser-déposer).

**Critères** : après 3 sessions simulées parcourues dans l'ordre Crèmerie → Fruits & Légumes → Épicerie, la liste s'affiche dans cet ordre pour ce magasin, et l'ordre des autres magasins est inchangé. Les rayons ouverts par « Rayon suivant » prennent directement leur place dans le parcours.

### C8. Rouvrir les courses — _v1.0_

- Après la clôture, la liste (et le bilan) affichent **« Rouvrir les courses »** le **jour même** seulement, tant qu'aucune nouvelle session n'a démarré sur cette liste et que le magasin existe encore.
- Réouverture → retour en mode courses, articles déjà achetés affichés cochés, ajout et cochage des oublis, puis nouvelle clôture qui **remplace** les calculs précédents. Un article acheté puis remis dans la liste depuis n'est pas doublé : la nouvelle ligne l'emporte. Les rangements suivants vont après le rayon de la dernière coche (le rayon vide ouvert par « Rayon suivant » a disparu à la clôture).
- Session restée ouverte plus de **3 heures** après la dernière coche : à la réouverture de l'app, « Tu as terminé tes courses de _hier 18 h_ ? — Terminer · Continuer ».

**Critères** : clôturer, rouvrir, cocher un article de plus, clôturer → l'historique contient tous les articles une seule fois et l'apprentissage n'est appliqué qu'une fois.

---

## D. Ne rien oublier

Anti-oubli et revue par catégorie sont réunis dans un seul parcours, **« Faire le tour »**, ouvert par un bouton compact au-dessus des lignes de la liste : « Rien oublié ? Faire le tour », avec en pastille le nombre d'articles à racheter. Rien ne s'intercale entre les lignes. Le bouton n'apparaît qu'une fois des habitudes connues (au moins un article à racheter ou une catégorie à parcourir).

### D1. Suggestions anti-oubli — _v1.2_

- Premier écran du tour, **« À racheter »** : les articles qu'il est temps de reprendre d'après leur rythme d'achat (07 § 7.7), **5 au plus**, les plus en retard d'abord, chacun avec « Il y a 8 jours · tous les 7 jours ». Écran sauté s'il n'y en a aucun.
- Un toucher ajoute l'article (déjà dans la liste : le réglage de sa quantité, comme au catalogue) ; l'article reste affiché avec sa quantité. **« Pas cette fois »** l'écarte jusqu'aux prochaines courses terminées.
- Dans le catalogue, les **Habituels** mettent en tête ces mêmes articles, puis les plus achetés.

### D2. Revue rapide par catégorie — _v1.2_

Après « À racheter », un écran par catégorie (dans l'ordre du catalogue) avec ses **articles habituels** : favoris et articles achetés au moins 2 fois, les plus achetés d'abord ; les catégories sans habituel sont sautées. Même grille que le catalogue (un toucher ajoute, pastille de quantité si déjà dans la liste), et un lien vers tous les articles de la catégorie. On passe d'un écran à l'autre par les boutons du bas (« Suivant : Légumes », ‹) ou en glissant ; « Terminer » revient à la liste.

**Critères** : trois courses à une semaine d'intervalle avec du lait et du beurre, puis une semaine sans courses → le bouton annonce 2 articles ; « Pas cette fois » sur le beurre le retire, le lait touché s'ajoute à la liste ; plus rien à racheter ensuite.

### D3. Saisonnalité — _v1.2_

- Propriété **« mois de saison »** sur les articles des catégories Fruits, Légumes et Herbes aromatiques. Les saisons dépendent de **l'endroit où l'on fait ses courses**, pas de la langue de l'interface : le catalogue les donne par zone (06 § 4) ; seule zone pour l'instant, la **France métropolitaine**, sans réglage. Les mois de la zone sont copiés dans l'article à sa création depuis le catalogue ; produits importés (bananes, ananas…) et articles génériques n'en ont pas. Un article créé à la main n'a pas de mois ; on peut les saisir dans sa fiche.
- **Pastille « de saison »** (feuille verte, distincte des repères or) sur les articles de saison ce mois-ci : catalogue, liste, suggestions. Un article de saison toute l'année (carottes, thym) ou sans mois n'en a pas : elle ne signale que ce qui ne se trouve bien qu'une partie de l'année.
- **Calendrier des 12 mois** dans la fiche article (un toucher ajoute ou retire un mois, le mois en cours est souligné), pour les fruits, légumes et herbes, et pour tout article qui a déjà des mois.
- **Filtre « De saison »** dans le catalogue : les articles de saison ce mois-ci, rangés par catégorie.

**Critères** : à la mi-novembre, le filtre montre les poireaux, pas les fraises ; un article ajouté depuis le filtre porte la pastille dans la liste ; novembre ajouté aux fraises dans leur fiche → elles apparaissent dans le filtre.

---

## E. Recettes — _v1.0_

### E1. Gérer les recettes — _v1.0_

Onglet **Recettes** : liste avec recherche ; créer, éditer, dupliquer, supprimer.
Fiche recette : libellé, icône, **rendement** (« 4 personnes » par défaut, ou unité libre : « 1 cake », « 24 cookies », voir [02 § 7](02-modele-metier.md#7-recette)), ingrédients (ajoutés avec la même barre d'ajout que les listes, donc saisie naturelle A2 et création d'article A4), ingrédients facultatifs, ingrédients à **quantité fixe** (non recalculés selon le nombre de personnes : un pot de crème pour la raclette), étapes mises en forme : gras, titres, listes à puces ou numérotées, par une petite barre au-dessus du champ (enregistrées en Markdown). Le champ montre le texte mis en forme pendant qu'on l'écrit, comme à la lecture, jamais le Markdown (éditeur TipTap). La fiche garde l'écran allumé (H9).

### E2. Ajouter une recette à une liste — _v1.0_

Le rendement de la fiche est **fixe** (« 4 personnes », « 1 cake ») : on choisit la quantité voulue seulement au moment de l'ajout. Choix de la liste, puis « Pour combien de personnes ? » ou « Combien de cakes ? », aperçu des quantités recalculées, arrondies et simplifiées, cases à cocher, fusion avec les lignes existantes. Les lignes indiquent leur origine (« via Raclette »). Ce qui arrive ensuite à ces lignes (décochées dans l'aperçu, retirées de la liste, pas prises en magasin) **ne touche jamais la recette**.

**Critères** : recette pour 4 avec 2 oignons et 500 g de farine, ajoutée pour 6 → 3 oignons et 750 g de farine ; si la liste contient déjà 1 kg de farine → 1,75 kg après fusion. Recette « 1 cake » avec 3 œufs, demandée pour 2 cakes → 6 œufs. Raclette pour 4 avec 1 pot de crème à quantité fixe, ajoutée pour 10 → toujours 1 pot. 1 verre de vin blanc (unité de cuisine, [02 § 7](02-modele-metier.md#7-recette)) → 1 bouteille, note « 1 verre » ; si la liste a déjà 2 bouteilles → toujours 2, la note s'ajoute.

### E3. Partager une recette — _v1.1_

Même mécanisme que F1 et F2, même format de lien (voir [02 § 9](02-modele-metier.md#partager-une-recette)). Fiche recette → « Partager la recette » → feuille de partage du téléphone. Le message contient le nom et le rendement, les ingrédients (une puce chacun, avec « facultatif » ou « quantité fixe »), les étapes en texte simple, puis le mode d'emploi et le lien d'import.

Le destinataire colle le message dans Recettes → `⋯` → « Coller une recette » (sur Android, toucher le lien suffit souvent). Même aperçu que pour une liste (À vérifier, Reconnus, choix de l'article), avec le nom, l'icône, le rendement et les étapes de la recette à la place de « Ajouter à » ; « Ajouter la recette » la crée et ouvre sa fiche. Un ingrédient non reconnu est créé par défaut **dans le catalogue**, dans la catégorie reçue : la recette resservira (« Juste cette fois » reste possible). Si une recette porte déjà ce nom, la reçue s'appelle « Raclette (2) » (puis « Raclette (3) »…, au premier numéro libre) : rien n'est remplacé.

« Coller une recette » n'accepte qu'un message de recette partagé par l'app : un autre texte affiche qu'il ne s'agit pas d'une recette partagée par l'app. Un lien de recette collé dans une liste, ou de liste collé dans les recettes, dit où le coller.

---

## F. Partage — _v1.1_

Le partage fonctionne entre iPhone et Android dans les deux sens.

### F1. Envoyer une liste — _v1.1_

Liste → `⋯` → « Partager la liste » → feuille de partage du téléphone (Messages, WhatsApp, Mail…). Le message contient :

- la liste **lisible**, groupée par catégorie, une puce par article avec sa quantité, ses types et sa note (lisible même sans l'app) ;
- un **lien d'import** contenant les données de la liste (compressées dans l'URL, sans serveur ; liens courts, voir [02 § 9](02-modele-metier.md#9-partage-dune-liste)), précédé du mode d'emploi : copier le message ou juste le lien, puis dans l'app `⋯` → « Coller une liste » ; sur Android, toucher le lien suffit souvent (voir l'encadré de F2 : sur iPhone, un lien n'ouvre jamais l'app installée).

Seules les lignes encore à acheter partent. Sans feuille de partage (rare), le message est copié, à coller dans la messagerie.

### F2. Importer une liste — _v1.1_

Deux manières, toutes deux aboutissant à l'écran d'aperçu décrit en [02 § 9](02-modele-metier.md#9-partage-dune-liste) : correspondances automatiques (clé catalogue, slug, alias, catalogue utilisé comme dictionnaire), puis pour les articles non reconnus des **candidats proposés** (même icône, même catégorie), « C'est celui-là » mémorisé en alias, ou « Créer » avec libellé modifiable :

1. **Liste → `⋯` → « Coller une liste »** dans l'app : lit le presse-papier (sur iPhone, une bulle « Coller » à toucher), reconnaît le lien d'import ou, à défaut, analyse le texte ligne par ligne (A8). Si la lecture est refusée, un champ où coller à la main ; sur iPhone, ce champ s'ouvre aussi tant que la bulle reste sans réponse (un instant après le toucher), et toucher « Coller » ensuite suffit encore. _Méthode principale sur iPhone_ (voir encadré).
2. Ouvrir le lien d'import. _Méthode principale sur Android._

L'aperçu propose d'ajouter les lignes à une **nouvelle liste** (au nom reçu) ou à une liste existante (« Coller une liste » propose la liste courante) ; les quantités s'additionnent à celles déjà présentes, comme pour « Y ajouter le contenu d'une autre liste ».

> **iPhone** : un lien ouvert depuis Messages s'ouvre dans le navigateur (Chrome), **pas** dans l'app installée, et les deux n'ont pas les mêmes données. La page ouverte dans le navigateur l'explique donc d'abord, avec « Copier le lien » (puis, dans l'app, `⋯` → « Coller une liste ») et « Ajouter la liste ici quand même » (pour qui utilise l'app dans le navigateur). L'écran d'installation ne s'affiche jamais devant un lien d'import.
>
> **Android** : une app installée depuis Chrome partage ses données avec Chrome, et les liens de son adresse s'ouvrent généralement directement dans l'app. Ouvrir le lien suffit donc le plus souvent.

---

## G. Tout est modifiable — _v1.0_

### G1. Articles

Écran « Articles » (Réglages → Mes données) : recherche, filtre par catégorie. Fiche article : libellé, catégorie, unité et quantité par défaut, types, alias (« autres noms »), icône, favori ; on y arrive aussi par « Modifier l'article » dans la fiche d'une ligne, ou par un appui long sur une carte du catalogue. Créer, modifier, supprimer, **fusionner** deux articles. Section **« Doublons probables »** : paires d'articles avec la même icône et la même catégorie et des libellés proches ou un alias en commun ; « Fusionner » ou « Ce ne sont pas des doublons » (mémorisé).

### G2. Catégories

Créer, renommer, changer icône/couleur, **nom court** facultatif (titre des rayons, 02 § 4 ; par défaut celui du catalogue), supprimer (réaffectation des articles), fusionner.

### G3. Magasins et rayons

- Créer un magasin (vide, ou copie d'un autre), renommer, supprimer (même le dernier, jamais pendant des courses en cours). Le plus simple : le créer au départ des courses (B5) et laisser ses rayons se ranger en cochant (C4).
- Rayons : créer, **nommer (facultatif)**, ajouter un **repère** facultatif (« au fond du magasin »), icône/couleur, **réordonner par glisser-déposer**, fusionner (jamais dans « À placer » : ses catégories n'en sortiraient plus), supprimer. Sans nom, son titre vient de ses catégories principales (02 § 4) ; le champ nom le montre en grisé. Un rayon est toujours renommable.
- Rattacher les catégories aux rayons : une catégorie peut être dans plusieurs rayons d'un magasin, dont **un principal** (puce pleine ; contour = secondaire ; toucher pour changer) ; voir et ranger les catégories non rattachées.
- Supprimer un rayon : ses catégories principales vont dans « À placer », ou dans un de leurs rayons secondaires (au choix).
- **Apprentissage de l'ordre : activé / désactivé** (C7), pour chaque magasin ; voir et supprimer les exceptions par article.

### G4. Unités

Créer, renommer, modifier dimension, facteur et pas ; supprimer avec unité de remplacement.

### G5. Sélecteur d'icône

Depuis toute fiche (article, catégorie, rayon, recette) : grille des icônes du pack, recherche par mots-clés français, option « Aucune (monogramme) ».

---

## H. Réglages, ressenti et données — _v1.0_

### H1. Animations

**Toujours présentes**, sauf si le téléphone demande de réduire les animations (réglage d'accessibilité « Réduire les animations », pour qui les mouvements à l'écran donnent la nausée). Pas de réglage dans l'app : les animations de Motion (déplacements, fondus) ne coûtent presque rien, même sur un téléphone modeste.

### H3. Lignes cochées en mode courses

Elles **glissent en fin de rayon**, sans réglage : on voit ce qui est dans le caddie, on rattrape une coche par erreur d'un toucher, et un rayon terminé se replie tout seul.

### H4. Sauvegarde

Réglages → Mes données → **Sauvegarde** :

- **Exporter** toutes les données en fichier `.json` (feuille de partage → tes fichiers, ton stockage en ligne…) et **importer** un fichier en **remplacement** (après confirmation, avec le résumé du fichier) ; date de la dernière sauvegarde. Les préférences de l'appareil (sons, thème, écran allumé) ne sont pas dans le fichier. Pas d'import en fusion : ses règles seraient délicates (doublons d'articles, de magasins, de listes) pour un usage rare ; le remplacement, protégé par les copies automatiques, suffit, et le partage de listes passe par F1 et F2.
- **« Copier les données »** (la même sauvegarde, en texte) et **« Coller les données »** (lecture du presse-papiers, ou champ où coller le texte si le téléphone ne permet pas de le lire). Pratique pour désinstaller et réinstaller l'app : copier, coller dans une note ou un message, puis coller dans l'app réinstallée. Le fichier reste disponible : les deux sont utiles. Fonctionnalité de confort pour la copie (bouton absent si le navigateur ne la permet pas), le collage marche partout grâce au champ. Les textes de l'app restent **génériques** (« une note », « tes fichiers ») et ne nomment pas d'app propre à un téléphone ; seuls les écrans qui détectent le téléphone (installation, mode silencieux des sons) parlent d'iPhone ou d'Android.
- **Copies automatiques internes** (section « Copies automatiques ») : une copie par jour, au premier lancement ou retour dans l'app de la journée (avant la mise à jour du catalogue), et une juste **avant chaque remplacement** des données (restauration d'une copie, import d'un fichier ou d'un texte collé : marquée « avant remplacement », rien de ce qui a été fait depuis le matin n'est perdu), en gardant les **7 dernières** ; un remplacement qui échoue ne change rien et le dit ; **« Restaurer une copie »** (date, résumé, confirmation). Dans la plupart des cas, elles suffisent. Elles protègent contre une fausse manipulation, un import qui écrase tout ou un bug de mise à jour, **pas** contre la suppression de l'app, un changement de téléphone ou un effacement du stockage : elles vivent dans le même stockage que la base (une app web ne peut pas écrire un fichier hors de son stockage sans un geste de l'utilisateur, et un service en ligne contredirait « aucun serveur, aucun compte »).
- **Libellés explicatifs**, plutôt qu'un rappel de sauvegarde (supprimer l'app efface ses données, iOS le dit) :
  - sous **« Exporter un fichier »** : à quoi sert le fichier — changer de téléphone, réinstaller l'app (la supprimer efface ses données, iOS le précise), passer de la préproduction à la production, garder une copie hors du téléphone ;
  - à côté de **« Restaurer une copie »** : le rôle des copies automatiques — revenir sur une fausse manipulation, un import ou une mise à jour, jusqu'à 7 jours en arrière ; elles restent dans le téléphone et disparaissent avec l'app.

### H5. Installation, stockage, mises à jour

- Premier lancement dans le navigateur : écran expliquant comment **installer l'app** (indispensable sur iPhone, voir 07 § 4) ; sur Android, bouton **« Installer »**.
- Demande de stockage persistant, **automatique et silencieuse** au démarrage de l'app installée ; fonctionnement complet hors ligne.
- Nouvelle version disponible : bandeau « Version 1.2.0 disponible — Mettre à jour » (jamais de mise à jour forcée en plein magasin), puis écran **« Quoi de neuf »** (voir 07 § 6).
- Écran « À propos » : numéro de version, bouton « Rechercher une mise à jour » (réponse en 10 s au plus, message clair si le serveur ne répond pas), lien vers la liste des bibliothèques et de leurs licences (générée au build).

### H6. Sons

Petits sons discrets et gratuits sur les actions : ajout d'un article, cocher, rayon terminé, courses terminées, suppression. Réglage **Sons** général, plus **un interrupteur par son** avec un bouton pour l'écouter (tous activés par défaut). Volume bas. Respecte le mode silencieux de l'iPhone. Voir 05 § 7.

### H8. Simplification des quantités

**Toujours active**, sans réglage : 1200 g → 1,2 kg, avec « Annuler » pour une exception (voir [02 § 5](02-modele-metier.md#conversions)).

### H9. Écran allumé

Réglage **activé par défaut** : en mode courses, l'écran ne se met pas en veille (Screen Wake Lock, C1) ; sur la fiche d'une recette non plus, pour cuisiner en la lisant. Grisé si le téléphone ne le permet pas.

### H10. Aide

Réglages → **Aide** : le conseil ci-dessous en tête, un mode d'emploi court (remplir la liste, faire les courses, terminer, rouvrir) et **ce que l'app règle toute seule** (ordre des rayons et des articles, rayon d'un article, habitudes ; apprentissage activé ou non par magasin).

Conseil mis en avant : **suivre le même parcours** dans un magasin, au moins pendant les premières courses, le temps que l'app apprenne l'ordre ; cocher les articles **au moment où on les prend**, pas tous à la caisse. Ensuite, on peut désactiver l'apprentissage si l'ordre convient.

### H11. Thème

Réglages → **Thème** : _Automatique_ (par défaut : suit le réglage clair ou sombre du téléphone, et change avec lui), _Sombre_, _Clair_. Préférence de l'appareil (comme les sons). Le thème est posé avant le premier affichage : pas d'éclair de la mauvaise couleur au lancement.

### H12. Bulles d'aide

Une bulle, montrée **une seule fois**, sur un écran assombri sauf l'élément concerné, avec une flèche ; un toucher n'importe où la ferme.

- Première course, sur le premier article de « À placer » : « Touche un article quand il est dans le caddie : l'app retient dans quel rayon il se trouve. »
- Après la première coche, sur « Rayon suivant » : « Tu changes de rayon ? Touche ici : les articles suivants iront dans le nouveau rayon. »
- Au premier bilan : « Ton magasin est enregistré : la prochaine fois, ta liste suivra ton parcours. »

Mémorisées sur le téléphone (préférences de l'appareil, hors sauvegarde) ; Réglages → Aide → **« Revoir les conseils »** les fait revenir.

## I. Langues — _v1.3_

### I3. Anglais — _v1.3_

Interface et catalogue de départ en anglais, langue choisie dans les réglages (le français reste la langue par défaut).

- Interface : un fichier de textes par langue (`src/i18n/en.ts` à côté de `fr.ts`).
- Catalogue : ajout des libellés, alias et types anglais aux entrées existantes (même clé), ainsi qu'aux catégories et unités.
- Les articles du catalogue s'affichent alors dans la langue de chacun et se reconnaissent par leur clé lors d'un partage ; les articles créés à la main gardent le libellé tapé (voir [02 § 1](02-modele-metier.md#langues--libellé-slug-et-clé) et [§ 9](02-modele-metier.md#9-partage-dune-liste)).
- Rien à migrer : les données sont déjà organisées pour (06 § 4).
