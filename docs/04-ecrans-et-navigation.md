# 04 — Écrans et navigation

Cible : app installée sur l'écran d'accueil (plein écran, sans barre de navigateur), iPhone d'abord, Android ensuite. Respect des zones de sécurité (encoche / Dynamic Island en haut, barre d'accueil en bas).

## 1. Structure

Barre d'onglets en bas (masquée en mode courses) :

| Onglet        | Icône (Lucide) | Contenu                                   | Version                    |
| ------------- | -------------- | ----------------------------------------- | -------------------------- |
| **Liste**     | `list-checks`  | La liste courante (écran d'accueil)       | v1.0                       |
| **Catalogue** | `layout-grid`  | Parcourir les articles par catégorie      | v1.0                       |
| **Recettes**  | `chef-hat`     | Les recettes                              | v1.1 (onglet absent avant) |
| **Réglages**  | `settings`     | Réglages, gestion des données, sauvegarde | v1.0                       |

L'en-tête de chaque écran (titre, et bouton de retour sur une sous-page) **reste visible en haut** quand le contenu défile, avec sa marge haute : le titre ne passe jamais sous le flou qu'iOS 26 pose sous la barre d'état, qu'aucun réglage web ne permet de retirer. Quand le contenu de l'écran dépasse la hauteur disponible, une fine bordure sépare l'en-tête du contenu. Le mode courses suit la même règle (nom du magasin sous le flou corrigé le 13 novembre 2026).

Un écran s'ouvre en haut ; au **retour** (bouton ‹ de l'en-tête, retour d'Android), il retrouve la position où on l'avait laissé. Les lignes qui mènent à un autre écran (Réglages, liste des articles) sont des boutons, pas des liens : un appui long ne les fait pas glisser et n'ouvre pas l'aperçu d'iOS.

Les fiches d'édition s'ouvrent en **panneaux glissants depuis le bas** (bottom sheets), refermables d'un glissement vers le bas.

Sur Android, le geste ou bouton **Retour** du système ferme d'abord le panneau ouvert, puis revient à l'écran précédent (chaque panneau et écran correspond à une entrée de l'historique de navigation).

## 2. Écrans

### 2.1 Liste (accueil)

```
┌──────────────────────────────────┐
│ Courses semaine ▾             ⋯  │  ← liste courante (changer), menu
├──────────────────────────────────┤
│ ↺ Rouvrir les courses (18 h 02)  │  ← C8, si courses récemment clôturées
│ 💡 Tu prends souvent : 🥛 🧈  +  │  ← D1 (v1.2)
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
│        [ 🛒 C'est parti ]        │
├──────────────────────────────────┤
│ 🔍 Ajouter un article…           │  ← A1 (micro = celui du clavier)
├──────────────────────────────────┤
│  Liste   Catalogue  Recettes  ⚙  │
└──────────────────────────────────┘
```

- Menu `⋯` : **seulement des actions sur la liste courante** (« Actions sur cette liste ») — renommer, dupliquer, « Y ajouter le contenu d'une autre liste » (panneau « Compléter « Courses » »), partager _(v1.3)_, coller une liste _(v1.3)_, retirer les cochés, vider, supprimer la liste. Les autres listes s'ouvrent en touchant le nom de la liste (14 novembre 2026 : « Toutes mes listes » retiré du menu, qui semblait mélanger cette liste et les autres).
- Tap sur le nom de la liste → **Mes listes** : changer de liste, réordonner (poignée), créer une liste en y ajoutant le contenu d'autres listes.
- La liste est rangée **par catégorie** (03 B1) ; le magasin se choisit au départ des courses (« C'est parti »), et les magasins se gèrent dans Réglages → Magasins & rayons.
- Tap sur une ligne → **fiche ligne** (B3). Glisser à gauche → supprimer (B4), avec « Annuler » pendant 5 secondes.
- État vide : illustration + « Ajoute ton premier article » + raccourci vers le Catalogue.

### 2.2 Barre d'ajout et ses panneaux

- Suggestions affichées **au-dessus** de la barre (et donc au-dessus du clavier).
- Panneau « Déjà dans la liste : 2 kg — [Ajouter 1 kg] [Ne rien faire] » (A3).
- Fiche rapide de création d'article (A4) : libellé, catégorie, unité, icône — bouton « Créer et ajouter ».
- Message « Converti en 1,2 kg — Annuler » après une simplification (H8).

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

- Première course dans un magasin : tout est dans « À placer » ; on coche dans l'ordre du parcours, « Rayon suivant » à chaque changement de rayon (C4). Bulles d'aide la première fois (H12).

- Tap = cocher · glisser = pas pris · appui long = déplacer de rayon · tap sur la quantité = la changer.
- `✕` = quitter le mode courses **sans clôturer** (la session reste ouverte, on peut y revenir).
- **« Terminer les courses »** (bouton or « Terminer », à droite de la barre d'ajout) = clôture (C6), après confirmation.
- Article ajouté pendant les courses : panneau « OK, à prendre » · « Je l'ai déjà dans le caddie » · « Il est dans un autre rayon… » (C4).
- Sur la liste : **« C'est parti »** sous les lignes (puis choix du magasin, ou « Un autre magasin » à nommer ; sans magasin, seulement son nom) ; **« Reprendre les courses »** si une session est restée ouverte.

### 2.4 Récapitulatif de fin de courses

Articles achetés, pas pris (restés dans la liste), durée, éventuellement « Ordre des rayons mis à jour ». Boutons « Retour à la liste » et « Rouvrir » (C8).

### 2.5 Catalogue

- Haut : recherche avec suggestions sous le champ (A5), puis **Habituels** (défilement horizontal) et **Favoris**.
- Grille de catégories (icône, libellé, couleur) → grille d'articles (grande icône, libellé, pastille de quantité si déjà dans la liste courante, pastille « de saison » _plus tard_).
- Appui long sur un article → fiche article (G1).

### 2.6 Recettes _(v1.1)_

- Liste des recettes (icône, libellé, rendement), recherche, bouton « Nouvelle recette ».
- Fiche recette : en-tête (icône, libellé, rendement réglable `− 4 personnes +` ou `− 1 cake +`), ingrédients, étapes, bouton **« Ajouter à une liste »** → panneau : liste cible, quantité dans l'unité de rendement, aperçu avec cases à cocher → « Ajouter ».
- Édition : rendement = nombre + unité (« personnes » par défaut, liste de propositions ou saisie libre).

### 2.7 Réglages

```
Fonctionnalités   (icône, libellé, description ; grisée « Non disponible sur ce téléphone » si besoin)
  Sons .................. Activés ▸  (écran Sons : interrupteur général + un par son, avec écoute)
  Écran allumé pendant les courses ●
Ressenti
  Animations ............ Automatique ▸
Affichage
  Thème ................. Automatique · Sombre · Clair
  Affichage compact ..... ◯
Mode courses
  Lignes cochées ........ Glissent en bas ▸
Mes données
  Articles ▸   Catégories ▸   Magasins & rayons ▸   Unités ▸
Partage (v1.3)
  Coller une liste partagée ▸
Sauvegarde
  Exporter mes données ▸   Copier dans le presse-papiers ▸   Dernière sauvegarde : il y a 12 j
  Importer une sauvegarde ▸   Coller une sauvegarde ▸
    (libellé : changer de téléphone, réinstaller l'app, copie hors du téléphone)
  Restaurer une copie ▸
    (libellé : copies automatiques des 7 derniers jours, contre une fausse
     manipulation ; elles disparaissent avec l'app)
Aide ▸                      (H10 : mode d'emploi, ce que l'app règle toute seule)
  Revoir les conseils        (H12 : les bulles d'aide reviennent)
À propos
  Version 1.0.0 · Quoi de neuf ▸ · Licences ▸
```

### 2.8 Magasin

- Libellé (modifiable), interrupteur **« Apprendre l'ordre de mes courses »** (activé par défaut ; désactivé = ordre verrouillé, C7).
- Liste des rayons avec poignées de glisser-déposer : son nom, ou le titre tiré de ses catégories (02 § 4), puis son repère ou son nombre de catégories ; « À placer » en dernier. Toucher un rayon ouvre sa fiche : nom et repère facultatifs (le champ nom montre le titre automatique en grisé), catégories (puces : pleines = principale, contour = secondaire ; « + catégorie »), icône et couleur, fusion, suppression.
- Partout où l'on choisit un rayon (changer un article de rayon, « Où as-tu pris… ? », fusion, ranger une catégorie), il apparaît sous son titre, avec ses catégories en dessous s'il n'a pas de nom.
- Section « Catégories non rattachées » (en orange si non vide).
- Section « Exceptions » : articles placés hors du rayon principal de leur catégorie dans ce magasin.

### 2.9 Fiches de gestion

Articles, catégories, unités : liste + recherche → fiche d'édition. Actions destructrices (supprimer, fusionner) en bas, en rouge, avec confirmation qui décrit les conséquences (« 3 listes et 1 recette utilisent cet article »).

### 2.10 Aperçu d'import _(v1.3)_

Résumé (« 12 reconnus · 1 à confirmer · 2 non reconnus »), choix nouvelle liste / fusion dans une liste existante. Pour chaque proposition : confirmer ou refuser. Pour chaque article non reconnu :

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

Tap sur un candidat = « C'est celui-là ». Bouton « Importer ».

### 2.11 Premier lancement

1. Si ouvert dans le navigateur (non installé) : écran **« Installe l'app »** :
   - iPhone (Chrome) : gestes illustrés — bouton Partager de Chrome → « Ajouter à l'écran d'accueil » → Ajouter ;
   - Android (Chrome) : bouton **« Installer »** (invite native du navigateur).
     Lien discret « Continuer dans le navigateur quand même ».
2. Dans l'app installée : création des données de départ, puis la liste vide « Courses ». **Aucun magasin** : le premier se crée au premier « C'est parti » (03 B5), ses rayons pendant les courses (03 C4).

### 2.12 Mise à jour et « Quoi de neuf »

- Bandeau en bas, juste au-dessus de la barre d'onglets (hors de la zone floutée par iOS en haut) : « Version 1.2.0 disponible — **Mettre à jour** ». Au toucher, le bouton passe à « Mise à jour… » et l'app se recharge ; si le navigateur ne recharge pas de lui-même (vu sur iPhone), l'app le fait au bout de 3 s. Jamais affiché en mode courses.
- Après la mise à jour : panneau « Quoi de neuf dans la 1.2.0 » (liste courte issue du journal des versions).

## 3. Parcours clés

**Ajouter en 2 secondes** : Liste → taper `lai` → `Entrée` → _Lait_ ajouté sous Crèmerie.

**Créer un article** : taper `nuoc mam` → (aucun article ni alias) « Créer _Nuoc mam_ » → fiche rapide (Sauces & condiments / pot, devinés) → « Créer et ajouter ».

**Faire les courses** : Liste → « C'est parti » → confirmer le magasin → cocher au fil des rayons → « Terminer les courses » → récapitulatif.

**Oubli à la caisse** : Liste → « Rouvrir les courses » → ajouter et cocher → « Terminer les courses ».

**Corriger un rayon en magasin** : appui long sur _Steak haché_ → Déplacer vers « Frais libre-service » → « Seulement cet article dans ce magasin ».

**Ajouter une recette** _(v1.1)_ : Recettes → _Cake aux olives_ → « Ajouter à une liste » → « 2 cakes » → décocher la farine (déjà à la maison) → Ajouter.

**Envoyer la liste au conjoint** _(v1.3)_ : Liste → `⋯` → Partager → Messages / WhatsApp.

- Destinataire sur **Android** : tap sur le lien → l'app s'ouvre sur l'aperçu → Importer.
- Destinataire sur **iPhone** : copier le message → ouvrir l'app → `⋯` → « Coller une liste partagée » → aperçu → Importer.
