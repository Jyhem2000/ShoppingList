# 04 — Écrans et navigation

Cible : iPhone, app installée sur l'écran d'accueil (plein écran, sans barre Safari). Respect des zones de sécurité (encoche / Dynamic Island en haut, barre d'accueil en bas).

## 1. Structure

Barre d'onglets en bas (masquée en mode courses) :

| Onglet | Icône (Lucide) | Contenu |
|---|---|---|
| **Liste** | `list-checks` | La liste courante (écran d'accueil) |
| **Catalogue** | `layout-grid` | Parcourir les articles par catégorie |
| **Recettes** | `chef-hat` | Les recettes |
| **Réglages** | `settings` | Réglages, gestion des données, sauvegarde |

Les fiches d'édition s'ouvrent en **panneaux glissants depuis le bas** (bottom sheets), refermables d'un glissement vers le bas.

Cible principale iPhone ; sur Android, le geste ou bouton **Retour** du système ferme d'abord le panneau ouvert, puis revient à l'écran précédent (chaque panneau et écran correspond à une entrée de l'historique de navigation).

## 2. Écrans

### 2.1 Liste (accueil)
```
┌──────────────────────────────────┐
│ Courses semaine ▾   🏪 Super U ▾ ⋯│  ← liste courante, magasin, menu
├──────────────────────────────────┤
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
│  NM Sauce nuoc-mâm           × 1 │  ← monogramme
│                                  │
│        [ 🛒 C'est parti ]        │
├──────────────────────────────────┤
│ 🔍 Ajouter un article…        🎤 │  ← A1 (le 🎤 est celui du clavier iOS)
├──────────────────────────────────┤
│  Liste   Catalogue  Recettes  ⚙  │
└──────────────────────────────────┘
```
- Menu `⋯` : renommer, dupliquer, partager *(v1.1)*, coller une liste *(v1.1)*, retirer les cochés, vider, gérer les listes.
- Tap sur une ligne → **fiche ligne** (B3). Glisser à gauche → supprimer (B4).
- État vide : illustration + « Ajoute ton premier article » + raccourci vers le Catalogue.

### 2.2 Barre d'ajout et ses panneaux
- Suggestions affichées **au-dessus** de la barre (et donc au-dessus du clavier).
- Panneau « Déjà dans la liste : 2 kg — [Ajouter 1 kg] [Ne rien faire] » (A3).
- Fiche rapide de création d'article (A4) : libellé, catégorie, unité, icône — bouton « Créer et ajouter ».

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
│ 🔍 Ajouter…           [Terminer] │
└──────────────────────────────────┘
```
Tap = cocher · glisser = introuvable · appui long = déplacer de rayon.

### 2.4 Récapitulatif de fin de courses
Nombre d'articles achetés, introuvables (restés dans la liste), durée. Bouton « Retour à la liste ».

### 2.5 Catalogue
- Haut : recherche, puis **Habituels** (défilement horizontal) et **Favoris**.
- Grille de catégories (icône, libellé, couleur) → grille d'articles (grande icône, libellé, pastille de quantité si déjà dans la liste courante).
- Appui long sur un article → fiche article (G1).

### 2.6 Recettes
- Liste des recettes (icône, libellé, nombre de personnes), recherche, bouton « Nouvelle recette ».
- Fiche recette : en-tête (icône, libellé, `− 4 pers. +`), ingrédients, étapes, bouton **« Ajouter à une liste »** → panneau : liste cible, personnes, aperçu avec cases à cocher → « Ajouter ».

### 2.7 Réglages
```
Affichage
  Animations ............ Automatique ▸
  Affichage compact ..... ◯
Mode courses
  Lignes cochées ........ Glissent en bas ▸
Mes données
  Articles ▸   Catégories ▸   Magasins & rayons ▸   Unités ▸
Partage
  Coller une liste partagée ▸
Sauvegarde
  Exporter mes données ▸   Importer ▸   Dernière sauvegarde : il y a 12 j
À propos
  Version, licences (icônes, bibliothèques)
```

### 2.8 Magasin
- Libellé (modifiable), verrou de l'ordre 🔒.
- Liste des rayons avec poignées de glisser-déposer ; chaque rayon se déplie pour montrer ses catégories (puces retirables, « + catégorie »).
- Section « Catégories non rattachées » (en orange si non vide).
- Section « Exceptions » : articles placés hors de leur catégorie dans ce magasin.

### 2.9 Fiches de gestion
Articles, catégories, unités : liste + recherche → fiche d'édition. Actions destructrices (supprimer, fusionner) en bas, en rouge, avec confirmation qui décrit les conséquences (« 3 listes et 1 recette utilisent cet article »).

### 2.10 Aperçu d'import *(v1.1)*
Résumé (« 12 reconnus · 2 nouveaux · 1 à confirmer »), choix nouvelle liste / fusion dans une liste existante, détail des correspondances à confirmer, bouton « Importer ».

### 2.11 Premier lancement
1. Si ouvert dans Safari (non installé) : écran **« Installe l'app »** avec les 3 gestes illustrés (Partager → « Sur l'écran d'accueil » → Ajouter). Lien discret « Continuer dans Safari quand même ».
   Si ouvert dans Chrome Android (non installé) : même écran avec un bouton **« Installer »** qui déclenche l'invite native du navigateur.
2. Dans l'app installée : création des données de départ, puis la liste vide « Courses » avec le magasin « Mon supermarché ».

## 3. Parcours clés

**Ajouter en 2 secondes** : Liste → taper `lai` → `Entrée` → *Lait* ajouté sous Crèmerie.

**Créer un article** : taper `nuoc mam` → « Créer *Nuoc mam* » → fiche rapide (Sauces & condiments / pot, devinés) → « Créer et ajouter ».

**Faire les courses** : Liste → « C'est parti » → confirmer le magasin → cocher au fil des rayons → « Terminer ».

**Corriger un rayon en magasin** : appui long sur *Jambon* → Déplacer vers « Frais » → « Toute la catégorie Charcuterie dans ce magasin ».

**Envoyer la liste au conjoint** *(v1.1)* : Liste → `⋯` → Partager → Messages / WhatsApp.
- Destinataire sur **Android** : tap sur le lien → l'app s'ouvre sur l'aperçu → Importer.
- Destinataire sur **iPhone** : copier le message → ouvrir l'app → `⋯` → « Coller une liste partagée » → aperçu → Importer.
