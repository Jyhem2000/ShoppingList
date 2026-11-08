# 03 — Fonctionnalités

Priorités : 🟢 **v1.0** (première version) · 🟡 **v1.1 / v1.2** (versions suivantes, précisées sur chaque fonctionnalité) · 🔵 **Plus tard**. Récapitulatif en fin de document ([Versions](#versions)).

Chaque fonctionnalité a un identifiant (`A1`, `B2`…) réutilisé dans le plan de développement et les tests. Les règles métier citées sont détaillées dans [02](02-modele-metier.md).

---

## A. Ajouter des articles à une liste

### 🟢 A1. Barre d'ajout éclair
Barre de saisie fixée en bas de l'écran Liste, accessible au pouce.
- Recherche dès la 1ʳᵉ lettre dans les libellés et alias, insensible aux accents, à la casse et au pluriel (`oeuf` → *Œufs*).
- Suggestions (5 max) : icône, libellé, catégorie ; classées par pertinence puis fréquence d'achat. Un article déjà dans la liste est marqué de sa quantité.
- `Entrée` ou tap sur une suggestion = ajout ; la barre reste ouverte et se vide pour enchaîner.

**Critères** : taper `tom` puis `Entrée` ajoute *Tomates* avec l'unité par défaut de l'article ; taper `creme fraiche` trouve *Crème fraîche*.

### 🟢 A2. Saisie naturelle
| Saisie | Résultat |
|---|---|
| `3 tomates` | Tomates, 3, unité par défaut de l'article |
| `tomates x3` / `tomates *3` | idem |
| `500g farine` / `farine 500 g` | Farine, 500 g |
| `1,5 kg pommes` | Pommes, 1,5 kg |
| `deux baguettes` / `une douzaine d'œufs` | Baguette × 2 / Œufs × 12 |
| `pommes gala` | Pommes, type accepté *Gala* (si *Gala* est un type connu de l'article) |
| `2 baguettes, du beurre et 6 œufs` | 3 lignes |

- Nombres en lettres jusqu'à vingt, « une douzaine », « une demi-douzaine ».
- Plusieurs articles séparés par `,`, `;`, ` et `, retour à la ligne. Articles partitifs ignorés (`du`, `de la`, `des`, `d'`).
- Si l'unité saisie est incompatible avec l'unité par défaut de l'article, l'unité saisie l'emporte pour cette ligne.

**Critères** : batterie de tests unitaires couvrant chaque ligne du tableau.

### 🟢 A3. Article déjà dans la liste
Voir [02 § 6](02-modele-metier.md#une-seule-ligne-par-article-dans-une-liste). Un panneau léger (non bloquant) affiche « Déjà dans la liste : 2 kg » et propose **Ajouter [quantité]** ou **Ne rien faire** (par défaut).

**Critères** : ajouter *Pommes* déjà présent puis `Entrée` → quantité inchangée ; choisir « Ajouter 1 kg » → 3 kg.

### 🟢 A4. Créer un article inconnu
Si aucun article ne correspond : suggestion « Créer *Sauce nuoc-mâm* ».
- Un tap ouvre une **fiche rapide** préremplie : catégorie et **unité devinées** (dictionnaire de mots-clés, voir 06 § 5), icône devinée. Catégorie et unité sont **obligatoires** ; elles sont toujours remplies (au pire « Autres » / « pièce »).
- « Créer et ajouter » en un tap si les valeurs devinées conviennent.
- Si le slug existe déjà (variation d'écriture), l'article existant est proposé à la place.

### 🟢 A5. Catalogue visuel
Grille de catégories (icône + libellé) → grille d'articles (grande icône + libellé).
- Tap sur un article absent de la liste = ajout avec la quantité par défaut.
- Article déjà présent : pastille de quantité ; un tap ouvre le sélecteur de quantité (`−` / `+` / ✕) au lieu d'ajouter d'office.
- Recherche en haut de la grille.

### 🟢 A6. Habituels et favoris
En tête du catalogue : les articles les plus achetés (calculés à partir de l'historique) et les favoris épinglés.

### 🟢 A7. Dictée vocale
Aucun développement spécifique : le **micro du clavier iOS** fonctionne dans la barre d'ajout, gratuitement. A2 sait découper « deux baguettes, du beurre et six œufs » en trois lignes.
> L'API Web Speech n'est pas retenue : sur iOS, elle passe par les serveurs d'Apple, demande le réseau et fonctionne mal dans une app installée sur l'écran d'accueil. Voir 07 § 3.

### 🟡 A8. Coller une liste *(v1.1)*
« Coller du texte » : chaque ligne d'un texte (SMS, note, recette trouvée sur le web) est analysée avec A2 ; aperçu avant ajout.

---

## B. La liste de courses

### 🟢 B1. Tri par rayon dans l'ordre du magasin
- Lignes groupées par **rayon effectif** (voir 02 § 4) du magasin sélectionné, rayons dans l'ordre du parcours, « Non classé » en dernier.
- Dans un rayon : ordre appris des articles si disponible, sinon alphabétique.
- En-tête de rayon : icône, couleur, libellé, nombre de lignes restantes.

### 🟢 B2. Plusieurs listes
Créer, renommer, dupliquer, supprimer (avec confirmation), réordonner. Changement rapide de liste depuis l'en-tête.

### 🟢 B3. Éditer une ligne
Tap sur une ligne → fiche : quantité (boutons `−`/`+` selon le pas de l'unité, ou saisie directe), unité, **types acceptés** (puces sélectionnables, « Peu importe » par défaut, ajout d'un nouveau type), note. Lien « Modifier l'article » vers sa fiche complète.

### 🟢 B4. Supprimer une ligne
Glisser vers la gauche ou bouton dans la fiche ; message « Annuler » pendant 5 secondes.

### 🟢 B5. Choisir le magasin d'affichage
Sélecteur de magasin dans l'en-tête de la liste ; le tri se met à jour immédiatement. Le dernier magasin choisi est mémorisé pour cette liste.

### 🟢 B6. Vider
« Retirer les lignes cochées » et « Vider la liste » (avec confirmation).

---

## C. Mode courses

### 🟢 C1. Écran « En magasin »
Lancé par un bouton bien visible sur la liste ; confirmation du magasin.
- Lignes plus grandes, texte ≥ 18 px, cibles tactiles ≥ 48 px.
- **L'écran reste allumé** (Screen Wake Lock, voir 07 § 3).
- Barre de progression `12 / 18`.

### 🟢 C2. Cocher
- Tap sur une ligne = dans le caddie : barrée, puis glisse en fin de rayon ou disparaît (réglage H3).
- Dernière ligne d'un rayon cochée → le rayon se **replie** avec une coche ; le rayon suivant devient le rayon courant (mis en évidence).
- Re-tap = décocher.

### 🟢 C3. Introuvable
Glisser une ligne → « Introuvable » : elle passe en bas, grisée, et restera dans la liste après les courses.

### 🟢 C4. Ajouter pendant les courses
La barre d'ajout reste disponible. Si le rayon de l'article ajouté est **déjà terminé**, l'app l'indique (« Rayon Crèmerie déjà passé ») et place la ligne dans un groupe **« À récupérer »** affiché en haut.

### 🟢 C5. Changer un article de rayon
Appui long sur une ligne → « Déplacer vers… » → choix du rayon → « Toute la catégorie dans ce magasin » ou « Seulement cet article dans ce magasin » (voir 02 § 4).

### 🟢 C6. Terminer les courses
« Terminer » → récapitulatif (articles achetés, introuvables, durée) → les lignes cochées quittent la liste et sont enregistrées dans l'historique ; les autres restent.

### 🟢 C7. Apprentissage de l'ordre des rayons
À chaque clôture, l'ordre dans lequel les rayons ont été parcourus met à jour l'ordre du magasin (algorithme en 07 § 7), sauf si l'ordre est verrouillé.

**Critères** : après 3 sessions simulées parcourues dans l'ordre Crèmerie → Fruits & légumes → Épicerie, la liste s'affiche dans cet ordre pour ce magasin, et l'ordre des autres magasins est inchangé.

---

## D. Ne rien oublier

### 🟡 D1. Suggestions anti-oubli *(v1.2)*
Bandeau « Tu prends souvent : 🥛 Lait, 🧈 Beurre » basé sur la fréquence d'achat de chaque article (algorithme en 07 § 7). Tap = ajout ; « Pas cette fois » = masqué jusqu'aux prochaines courses.

### 🟡 D2. Revue rapide par rayon *(v1.2)*
Mode « Tour de la cuisine » : un écran par catégorie présentant ses articles habituels ; tap pour ajouter, glisser pour passer à la suivante.

### 🔵 D3. Saisonnalité
Pastille « de saison » sur les fruits et légumes (table statique mois × article).

---

## E. Recettes

> Dans la v1.0, développées comme une **étape à part**, une fois le cœur de l'app (liste, mode courses, gestion) terminé et stable.

### 🟢 E1. Gérer les recettes
Onglet **Recettes** : liste avec recherche ; créer, éditer, dupliquer, supprimer.
Fiche recette : libellé, icône, nombre de personnes, ingrédients (ajoutés avec la même barre d'ajout que les listes, donc saisie naturelle A2 et création d'article A4), ingrédients facultatifs, étapes en texte libre.

### 🟢 E2. Ajouter une recette à une liste
Voir [02 § 7](02-modele-metier.md#7-recette) : choix de la liste, nombre de personnes, aperçu des quantités recalculées et arrondies, cases à cocher, fusion avec les lignes existantes. Les lignes indiquent leur origine (« via Raclette »).

**Critères** : recette pour 4 avec 2 oignons et 500 g de farine, ajoutée pour 6 → 3 oignons et 750 g de farine ; si la liste contient déjà 1 kg de farine → 1,75 kg après fusion.

### 🔵 E3. Partager une recette
Même mécanisme que F1.

---

## F. Partage

Le partage fonctionne entre iPhone et Android dans les deux sens.

### 🟡 F1. Envoyer une liste *(v1.1)*
Bouton « Partager » → feuille de partage iOS (Messages, WhatsApp, Mail…). Le message contient :
- la liste **lisible**, groupée par catégorie (lisible même sans l'app) ;
- un **lien d'import** contenant les données complètes de la liste (compressées dans l'URL, sans serveur).

### 🟡 F2. Importer une liste *(v1.1)*
Trois manières, toutes aboutissant à l'écran d'aperçu décrit en [02 § 9](02-modele-metier.md#9-partage-dune-liste) :
1. **« Coller une liste partagée »** dans l'app : lit le presse-papier, reconnaît le lien d'import ou, à défaut, analyse le texte ligne par ligne (A2). *Méthode principale sur iPhone* (voir encadré).
2. Ouvrir le lien d'import. *Méthode principale sur Android.*
3. Importer un fichier `.json` exporté.

> **Particularité iOS** : un lien ouvert depuis Messages s'ouvre dans Safari, **pas** dans l'app installée, et les deux n'ont pas les mêmes données. La page ouverte dans Safari affiche donc un bouton « Copier et ouvrir l'app » qui copie le lien, puis invite à faire « Coller une liste partagée » dans l'app.
>
> **Android** : une app installée depuis Chrome partage ses données avec Chrome, et les liens de son adresse s'ouvrent généralement directement dans l'app. Ouvrir le lien suffit donc le plus souvent ; « Coller une liste partagée » reste disponible.

### 🔵 F3. Scan de code-barres
Scanner un article avec la caméra pour l'ajouter. Solution **gratuite** :
- décodage des codes-barres dans le navigateur avec la bibliothèque open source **ZXing** (WebAssembly, licence libre, fonctionne hors ligne) — l'API native `BarcodeDetector` n'existe pas sur Safari iOS ;
- premier scan d'un code inconnu : recherche du nom et de la catégorie dans **Open Food Facts** (base de données ouverte et gratuite, réseau nécessaire), proposée pour créer ou associer un article ;
- le code-barres est ensuite enregistré sur l'article : les scans suivants fonctionnent hors ligne.

---

## G. Tout est modifiable

### 🟢 G1. Articles
Écran « Articles » : recherche, filtre par catégorie. Fiche article : libellé, catégorie, unité par défaut, types, alias, icône, favori. Créer, modifier, supprimer, **fusionner** deux articles.

### 🟢 G2. Catégories
Créer, renommer, changer icône/couleur, supprimer (réaffectation des articles), fusionner.

### 🟢 G3. Magasins et rayons
- Créer un magasin (depuis un modèle, une copie ou de zéro), renommer, supprimer.
- Rayons : créer, renommer, icône/couleur, **réordonner par glisser-déposer**, fusionner, supprimer.
- Rattacher les catégories aux rayons (une catégorie → un rayon par magasin) ; voir les catégories non rattachées.
- Verrouiller / déverrouiller l'ordre ; voir et supprimer les exceptions par article.

### 🟢 G4. Unités
Créer, renommer, modifier dimension, facteur et pas ; supprimer avec unité de remplacement.

### 🟢 G5. Sélecteur d'icône
Depuis toute fiche (article, catégorie, rayon, recette) : grille des icônes du pack, recherche par mots-clés français, option « Aucune (monogramme) ».

---

## H. Réglages et données

### 🟢 H1. Animations
**Automatique** (suit le réglage d'accessibilité du système) · **Toujours** · **Jamais**. Permet de garder les animations même quand le système les désactive (ex. bureau à distance).

### 🟢 H2. Affichage compact
Masque les icônes dans les listes pour afficher plus de lignes.

### 🟢 H3. Lignes cochées en mode courses
Glissent en fin de rayon · disparaissent.

### 🟢 H4. Sauvegarde
Export de toutes les données en fichier `.json` (feuille de partage iOS → Fichiers, iCloud Drive…) ; import en **remplacement** ou en **fusion**. Rappel discret si aucune sauvegarde depuis 30 jours.

### 🟢 H5. Installation et stockage
- Au premier lancement dans Safari : écran expliquant comment **ajouter l'app à l'écran d'accueil** (indispensable sur iOS, voir 07 § 4).
- Dans Chrome Android : bouton **« Installer l'application »** (invite d'installation native du navigateur).
- Demande de stockage persistant au navigateur.
- Fonctionnement complet hors ligne.

---

## Versions

| Version | Fonctionnalités | En une phrase |
|---|---|---|
| **v1.0 — cœur** | A1-A7 · B1-B6 · C1-C7 · G1-G5 · H1-H5 | Remplir sa liste vite, faire ses courses dans l'ordre des rayons, tout personnaliser, sauvegarder |
| **v1.0 — recettes** (étape à part) | E1-E2 | Gérer ses recettes et les ajouter à une liste pour N personnes |
| **v1.1 — partage** | F1-F2 · A8 | Envoyer une liste à son conjoint (iPhone ↔ Android), coller une liste en texte |
| **v1.2 — anti-oubli** | D1-D2 | Suggestions d'articles habituels et revue rapide avant de partir |
| **Plus tard** | D3 · E3 · F3 | Saisonnalité, partage de recettes, scan de code-barres |

L'ordre des versions après la v1.0 sera réévalué après quelques semaines d'usage réel.
