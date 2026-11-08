# Documentation développeur

Spécification complète de l'application. **Validée le 8 novembre 2026** : elle fait foi pour le développement. Toute modification ultérieure passe par une mise à jour de ces documents (statut « 🔁 En révision » le temps de la valider).

## Documents

| #   | Document                                               | Contenu                                                                                                                   | Statut    |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | --------- |
| 01  | [Vision](01-vision.md)                                 | Problème, promesse, principes, plateformes, périmètre                                                                     | ✅ Validé |
| 02  | [Modèle métier](02-modele-metier.md)                   | Les notions de l'app et leurs règles (article, alias, catégorie, rayon, magasin, unité, liste, recette, courses, partage) | ✅ Validé |
| 03  | [Fonctionnalités](03-fonctionnalites.md)               | Toutes les fonctionnalités avec critères d'acceptation et version cible                                                   | ✅ Validé |
| 04  | [Écrans et navigation](04-ecrans-et-navigation.md)     | Structure de l'app, écrans, parcours                                                                                      | ✅ Validé |
| 05  | [Identité visuelle](05-identite-visuelle.md)           | Couleurs, typographie, icônes, animations, sons, vibrations                                                               | ✅ Validé |
| 06  | [Données initiales](06-donnees-initiales.md)           | Unités, catégories, modèles de magasins, catalogue de départ, dictionnaire d'icônes                                       | ✅ Validé |
| 07  | [Architecture technique](07-architecture-technique.md) | Stack, fonctionnalités du navigateur, schéma de données, mises à jour, algorithmes, versions et déploiement               | ✅ Validé |
| 08  | [Tests et qualité](08-tests-et-qualite.md)             | Stratégie de test, Vitest vs Playwright, conventions                                                                      | ✅ Validé |
| 09  | [Plan de développement](09-plan-de-developpement.md)   | Phases, critères de fin de phase, conventions git                                                                         | ✅ Validé |

Statuts : 📝 À valider · 🔁 En révision · ✅ Validé

### Guides pratiques

- [Configurer Cloudflare Pages et GitHub](deploiement-cloudflare.md) — à faire une fois (phase 1).

## Versions prévues

| Version                                                 | Contenu                                                                                                                                                         |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v1.0 — Cœur** (via 0.1 → 0.7, puis 0.9 en usage réel) | Ajout éclair, catalogue, liste triée par rayon, mode courses avec clôture/réouverture et apprentissage, tout modifiable, réglages, sons, vibrations, sauvegarde |
| **v1.1 — Recettes**                                     | Recettes avec rendement (personnes ou « 1 cake »), ajout à une liste avec recalcul des quantités                                                                |
| **v1.2 — Anti-oubli**                                   | Suggestions d'articles habituels, revue rapide par catégorie                                                                                                    |
| **v1.3 — Partage**                                      | Envoyer / importer une liste (iPhone ↔ Android), coller une liste en texte                                                                                      |
| Plus tard                                               | Saisonnalité des fruits et légumes, partage de recettes                                                                                                         |
| Idées non planifiées                                    | Scan de code-barres, convertisseur d'unités, multilingue (peut-être jamais)                                                                                     |

Détail : [03 § Versions](03-fonctionnalites.md) et [09](09-plan-de-developpement.md).

## Glossaire express

- **Article** : un produit que l'on achète (« Pommes », « Lessive »). Fait partie du _catalogue personnel_.
- **Alias** : autre nom d'un article (« coca » pour _Coca-Cola_, « chocolatine » pour _Pain au chocolat_).
- **Catégorie** : le type d'un article, indépendant de tout magasin (« Charcuterie », « Conserves »).
- **Rayon** : une zone d'un magasin donné, qui regroupe des catégories ; une catégorie peut être dans plusieurs rayons, dont un **principal**.
- **Magasin** : un lieu de courses, avec ses rayons dans l'ordre du parcours.
- **Unité** : la façon de compter un article (pièce, g, kg, pack…).
- **Liste** : une liste de courses, indépendante du magasin.
- **Ligne** : un article dans une liste, avec sa quantité, son unité et ses types acceptés.
- **Types** : les variétés possibles d'un article (Gala, Golden…). Une ligne peut en exiger certaines ou aucune.
- **Session de courses** : un passage en magasin, du lancement du mode courses à sa **clôture** (réouverture possible).
- **Recette** : des ingrédients pour un **rendement** donné (4 personnes, 1 cake…), que l'on peut ajouter à une liste.

## Décisions prises

- **Nom** : ShoppingList.
- **Plateformes** : app web installée, **optimisée pour Chrome**, sur iPhone (dernière version d'iOS, cible principale) et Android récent (cible secondaire). Sur iPhone, tous les navigateurs utilisent le moteur WebKit : ses limites s'appliquent quel que soit le navigateur ([01](01-vision.md#plateformes-cibles)).
- **Fonctionnalités du navigateur** : essentielles = marchent sur les deux téléphones ; confort (vibrations…) = au moins un, sans rien casser ailleurs.
- **Hébergement** : **Cloudflare Pages** connecté au dépôt GitHub ; préproduction sur `dev`, production sur `main`, qui n'avance que par `npm run release` ([07 § 9](07-architecture-technique.md#9-hébergement-versions-et-déploiement)).
- **Versions** : v1.0 cœur, v1.1 recettes, v1.2 anti-oubli, v1.3 partage.

## Questions ouvertes

Aucune pour l'instant.
