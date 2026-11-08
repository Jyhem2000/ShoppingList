# 04 — Écrans et navigation

Cible : app installée sur l'écran d'accueil (plein écran, sans barre de navigateur), iPhone d'abord, Android ensuite. Respect des zones de sécurité (encoche / Dynamic Island en haut, barre d'accueil en bas).

## 1. Structure

Barre d'onglets en bas (masquée en mode courses) :

| Onglet | Icône (Lucide) | Contenu | Version |
|---|---|---|---|
| **Liste** | `list-checks` | La liste courante (écran d'accueil) | v1.0 |
| **Catalogue** | `layout-grid` | Parcourir les articles par catégorie | v1.0 |
| **Recettes** | `chef-hat` | Les recettes | v1.1 (onglet absent avant) |
| **Réglages** | `settings` | Réglages, gestion des données, sauvegarde | v1.0 |

Les fiches d'édition s'ouvrent en **panneaux glissants depuis le bas** (bottom sheets), refermables d'un glissement vers le bas.

Sur Android, le geste ou bouton **Retour** du système ferme d'abord le panneau ouvert, puis revient à l'écran précédent (chaque panneau et écran correspond à une entrée de l'historique de navigation).

## 2. Écrans

### 2.1 Liste (accueil)
```
┌──────────────────────────────────┐
│ Courses semaine ▾   🏪 Super U ▾ ⋯│  ← liste courante, magasin, menu
├──────────────────────────────────┤
│ ↺ Rouvrir les courses (18 h 02)  │  ← C8, si courses récemment clôturées
│ 💡 Tu prends souvent : 🥛 🧈  +  │  ← D1 (v1.2)
│                                  │
│ ● Fruits & légumes            3  │  ← en-tête de rayon (couleur)
│  🍎 Pommes   Gala ou Golden 1 kg │
│  🥕 Carottes               1 kg  │
│  🌿 Persil                 1 botte│
│ ● Crèmerie                    2  │
│  🥚 Œufs                 × 1 boîte│
│  🧈 Beurre  doux             × 1 │
│ ● Non classé                  1  │
│  SN Sauce nuoc-mâm           × 1 │  ← monogramme
│                                  │
│        [ 🛒 C'est parti ]        │
├──────────────────────────────────┤
│ 🔍 Ajouter un article…           │  ← A1 (micro = celui du clavier)
├──────────────────────────────────┤
│  Liste   Catalogue  Recettes  ⚙  │
└──────────────────────────────────┘
```
- Menu `⋯` : renommer, dupliquer, partager *(v1.3)*, coller une liste *(v1.3)*, retirer les cochés, vider, gérer les listes.
- Tap sur une ligne → **fiche ligne** (B3). Glisser à gauche → supprimer (B4).
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
│ ✓ Fruits & légumes (replié)      │
│ ● Crèmerie            ← courant  │
│  🥚 Œufs                 1 boîte │  ← grandes lignes
│  🧈 Beurre                   × 1 │
│  ─────────────────────────────── │
│  🥛 Lait (barré)             × 6 │  ← coché, glisse en bas
│ ● Épicerie salée                 │
│  …                               │
├──────────────────────────────────┤
│ 🔍 Ajouter…  [✓ Terminer les courses] │
└──────────────────────────────────┘
```
- Tap = cocher · glisser = introuvable · appui long = déplacer de rayon.
- `✕` = quitter le mode courses **sans clôturer** (la session reste ouverte, on peut y revenir).
- **« Terminer les courses »** (bouton or) = clôture (C6), après confirmation.

### 2.4 Récapitulatif de fin de courses
Articles achetés, introuvables (restés dans la liste), durée, éventuellement « Ordre des rayons mis à jour ». Boutons « Retour à la liste » et « Rouvrir » (C8).

### 2.5 Catalogue
- Haut : recherche, puis **Habituels** (défilement horizontal) et **Favoris**.
- Grille de catégories (icône, libellé, couleur) → grille d'articles (grande icône, libellé, pastille de quantité si déjà dans la liste courante, pastille « de saison » *plus tard*).
- Appui long sur un article → fiche article (G1).

### 2.6 Recettes *(v1.1)*
- Liste des recettes (icône, libellé, rendement), recherche, bouton « Nouvelle recette ».
- Fiche recette : en-tête (icône, libellé, rendement réglable `− 4 personnes +` ou `− 1 cake +`), ingrédients, étapes, bouton **« Ajouter à une liste »** → panneau : liste cible, quantité dans l'unité de rendement, aperçu avec cases à cocher → « Ajouter ».
- Édition : rendement = nombre + unité (« personnes » par défaut, liste de propositions ou saisie libre).

### 2.7 Réglages
```
Ressenti
  Animations ............ Automatique ▸
  Sons .................. ●
  Vibrations ............ ●          (masqué si le téléphone ne les gère pas)
Affichage
  Affichage compact ..... ◯
  Simplifier les quantités ●   (1200 g → 1,2 kg)
Mode courses
  Lignes cochées ........ Glissent en bas ▸
Mes données
  Articles ▸   Catégories ▸   Magasins & rayons ▸   Unités ▸
Partage (v1.3)
  Coller une liste partagée ▸
Sauvegarde
  Exporter mes données ▸   Importer ▸   Dernière sauvegarde : il y a 12 j
À propos
  Version 1.0.0 · Quoi de neuf ▸ · Licences ▸
```

### 2.8 Magasin
- Libellé (modifiable), verrou de l'ordre 🔒.
- Liste des rayons avec poignées de glisser-déposer ; chaque rayon se déplie pour montrer ses catégories (puces : pleines = principale, contour = secondaire ; « + catégorie »).
- Section « Catégories non rattachées » (en orange si non vide).
- Section « Exceptions » : articles placés hors du rayon principal de leur catégorie dans ce magasin.

### 2.9 Fiches de gestion
Articles, catégories, unités : liste + recherche → fiche d'édition. Actions destructrices (supprimer, fusionner) en bas, en rouge, avec confirmation qui décrit les conséquences (« 3 listes et 1 recette utilisent cet article »).

### 2.10 Aperçu d'import *(v1.3)*
Résumé (« 12 reconnus · 1 à confirmer · 2 nouveaux »), choix nouvelle liste / fusion dans une liste existante. Pour chaque article non reconnu : « Nouvel article » (par défaut) ou **« C'est le même que… »** (recherche) ; pour chaque proposition : confirmer ou refuser. Bouton « Importer ».

### 2.11 Premier lancement
1. Si ouvert dans le navigateur (non installé) : écran **« Installe l'app »** :
   - iPhone (Chrome) : gestes illustrés — bouton Partager de Chrome → « Ajouter à l'écran d'accueil » → Ajouter ;
   - Android (Chrome) : bouton **« Installer »** (invite native du navigateur).
   Lien discret « Continuer dans le navigateur quand même ».
2. Dans l'app installée : création des données de départ, puis la liste vide « Courses » avec le magasin « Mon supermarché ».

### 2.12 Mise à jour et « Quoi de neuf »
- Bandeau discret en haut : « Version 1.2.0 disponible — **Mettre à jour** ». Jamais affiché en mode courses.
- Après la mise à jour : panneau « Quoi de neuf dans la 1.2.0 » (liste courte issue du journal des versions).

## 3. Parcours clés

**Ajouter en 2 secondes** : Liste → taper `lai` → `Entrée` → *Lait* ajouté sous Crèmerie.

**Créer un article** : taper `nuoc mam` → (aucun article ni alias) « Créer *Nuoc mam* » → fiche rapide (Sauces & condiments / pot, devinés) → « Créer et ajouter ».

**Faire les courses** : Liste → « C'est parti » → confirmer le magasin → cocher au fil des rayons → « Terminer les courses » → récapitulatif.

**Oubli à la caisse** : Liste → « Rouvrir les courses » → ajouter et cocher → « Terminer les courses ».

**Corriger un rayon en magasin** : appui long sur *Steak haché* → Déplacer vers « Frais libre-service » → « Seulement cet article dans ce magasin ».

**Ajouter une recette** *(v1.1)* : Recettes → *Cake aux olives* → « Ajouter à une liste » → « 2 cakes » → décocher la farine (déjà à la maison) → Ajouter.

**Envoyer la liste au conjoint** *(v1.3)* : Liste → `⋯` → Partager → Messages / WhatsApp.
- Destinataire sur **Android** : tap sur le lien → l'app s'ouvre sur l'aperçu → Importer.
- Destinataire sur **iPhone** : copier le message → ouvrir l'app → `⋯` → « Coller une liste partagée » → aperçu → Importer.
