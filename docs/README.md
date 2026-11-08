# Documentation développeur

Spécification complète de l'application. **Le code ne démarre que lorsque tous les documents ci-dessous sont validés.**

## Documents

| # | Document | Contenu | Statut |
|---|---|---|---|
| 01 | [Vision](01-vision.md) | Problème, promesse, principes, périmètre | 📝 À valider |
| 02 | [Modèle métier](02-modele-metier.md) | Les notions de l'app et leurs règles (article, catégorie, rayon, magasin, unité, liste, recette, partage) | 📝 À valider |
| 03 | [Fonctionnalités](03-fonctionnalites.md) | Toutes les fonctionnalités avec critères d'acceptation, priorisées | 📝 À valider |
| 04 | [Écrans et navigation](04-ecrans-et-navigation.md) | Structure de l'app, écrans, parcours | 📝 À valider |
| 05 | [Identité visuelle](05-identite-visuelle.md) | Couleurs, typographie, icônes, animations | 📝 À valider |
| 06 | [Données initiales](06-donnees-initiales.md) | Catégories, rayons, unités, catalogue de départ, dictionnaire d'icônes | 📝 À valider |
| 07 | [Architecture technique](07-architecture-technique.md) | Stack, API navigateur sur iOS, schéma de données, algorithmes | 📝 À valider |
| 08 | [Tests et qualité](08-tests-et-qualite.md) | Stratégie de test, Vitest vs Playwright, conventions | 📝 À valider |
| 09 | [Plan de développement](09-plan-de-developpement.md) | Phases, critères de fin de phase, conventions git | 📝 À valider |

Statuts : 📝 À valider · 🔁 En révision · ✅ Validé

## Glossaire express
- **Article** : un produit que l'on achète (« Pommes », « Lessive »). Fait partie du *catalogue personnel*.
- **Catégorie** : le type d'un article, indépendant de tout magasin (« Charcuterie », « Conserves »).
- **Rayon** : une zone d'un magasin donné, qui regroupe une ou plusieurs catégories (« Frais » = Charcuterie + Fromages + Yaourts).
- **Magasin** : un lieu de courses, avec ses rayons dans l'ordre du parcours.
- **Unité** : la façon de compter un article (pièce, g, kg, pack…).
- **Liste** : une liste de courses, indépendante du magasin.
- **Ligne** : un article dans une liste, avec sa quantité, son unité et ses types acceptés.
- **Types** : les variétés possibles d'un article (Gala, Golden…). Une ligne peut en exiger certaines ou aucune.
- **Recette** : des ingrédients pour N personnes, que l'on peut ajouter à une liste.

## Versions prévues
Détail dans [03 § Versions](03-fonctionnalites.md#versions) et [09](09-plan-de-developpement.md).

| Version | Contenu |
|---|---|
| **v1.0** | Ajout éclair, liste triée par rayon, mode courses avec apprentissage, tout modifiable, réglages et sauvegarde, puis **recettes** (étape dédiée) |
| **v1.1** | Partage et import de listes (iPhone ↔ Android), coller une liste |
| **v1.2** | Anti-oubli : suggestions et revue rapide par rayon |
| Plus tard | Saisonnalité, partage de recettes, scan de code-barres |

## Décisions prises
- **Nom** : ShoppingList.
- **Plateformes** : iPhone (dernière version d'iOS) en cible principale ; **Android récent (Chrome)** en cible secondaire, pour le conjoint qui reçoit et utilise les listes partagées.
- **Hébergement** : dépôt public → GitHub Pages (`https://jyhem2000.github.io/ShoppingList/`).
- **Recettes** : dans la v1.0, comme étape à part après le cœur de l'app.

## Questions ouvertes
- **Scan de code-barres** (03 F3) : classé « plus tard ». À remonter ?
