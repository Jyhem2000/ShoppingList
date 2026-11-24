# 04 — Écrans et navigation

Cible : app installée sur l'écran d'accueil (plein écran, sans barre de navigateur), iPhone d'abord, Android ensuite. Respect des zones de sécurité (encoche / Dynamic Island en haut, barre d'accueil en bas).

## 1. Structure

Barre d'onglets en bas (masquée en mode courses) :

| Onglet        | Icône (Lucide) | Contenu                                   | Version |
| ------------- | -------------- | ----------------------------------------- | ------- |
| **Liste**     | `list-checks`  | La liste courante (écran d'accueil)       | v1.0    |
| **Catalogue** | `layout-grid`  | Parcourir les articles par catégorie      | v1.0    |
| **Recettes**  | `chef-hat`     | Les recettes                              | v1.0    |
| **Réglages**  | `settings`     | Réglages, gestion des données, sauvegarde | v1.0    |

L'en-tête de chaque écran (titre, et bouton de retour sur une sous-page) **reste visible en haut** quand le contenu défile, avec sa marge haute : le titre ne passe jamais sous le flou qu'iOS 26 pose sous la barre d'état, qu'aucun réglage web ne permet de retirer. Une fine bordure sépare toujours l'en-tête du contenu, que l'écran défile ou non. Le mode courses suit la même règle (le nom du magasin ne passe pas sous le flou).

Un écran s'ouvre en haut ; au **retour** (bouton ‹ de l'en-tête, retour d'Android), il retrouve la position où on l'avait laissé. Le bouton ‹ revient à **l'écran d'où l'on vient** (fiche d'article ouverte depuis le catalogue → catalogue), comme le retour d'Android ; sans écran précédent dans l'app (lien direct, app rouverte sur cet écran), il mène à l'écran parent (Réglages → Articles). Après la suppression d'un article ou d'un magasin, même retour. Les lignes qui mènent à un autre écran (Réglages, liste des articles) sont des boutons, pas des liens : un appui long ne les fait pas glisser et n'ouvre pas l'aperçu d'iOS.

Les fiches d'édition s'ouvrent en **panneaux glissants depuis le bas** (bottom sheets), refermables d'un glissement vers le bas.

Sur Android, le geste ou bouton **Retour** du système ferme d'abord le panneau ouvert, puis revient à l'écran précédent (chaque panneau et écran correspond à une entrée de l'historique de navigation).

## 2. Écrans

### 2.1 Liste (accueil)

```
┌──────────────────────────────────┐
│ Courses semaine ▾             ⋯  │  ← liste courante (changer), menu
├──────────────────────────────────┤
│ [      🛒 C'est parti        ]   │  ← au-dessus des lignes, sans défiler
│ 💡 Rien oublié ? Faire le tour ③ │  ← D1, D2 (v1.2) : à racheter
│                                  │
│ ● Fruits                      1  │  ← en-tête de catégorie (couleur)
│  🍎 Pommes   Gala ou Golden 1 kg │
│ ● Légumes                     2  │
│  🥕 Carottes               1 kg  │
│  🌿 Persil                 1 botte│
│ ● Œufs                        1  │
│  🥚 Œufs                     × 6 │
│ ● Autres                      1  │
│  SN Sauce nuoc-mâm           × 1 │  ← monogramme
│                                  │
│ [↺ Rouvrir les courses (18 h 02)]│  ← C8, si courses récemment clôturées
├──────────────────────────────────┤
│ 🔍 Ajouter un ou plusieurs arti… │  ← A1 (micro = celui du clavier)
├──────────────────────────────────┤
│  Liste   Catalogue  Recettes  ⚙  │
└──────────────────────────────────┘
```

- Menu `⋯` : **seulement des actions sur la liste courante** (« Actions sur cette liste ») — renommer, dupliquer, « Compléter avec une liste » (panneau « Compléter « Liste 1 » »), « Partager la liste » _(v1.1)_, « Coller une liste » _(v1.1)_, vider, supprimer la liste. Les autres listes s'ouvrent en touchant le nom de la liste (pas dans ce menu, pour ne pas mélanger cette liste et les autres).
- Tap sur le nom de la liste → **Mes listes** : changer de liste, réordonner (poignée), créer une liste en y ajoutant le contenu d'autres listes.
- La liste est rangée **par catégorie** (03 B1) ; le magasin se choisit au départ des courses (« C'est parti »), et les magasins se gèrent dans Réglages → Magasins & rayons.
- **« Rien oublié ? Faire le tour »** _(v1.2, 03 D1, D2)_ : bouton compact au-dessus des lignes (et au-dessus de l'écran vide), pastille or du nombre d'articles à racheter ; ouvre l'écran Faire le tour (§ 2.13). Absent tant qu'aucune habitude n'est connue.
- Tap sur une ligne → **fiche ligne** (B3). Glisser à gauche → supprimer (B4), avec « Annuler » pendant 4 secondes.
- État vide : illustration + « Ajoute ton premier article » + raccourci vers le Catalogue.

### 2.2 Barre d'ajout et ses panneaux

- Suggestions affichées **au-dessus** de la barre (et donc au-dessus du clavier).
- Panneau « Déjà dans la liste : 2 kg — [Ajouter 1 kg] [Ne rien faire] » (A3).
- Fiche rapide de création d'article (A4) : libellé, catégorie, unité, icône — bouton « Créer et ajouter ».
- Message « Converti en 1,2 kg — Annuler » après une simplification (H8).

### 2.3 Mode courses

```
┌──────────────────────────────────┐
│ ✕   Super U        12/18  ▓▓▓▓░░ │
├──────────────────────────────────┤
│ ⚠ À récupérer                    │  ← C4
│  🧀 Comté                  200 g │
│ ✓ RAYON Fruits & légumes (replié)│
│ ● RAYON               ← courant  │
│   Frais                          │  ← sans nom : titre tiré des catégories
│   au fond du magasin             │  ← repère facultatif
│  🥚 Œufs                     × 6 │  ← grandes lignes
│  🧈 Beurre                   × 1 │
│  ─────────────────────────────── │
│  🥛 Lait (barré)             × 6 │  ← coché, glisse en bas
│ ● À placer                       │  ← C4 : catégories sans rayon ici
│  ☕ Café                   1 paq │  ← cocher = ranger dans le rayon courant
│ ● RAYON Pain · Café & thé +2     │
│  …                               │
├──────────────────────────────────┤
│        [ ↓ Rayon suivant ]       │  ← tant qu'il reste à placer
│ 🔍 Ajouter…          [✓ Terminer]  │
└──────────────────────────────────┘
```

- Première course dans un magasin : tout est dans « À placer » ; on coche dans l'ordre du parcours, « Rayon suivant » à chaque changement de rayon (C4). Bulles d'aide la première fois (H12). « Rayon suivant » est un bouton plein (violet), au-dessus de la barre d'ajout : c'est l'action clé tant qu'il reste des articles à placer (en contour, il passerait inaperçu). Les catégories de « À placer » se replient d'un toucher sur leur intertitre ; les blocs « À placer » et « À récupérer » se replient comme les rayons.

- Tap = cocher · glisser = pas pris · appui long = déplacer de rayon · tap sur la quantité = la changer.
- `✕` = quitter le mode courses **sans clôturer** (la session reste ouverte, on peut y revenir).
- **« Terminer les courses »** (bouton or « Terminer », à droite de la barre d'ajout) = clôture (C6), après confirmation.
- Article ajouté pendant les courses : panneau « OK, à prendre » · « Je l'ai déjà dans le caddie » · « Il est dans un autre rayon… » (C4).
- Sur la liste : **« C'est parti »** au-dessus des lignes, pour partir sans faire défiler la liste (puis choix du magasin, ou « Un autre magasin » à nommer ; sans magasin, seulement son nom) ; **« Reprendre les courses »** si une session est restée ouverte.

### 2.4 Récapitulatif de fin de courses

En haut, sous le titre, les boutons « Retour à la liste » et « Rouvrir » (C8) : l'écran n'a pas d'onglets, on n'en sort que par là. Puis la section « Récapitulatif » : articles achetés, pas pris (restés dans la liste), durée, éventuellement « Ordre des rayons mis à jour », et la liste des articles achetés.

### 2.5 Catalogue

- Haut : recherche avec suggestions sous le champ (A5), puis **Favoris** et **Habituels** (ce qu'il est temps de racheter d'abord, _v1.2_, puis les plus achetés ; 9 au plus).
- Puce **« De saison (novembre) »** sous la recherche _(v1.2, D3)_, avec le mois en cours : remplace l'accueil par les articles de saison ce mois-ci, une grille par catégorie ; un second toucher revient à l'accueil.
- Grille de catégories (icône, libellé, couleur) → grille d'articles (grande icône, libellé, pastille de quantité si déjà dans la liste courante, feuille verte « de saison » en haut à gauche _v1.2_).
- Appui long sur un article → fiche article (G1).

### 2.6 Recettes _(v1.0)_

- Liste des recettes (icône, libellé, rendement), recherche, et menu `⋯` (« Actions sur les recettes ») : « Nouvelle recette » et « Coller une recette » _(v1.1, 03 E3)_, qui lit le presse-papiers, sinon un champ où coller le message reçu. Dans un menu plutôt qu'en boutons sous la recherche : la place reste aux recettes. Sans recette, l'écran vide montre aussi les deux boutons.
- Fiche recette : en-tête (icône, libellé, rendement fixe (« 4 personnes », « 1 cake »)), ingrédients, étapes mises en forme ; « Modifier » en haut à droite ; en bas, le bouton principal **« Ajouter à une liste »**, puis « Partager la recette » _(v1.1, 03 E3)_, « Dupliquer » et « Supprimer la recette » (on lit la recette avant de l'ajouter). « Dupliquer » demande d'abord le nom de la nouvelle recette, puis l'ouvre à la place de l'originale : le retour mène à l'écran d'avant, pas à l'originale. L'écran reste allumé (réglage Écran allumé).
- Panneau « Ajouter à une liste » : liste cible (choix seulement s'il y en a plusieurs, la liste courante d'abord ; sinon son nom en sous-titre), quantité dans l'unité de rendement (`− 4 personnes +`), aperçu à cocher : chaque ingrédient avec sa quantité recalculée et ce qui arrivera (« à ajouter », « déjà 1 kg → 1,75 kg »). **Tout est coché, sauf les facultatifs** : on décoche ce qu'on a déjà (20 g de beurre). Rien n'est ajouté avant « Ajouter N ingrédients ». La quantité se règle dans ce panneau, jamais sur la fiche.
- Les lignes ajoutées affichent leur origine (« via Cake aux olives »), dans la liste et dans leur fiche.
- Édition, sur la même fiche : nom, rendement = nombre + unité (« personnes » par défaut, propositions en puces ou saisie libre), ingrédients ajoutés par la barre d'ajout (saisie naturelle, création d'article) puis réglés dans leur fiche (quantité, unité dont les unités de cuisine, sortes, « facultatif », « quantité fixe », chacun suivi de son explication entre parenthèses, sur la même ligne), étapes avec une barre de mise en forme (« Titre » et « Gras » écrits en toutes lettres, puis les icônes des puces et des numéros ; un retour à la ligne dans une liste ajoute la puce ou le numéro suivant), écrites directement mises en forme, telles qu'on les lira (pas de Markdown visible). Icône choisie parmi les icônes dessinées des articles, les plats et desserts proposés en premier.

### 2.7 Réglages

Organisé en accueil : les données de l'utilisateur, cœur du paramétrage, sont en tête et en grand ; les préférences de l'app, réglées une fois pour toutes, sont regroupées derrière une seule ligne.

```
Mes données       (« Le cœur de l'app… Tout se modifie ici. »)
  [ Articles    ]  [ Catégories ]     ← grandes tuiles : icône, nom, nombre
  [ 240 articles]  [ 39 catégories]
  [ Magasins &  ]  [ Unités     ]
  [ rayons : 2  ]  [ 18 unités  ]
  Sauvegarde ▸   Dernière sauvegarde : il y a 12 j
Application
  Préférences ▸   Sons, écran allumé, thème, langue
  Aide ▸          mode d'emploi, ce que l'app règle toute seule, « Revoir les conseils » (H10, H12)
  À propos ▸      Version 1.0.0 · Quoi de neuf ▸ · Licences ▸
```

**Préférences** :

```
Fonctionnalités   (grisée « Non disponible sur ce téléphone » si besoin)
  Sons .................. Activés ▸  (écran Sons : interrupteur général + un par son, avec écoute)
  Écran allumé                     ●  (« Seulement sur deux écrans : le mode courses et la fiche d'une recette… »)
Affichage
  Thème ................. Automatique · Sombre · Clair
  Langue ................ Français · English  (« L'app redémarre dans la langue choisie. »)
```

**Sauvegarde** : quatre actions de **même poids** (boutons secondaires), aucune n'étant l'action principale de l'écran ; seule la confirmation d'un import est en rouge.

```
Dernière sauvegarde : il y a 12 j
Garder une copie
  (libellé : changer de téléphone, réinstaller l'app, copie hors du téléphone)
  [ Exporter un fichier ]   [ Copier les données ]
Récupérer une copie
  [ Importer un fichier ]   [ Coller les données ]
Copies automatiques
  Restaurer une copie ▸
    (libellé : copies automatiques des 7 derniers jours, contre une fausse
     manipulation ; elles disparaissent avec l'app)
```

« Coller une liste » _(v1.1)_ n'est pas ici mais dans le menu `⋯` de la liste : on colle dans une liste.

### 2.8 Magasin

- Libellé (modifiable), interrupteur **« Apprendre l'ordre de mes courses »** (activé par défaut ; désactivé = ordre verrouillé, C7).
- Liste des rayons avec poignées de glisser-déposer : son nom, ou le titre tiré de ses catégories (02 § 4), puis son repère ou son nombre de catégories ; « À placer » en dernier. Toucher un rayon ouvre sa fiche : nom et repère facultatifs (le champ nom montre le titre automatique en grisé), catégories (puces : pleines = principale, contour = secondaire ; « + catégorie »), icône et couleur, fusion, suppression.
- Partout où l'on choisit un rayon (changer un article de rayon, « Où as-tu pris… ? », fusion, ranger une catégorie), il apparaît sous son titre, avec ses catégories en dessous s'il n'a pas de nom.
- Section « Catégories non rattachées » (en orange si non vide).
- Section « Exceptions » : articles placés hors du rayon principal de leur catégorie dans ce magasin.

### 2.9 Fiches de gestion

Articles, catégories, unités : liste + recherche → fiche d'édition. La fiche d'un article au poids a l'interrupteur « Se compte à la pièce » (02 § 2, 03 A2). Actions destructrices (supprimer, fusionner) en bas, en rouge, avec confirmation qui décrit les conséquences (« 3 listes et 1 recette utilisent cet article »).

### 2.10 Aperçu d'import _(v1.1)_

Écran « Liste reçue » (lien) ou « Liste collée » (texte), route `#/import`. Résumé (« 12 reconnus, 1 à confirmer, 2 non reconnus »), puis « Ajouter à » : une nouvelle liste au nom reçu, ou une liste existante. Lignes en deux sections, **À vérifier** (à confirmer et non reconnus) puis **Reconnus**, chacune avec sa case (décochée : pas ajoutée), son icône, ce qu'elle deviendra (« reçu : « Tomatess », à confirmer », « nouvel article, Légumes ») et sa quantité. « Tout décocher » / « Tout cocher » à droite du titre « À vérifier » (dès deux lignes). Un article non reconnu créé à la main ou tapé est créé par défaut **juste cette fois** (« Achats ponctuels », docs/03 A4) : une longue liste reçue n'encombre pas le catalogue ; dans le choix de l'article, la puce « Juste cette fois » décochée le garde dans le catalogue, dans la catégorie reçue (puce absente s'il était déjà un achat ponctuel chez l'expéditeur). Un article du catalogue reprend sa vraie catégorie. Toucher une ligne ouvre le choix de son article :

```
┌──────────────────────────────────┐
│ 🥜 Peanut butter        × 1 pot  │  ← article reçu
│    Confitures & Pâtes à tartiner │
│ Peut-être chez toi :             │
│  ( 🥜 Beurre de cacahuète )      │  ← même icône + même catégorie
│  ( 🍫 Pâte à tartiner )          │
│  Voir mes articles de la catégorie ▸ · 🔍 │
│ [ Créer : Peanut butter ✎ ]      │  ← par défaut, libellé modifiable
└──────────────────────────────────┘
```

Tap sur un candidat = « C'est celui-là ». Bouton « Ajouter N lignes ». Dans le navigateur de l'iPhone, un lien ouvre d'abord une explication : « Copier le lien » (puis `⋯` → « Coller une liste » dans l'app) ou « Ajouter la liste ici quand même ».

**Recette reçue** (03 E3) : même écran, titre « Recette reçue ». À la place de « Ajouter à » : l'icône, le nom et le rendement de la recette ; chaque ingrédient dit en plus s'il est facultatif ou à quantité fixe ; les étapes suivent les ingrédients. Un ingrédient non reconnu est créé par défaut dans le catalogue. « Ajouter la recette (N ingrédients) » crée la recette et revient à l'écran Recettes. Dans le navigateur de l'iPhone, l'explication renvoie à Recettes → « Coller une recette ». Un texte collé sans le lien attendu ne donne pas d'aperçu : « Pas de recette » (collé dans les recettes), « C'est une recette » ou « C'est une liste » (lien de l'autre type, avec l'endroit où le coller).

### 2.11 Premier lancement

1. Si ouvert dans le navigateur (non installé) : écran **« Installe l'app »** :
   - iPhone (Chrome) : gestes illustrés — bouton Partager de Chrome → « Ajouter à l'écran d'accueil » → Ajouter ;
   - Android (Chrome) : bouton **« Installer »** (invite native du navigateur).
     Lien discret « Continuer dans le navigateur quand même ».
2. Dans l'app installée : création des données de départ, puis la liste vide **« Liste 1 »** (le numéro dit qu'il peut y en avoir plusieurs et incite à la renommer). **Aucun magasin** : le premier se crée au premier « C'est parti » (03 B5), ses rayons pendant les courses (03 C4).

### 2.12 Mise à jour et « Quoi de neuf »

- Bandeau en bas, juste au-dessus de la barre d'onglets (hors de la zone floutée par iOS en haut) : « Version 1.2.0 disponible — **Mettre à jour** ». Au toucher, le bouton passe à « Mise à jour… » et l'app se recharge ; si le navigateur ne recharge pas de lui-même (vu sur iPhone), l'app le fait au bout de 3 s. Jamais affiché en mode courses.
- Après la mise à jour : panneau « Quoi de neuf dans la 1.2.0 » (liste courte issue du journal des versions).

### 2.13 Faire le tour _(v1.2)_

```
┌──────────────────────────────────┐
│ ‹  À racheter                1/7 │  ← titre = l'étape ; numéro de l'étape
├──────────────────────────────────┤
│ Tu en reprends d'habitude à ce   │
│ rythme : c'est peut-être le…     │
│ 🥛 Lait           Pas cette fois │
│    Il y a 8 jours ·              │
│    tous les 7 jours              │
│ 🥬 Poireaux 🍃               × 1 │  ← ajouté : sa quantité
├──────────────────────────────────┤
│ [‹]  [   Suivant : Fruits   ›  ] │  ← barre fixe au-dessus des onglets
└──────────────────────────────────┘
```

- Étapes : « À racheter » (03 D1, si des articles sont à racheter), puis une par catégorie qui a des habituels (03 D2), titrée du nom de la catégorie : texte d'introduction, grille du catalogue, « Voir tous les articles : Fruits ».
- Passer d'une étape à l'autre : boutons du bas, ou glisser à gauche / à droite ; le nouvel écran arrive du côté où l'on va. « Terminer » à la dernière étape, ‹ de l'en-tête : retour à la liste. L'onglet Liste reste actif.
- L'étape est dans l'adresse : au retour d'une catégorie du catalogue, on la retrouve.
- Les articles à racheter sont figés à l'ouverture : un article ajouté reste affiché avec sa quantité ; un article écarté disparaît.

## 3. Parcours clés

**Ajouter en 2 secondes** : Liste → taper `lai` → `Entrée` → _Lait_ ajouté sous Crèmerie.

**Créer un article** : taper `nuoc mam` → (aucun article ni alias) « Créer _Nuoc mam_ » → fiche rapide (Sauces & condiments / pot, devinés) → « Créer et ajouter ».

**Faire les courses** : Liste → « C'est parti » → confirmer le magasin → cocher au fil des rayons → « Terminer les courses » → récapitulatif.

**Oubli à la caisse** : Liste → « Rouvrir les courses » → ajouter et cocher → « Terminer les courses ».

**Corriger un rayon en magasin** : appui long sur _Steak haché_ → Déplacer vers « Frais libre-service » → « Seulement cet article dans ce magasin ».

**Ajouter une recette** _(v1.0)_ : Recettes → _Cake aux olives_ → « Ajouter à une liste » → « 2 cakes » → décocher la farine (déjà à la maison) → Ajouter.

**Envoyer la liste au conjoint** _(v1.1)_ : Liste → `⋯` → « Partager la liste » → Messages / WhatsApp.

- Destinataire sur **Android** : tap sur le lien → l'app s'ouvre sur l'aperçu → « Ajouter ».
- Destinataire sur **iPhone** : copier le message (ou le lien) → ouvrir l'app → `⋯` → « Coller une liste » → aperçu → « Ajouter ».

**Envoyer une recette** _(v1.1)_ : Recettes → _Raclette_ → « Partager la recette » → Messages / WhatsApp. Le destinataire copie le message → Recettes → `⋯` → « Coller une recette » → aperçu → « Ajouter la recette » (sur Android, toucher le lien suffit souvent).
