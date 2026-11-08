# 03 — Fonctionnalités

Chaque fonctionnalité a un identifiant (`A1`, `B2`…) réutilisé dans le plan de développement et les tests, et une version cible :

| Version                  | Thème            | Fonctionnalités                       |
| ------------------------ | ---------------- | ------------------------------------- |
| **v1.0**                 | Cœur             | A1-A7 · B1-B6 · C1-C8 · G1-G5 · H1-H9 |
| **v1.1**                 | Recettes         | E1-E2                                 |
| **v1.2**                 | Anti-oubli       | D1-D2                                 |
| **v1.3**                 | Partage          | F1-F2 · A8                            |
| **Plus tard**            | —                | D3 · E3                               |
| **Idées non planifiées** | Peut-être jamais | I1 · I2 · I3                          |

L'ordre des versions après la v1.0 pourra être réévalué après quelques semaines d'usage réel. Les règles métier citées sont détaillées dans [02](02-modele-metier.md).

---

## A. Ajouter des articles à une liste

### A1. Barre d'ajout éclair — _v1.0_

Barre de saisie fixée en bas de l'écran Liste, accessible au pouce.

- Recherche dès la 1ʳᵉ lettre dans les libellés **et alias**, insensible aux accents, à la casse et au pluriel (`oeuf` → _Œufs_, `coca` → _Coca-Cola_).
- Suggestions (5 max) : icône, libellé, catégorie ; classées par pertinence puis fréquence d'achat. Un article déjà dans la liste est marqué de sa quantité.
- `Entrée` ou tap sur une suggestion = ajout ; la barre reste ouverte et se vide pour enchaîner.

**Critères** : taper `tom` puis `Entrée` ajoute _Tomates_ avec l'unité par défaut de l'article ; taper `chocolatine` trouve _Pain au chocolat_.

### A2. Saisie naturelle — _v1.0_

| Saisie                                   | Résultat                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `3 tomates`                              | Tomates, 3, unité par défaut de l'article                              |
| `tomates x3` / `tomates *3`              | idem                                                                   |
| `500g farine` / `farine 500 g`           | Farine, 500 g                                                          |
| `1,5 kg pommes`                          | Pommes, 1,5 kg                                                         |
| `1200 g boeuf`                           | Bœuf, 1,2 kg (simplification, 02 § 5)                                  |
| `deux baguettes` / `une douzaine d'œufs` | Baguette × 2 / Œufs × 12                                               |
| `pommes gala`                            | Pommes, type accepté _Gala_ (si _Gala_ est un type connu de l'article) |
| `2 baguettes, du beurre et 6 œufs`       | 3 lignes                                                               |

- Nombres en lettres jusqu'à vingt, « une douzaine », « une demi-douzaine ».
- Plusieurs articles séparés par `,`, `;`, `et`, retour à la ligne. Articles partitifs ignorés (`du`, `de la`, `des`, `d'`).
- Si l'unité saisie est incompatible avec l'unité par défaut de l'article, l'unité saisie l'emporte pour cette ligne.

**Critères** : batterie de tests unitaires couvrant chaque ligne du tableau.

### A3. Article déjà dans la liste — _v1.0_

Voir [02 § 6](02-modele-metier.md#une-seule-ligne-par-article-dans-une-liste). Un panneau léger (non bloquant) affiche « Déjà dans la liste : 2 kg » et propose **Ajouter [quantité]** ou **Ne rien faire** (par défaut).

**Critères** : ajouter _Pommes_ déjà présent puis `Entrée` → quantité inchangée ; choisir « Ajouter 1 kg » → 3 kg.

### A4. Créer un article inconnu — _v1.0_

Si aucun article ni alias ne correspond : suggestion « Créer _Sauce nuoc-mâm_ ».

- Un tap ouvre une **fiche rapide** préremplie : catégorie et **unité devinées** (dictionnaire de mots-clés, voir 06 § 5), icône devinée. Catégorie et unité sont **obligatoires** ; elles sont toujours remplies (au pire « Autres » / « pièce »).
- « Créer et ajouter » en un tap si les valeurs devinées conviennent.
- Si le slug existe déjà (variation d'écriture), l'article existant est proposé à la place.

### A5. Catalogue visuel — _v1.0_

Grille de catégories (icône + libellé) → grille d'articles (grande icône + libellé).

- Tap sur un article absent de la liste = ajout avec la quantité par défaut.
- Article déjà présent : pastille de quantité ; un tap ouvre le sélecteur de quantité (`−` / `+` / ✕) au lieu d'ajouter d'office.
- Recherche en haut de la grille.

### A6. Habituels et favoris — _v1.0_

En tête du catalogue : les articles les plus achetés (calculés à partir de l'historique des courses clôturées) et les favoris épinglés.

### A7. Dictée vocale — _v1.0_

Aucun développement spécifique : le **micro du clavier** (iPhone comme Android) fonctionne dans la barre d'ajout, gratuitement. A2 sait découper « deux baguettes, du beurre et six œufs » en trois lignes.

### A8. Coller une liste — _v1.3_

« Coller du texte » : chaque ligne d'un texte (SMS, note, recette trouvée sur le web) est analysée avec A2 ; aperçu avant ajout.

---

## B. La liste de courses

### B1. Tri par rayon dans l'ordre du magasin — _v1.0_

- Lignes groupées par **rayon effectif** (voir 02 § 4) du magasin sélectionné, rayons dans l'ordre du parcours, « Non classé » en dernier.
- Dans un rayon : ordre appris des articles si disponible, sinon alphabétique.
- En-tête de rayon : icône, couleur, libellé, nombre de lignes restantes.

### B2. Plusieurs listes — _v1.0_

Créer, renommer, dupliquer, supprimer (avec confirmation), réordonner. Changement rapide de liste depuis l'en-tête.

### B3. Éditer une ligne — _v1.0_

Tap sur une ligne → fiche : quantité (boutons `−`/`+` selon le pas de l'unité, ou saisie directe), unité (**changer d'unité convertit la quantité** quand c'est possible : 1200 g → kg = 1,2 kg), **types acceptés** (puces sélectionnables, « Peu importe » par défaut, ajout d'un nouveau type), note. Lien « Modifier l'article » vers sa fiche complète.

### B4. Supprimer une ligne — _v1.0_

Glisser vers la gauche ou bouton dans la fiche ; message « Annuler » pendant 5 secondes.

### B5. Choisir le magasin d'affichage — _v1.0_

Sélecteur de magasin dans l'en-tête de la liste ; le tri se met à jour immédiatement. Le dernier magasin choisi est mémorisé pour cette liste.

### B6. Vider — _v1.0_

« Retirer les lignes cochées » et « Vider la liste » (avec confirmation).

---

## C. Mode courses

### C1. Écran « En magasin » — _v1.0_

Lancé par un bouton bien visible sur la liste ; confirmation du magasin.

- Lignes plus grandes, texte ≥ 18 px, cibles tactiles ≥ 48 px.
- **L'écran reste allumé** (Wake Lock, voir 07 § 3).
- Barre de progression `12 / 18`.

### C2. Cocher — _v1.0_

- Tap sur une ligne = dans le caddie : barrée, puis glisse en fin de rayon ou disparaît (réglage H3), avec son et vibration (H6, H7).
- Dernière ligne d'un rayon cochée → le rayon se **replie** avec une coche ; le rayon suivant devient le rayon courant (mis en évidence).
- Re-tap = décocher.

### C3. Introuvable — _v1.0_

Glisser une ligne → « Introuvable » : elle passe en bas, grisée, et restera dans la liste après les courses.

### C4. Ajouter pendant les courses — _v1.0_

La barre d'ajout reste disponible. Si le rayon de l'article ajouté est **déjà terminé**, l'app l'indique (« Rayon Crèmerie déjà passé ») et place la ligne dans un groupe **« À récupérer »** affiché en haut.

### C5. Changer un article de rayon — _v1.0_

Appui long sur une ligne → « Déplacer vers… » → rayons où la catégorie est présente en premier, puis les autres → « Seulement cet article dans ce magasin » ou « Toute la catégorie dans ce magasin » (voir 02 § 4).

### C6. Terminer les courses (clôture) — _v1.0_

Bouton **« Terminer les courses »**, toujours visible en mode courses → confirmation → récapitulatif (articles achetés, introuvables, durée). Voir [02 § 8](02-modele-metier.md#8-courses-clôture-et-historique) :

- les lignes cochées quittent la liste et vont dans l'historique ; les autres restent ;
- les calculs sont faits à ce moment : ordre des rayons (C7), ordre des articles, fréquences d'achat, introuvables.

### C7. Apprentissage de l'ordre des rayons — _v1.0_

À chaque clôture, l'ordre dans lequel les rayons ont été parcourus met à jour l'ordre du magasin (algorithme en 07 § 7), sauf si l'ordre est verrouillé.

**Critères** : après 3 sessions simulées parcourues dans l'ordre Crèmerie → Fruits & légumes → Épicerie, la liste s'affiche dans cet ordre pour ce magasin, et l'ordre des autres magasins est inchangé.

### C8. Rouvrir les courses — _v1.0_

- Après la clôture, la liste affiche **« Rouvrir les courses »** tant qu'aucune nouvelle session n'a démarré sur cette liste.
- Réouverture → retour en mode courses, articles déjà achetés affichés cochés, ajout et cochage des oublis, puis nouvelle clôture qui **remplace** les calculs précédents.
- Session restée ouverte plusieurs heures : à la réouverture de l'app, « Tu as terminé tes courses de _hier 18 h_ ? — Terminer · Continuer ».

**Critères** : clôturer, rouvrir, cocher un article de plus, clôturer → l'historique contient tous les articles une seule fois et l'apprentissage n'est appliqué qu'une fois.

---

## D. Ne rien oublier

### D1. Suggestions anti-oubli — _v1.2_

Bandeau « Tu prends souvent : 🥛 Lait, 🧈 Beurre » basé sur la fréquence d'achat de chaque article (algorithme en 07 § 7). Tap = ajout ; « Pas cette fois » = masqué jusqu'aux prochaines courses.

### D2. Revue rapide par catégorie — _v1.2_

Mode « Tour de la cuisine » : un écran par catégorie présentant ses articles habituels ; tap pour ajouter, glisser pour passer à la suivante.

### D3. Saisonnalité — _plus tard_

- Propriété **« mois de saison »** sur les articles des catégories Fruits, Légumes et Herbes aromatiques, fournie par le catalogue de départ et modifiable dans la fiche article.
- Pastille « de saison » sur ces articles dans le catalogue, la liste et les suggestions ; petit calendrier des 12 mois dans la fiche article.
- Filtre « De saison » dans le catalogue.

---

## E. Recettes — _v1.1_

### E1. Gérer les recettes — _v1.1_

Onglet **Recettes** : liste avec recherche ; créer, éditer, dupliquer, supprimer.
Fiche recette : libellé, icône, **rendement** (« 4 personnes » par défaut, ou unité libre : « 1 cake », « 24 cookies », voir [02 § 7](02-modele-metier.md#7-recette)), ingrédients (ajoutés avec la même barre d'ajout que les listes, donc saisie naturelle A2 et création d'article A4), ingrédients facultatifs, étapes en texte libre.

### E2. Ajouter une recette à une liste — _v1.1_

Choix de la liste, puis « Pour combien de personnes ? » ou « Combien de cakes ? », aperçu des quantités recalculées, arrondies et simplifiées, cases à cocher, fusion avec les lignes existantes. Les lignes indiquent leur origine (« via Raclette »).

**Critères** : recette pour 4 avec 2 oignons et 500 g de farine, ajoutée pour 6 → 3 oignons et 750 g de farine ; si la liste contient déjà 1 kg de farine → 1,75 kg après fusion. Recette « 1 cake » avec 3 œufs, demandée pour 2 cakes → 6 œufs.

### E3. Partager une recette — _plus tard_

Même mécanisme que F1.

---

## F. Partage — _v1.3_

Le partage fonctionne entre iPhone et Android dans les deux sens.

### F1. Envoyer une liste — _v1.3_

Bouton « Partager » → feuille de partage du téléphone (Messages, WhatsApp, Mail…). Le message contient :

- la liste **lisible**, groupée par catégorie (lisible même sans l'app) ;
- un **lien d'import** contenant les données complètes de la liste (compressées dans l'URL, sans serveur).

### F2. Importer une liste — _v1.3_

Trois manières, toutes aboutissant à l'écran d'aperçu décrit en [02 § 9](02-modele-metier.md#9-partage-dune-liste) : correspondances automatiques (clé catalogue, slug, alias, catalogue utilisé comme dictionnaire), puis pour les articles non reconnus des **candidats proposés** (même icône, même catégorie), « C'est celui-là » mémorisé en alias, ou « Créer » avec libellé modifiable :

1. **« Coller une liste partagée »** dans l'app : lit le presse-papier, reconnaît le lien d'import ou, à défaut, analyse le texte ligne par ligne (A2). _Méthode principale sur iPhone_ (voir encadré).
2. Ouvrir le lien d'import. _Méthode principale sur Android._
3. Importer un fichier `.json` exporté.

> **iPhone** : un lien ouvert depuis Messages s'ouvre dans le navigateur (Chrome), **pas** dans l'app installée, et les deux n'ont pas les mêmes données. La page ouverte dans le navigateur affiche donc un bouton « Copier et ouvrir l'app » qui copie le lien, puis invite à faire « Coller une liste partagée » dans l'app.
>
> **Android** : une app installée depuis Chrome partage ses données avec Chrome, et les liens de son adresse s'ouvrent généralement directement dans l'app. Ouvrir le lien suffit donc le plus souvent.

---

## G. Tout est modifiable — _v1.0_

### G1. Articles

Écran « Articles » : recherche, filtre par catégorie. Fiche article : libellé, catégorie, unité par défaut, types, alias, icône, favori. Créer, modifier, supprimer, **fusionner** deux articles. Section **« Doublons probables »** : paires d'articles avec la même icône et la même catégorie et des libellés proches ou un alias en commun ; « Fusionner » ou « Ce ne sont pas des doublons » (mémorisé).

### G2. Catégories

Créer, renommer, changer icône/couleur, supprimer (réaffectation des articles), fusionner.

### G3. Magasins et rayons

- Créer un magasin (depuis un modèle, une copie ou de zéro), renommer, supprimer.
- Rayons : créer, renommer, icône/couleur, **réordonner par glisser-déposer**, fusionner, supprimer.
- Rattacher les catégories aux rayons : une catégorie peut être dans plusieurs rayons d'un magasin, dont **un principal** ; voir les catégories non rattachées.
- Verrouiller / déverrouiller l'ordre ; voir et supprimer les exceptions par article.

### G4. Unités

Créer, renommer, modifier dimension, facteur et pas ; supprimer avec unité de remplacement.

### G5. Sélecteur d'icône

Depuis toute fiche (article, catégorie, rayon, recette) : grille des icônes du pack, recherche par mots-clés français, option « Aucune (monogramme) ».

---

## H. Réglages, ressenti et données — _v1.0_

### H1. Animations

**Automatique** (suit le réglage d'accessibilité du système) · **Toujours** · **Jamais**. Permet de garder les animations même quand le système les désactive (ex. bureau à distance).

### H2. Affichage compact

Masque les icônes dans les listes pour afficher plus de lignes.

### H3. Lignes cochées en mode courses

Glissent en fin de rayon · disparaissent.

### H4. Sauvegarde

Export de toutes les données en fichier `.json` (feuille de partage → Fichiers, Drive…) ; import en **remplacement** ou en **fusion**. Rappel discret si aucune sauvegarde depuis 30 jours.

### H5. Installation, stockage, mises à jour

- Premier lancement dans le navigateur : écran expliquant comment **installer l'app** (indispensable sur iPhone, voir 07 § 4) ; sur Android, bouton **« Installer »**.
- Demande de stockage persistant, **automatique et silencieuse** au démarrage de l'app installée ; fonctionnement complet hors ligne.
- Nouvelle version disponible : bandeau « Version 1.2.0 disponible — Mettre à jour » (jamais de mise à jour forcée en plein magasin), puis écran **« Quoi de neuf »** (voir 07 § 6).
- Écran « À propos » : numéro de version, bouton « Rechercher une mise à jour » (réponse en 10 s au plus, message clair si le serveur ne répond pas), lien vers la liste des bibliothèques et de leurs licences (générée au build).

### H6. Sons

Petits sons discrets et gratuits sur les actions : ajout d'un article, cocher, rayon terminé, courses terminées, suppression. Réglage **Sons** général, plus **un interrupteur par son** avec un bouton pour l'écouter (tous activés par défaut). Respecte le mode silencieux de l'iPhone. Voir 05 § 7.

### H7. Vibrations

Retour haptique sur les mêmes actions, **là où le téléphone le permet** : vibrations sur Android, léger retour haptique expérimental sur iPhone. Réglage **Vibrations : activées / désactivées**, grisé si le téléphone ne le permet pas. Voir 05 § 7.

### H8. Simplification des quantités

Réglage **activé par défaut** : 1200 g → 1,2 kg, avec « Annuler » (voir [02 § 5](02-modele-metier.md#conversions)). _v1.0._

---

### H9. Écran allumé pendant les courses

Réglage **activé par défaut** : en mode courses, l'écran ne se met pas en veille (Screen Wake Lock, C1). Grisé si le téléphone ne le permet pas.

## Idées non planifiées

Idées notées pour plus tard, **sans version** — peut-être jamais réalisées.

### I1. Scan de code-barres

Scanner un article avec la caméra pour l'ajouter.

- Décodage dans le navigateur avec **ZXing** (WebAssembly, open source, hors ligne) — l'API native `BarcodeDetector` existe sur Chrome Android mais pas sur iPhone ; elle peut être utilisée quand elle est présente.
- Code inconnu : recherche du nom et de la catégorie dans **Open Food Facts** (base ouverte et gratuite, réseau nécessaire), proposée pour créer ou associer un article ; le code est ensuite enregistré sur l'article (scans suivants hors ligne).

### I2. Convertisseur d'unités

Outil accessible partout (recette, ligne de liste, menu) pour convertir **entre dimensions** grâce à des équivalences par article :

- mesures de cuisine : « 200 g de farine ≈ 1⅓ verre » ; « 1 c. à soupe de sucre ≈ 15 g » ;
- masse ↔ volume selon la densité : « 1 kg de miel ≈ 0,7 l » ;
- équivalences propres à un article : « 1 oignon moyen ≈ 150 g ».

Nécessite une table de densités / équivalences par article (catalogue) et des unités de cuisine (verre, tasse, cuillère).

### I3. Multilingue

Interface et catalogue de départ en anglais (puis éventuellement d'autres langues), langue choisie dans les réglages.

- Interface : un fichier de textes par langue (`src/i18n/en.ts` à côté de `fr.ts`).
- Catalogue : ajout des libellés, alias et types anglais aux entrées existantes (même clé), ainsi qu'aux catégories et unités.
- Les articles du catalogue s'affichent alors dans la langue de chacun et se reconnaissent par leur clé lors d'un partage ; les articles créés à la main gardent le libellé tapé (voir [02 § 1](02-modele-metier.md#langues--libellé-slug-et-clé) et [§ 9](02-modele-metier.md#9-partage-dune-liste)).
- Rien à migrer : les données sont déjà organisées pour (06 § 4).
