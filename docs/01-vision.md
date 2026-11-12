# 01 — Vision

## Le problème

Au supermarché, on arrive au rayon frais et on se rend compte qu'on a oublié le beurre… alors qu'on était devant cinq minutes plus tôt. Les apps de liste de courses sont soit de simples listes dans l'ordre d'ajout, soit des usines à gaz (comptes, publicités, promos, prix).

## La promesse

**Une liste de courses qui se range toute seule dans l'ordre de ton parcours en magasin, et qui t'aide à ne rien oublier avant de partir.**

## Les trois moments d'usage

| Moment       | Contexte                                                | Ce que l'app fait                                                                                                                    |
| ------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Remplir**  | À la maison, au fil de la semaine, une main, 3 secondes | Ajout éclair par saisie, par le catalogue ou depuis une recette                                                                      |
| **Vérifier** | Avant de partir                                         | Suggère les articles habituels manquants, revue rapide rayon par rayon                                                               |
| **Acheter**  | En magasin, caddie, mauvais réseau                      | Liste triée dans l'ordre des rayons du magasin, cocher d'un tap, rayons qui se replient, écran qui reste allumé, clôture des courses |

## Principes

1. **Local, sans compte, sans serveur.** Toutes les données restent sur le téléphone. L'app fonctionne entièrement hors ligne.
2. **100 % gratuit.** Aucun service payant, aucune clé d'API payante, aucune bibliothèque sous licence payante. Hébergement gratuit.
3. **Rapide avant tout.** Ajouter un article connu en 2 secondes au plus. Jamais de popup bloquante sans raison.
4. **L'app apprend, l'utilisateur ne configure pas.** L'ordre des rayons et les articles habituels se déduisent de l'usage, mais **tout reste modifiable** : articles, catégories, rayons, magasins, unités, listes, recettes.
5. **Pensée pour le magasin.** Utilisable d'une main en marchant.
6. **Belle et vivante.** Thème sombre unique, violet pâle et or, icônes colorées, animations douces, petits sons.
7. **Données portables.** Export et import complets à tout moment.

## Plateformes cibles

Application web installée sur l'écran d'accueil (PWA). **Optimisée pour Chrome**, sur les deux téléphones du foyer :

| Appareil                           | Navigateur | Rôle                                               |
| ---------------------------------- | ---------- | -------------------------------------------------- |
| **iPhone**, dernière version d'iOS | Chrome     | Principal (toi)                                    |
| **Android** récent                 | Chrome     | Secondaire (ton conjoint)                          |
| Autres (Firefox, ordinateur)       | —          | Devraient fonctionner, non testés systématiquement |

> **Important — le cas de l'iPhone.** Apple impose à tous les navigateurs sur iPhone d'utiliser son moteur **WebKit** (celui de Safari). Chrome ou Firefox sur iPhone ne sont « que » l'interface de Chrome ou Firefox autour de ce moteur. Et une app installée sur l'écran d'accueil d'un iPhone tourne toujours dans WebKit, quel que soit le navigateur qui l'a installée. **On ne peut donc pas « ne pas supporter Safari » sur iPhone** : c'est le même moteur. Les capacités réelles de l'app sur ton iPhone sont celles de WebKit.

### Règle d'utilisation des fonctionnalités du navigateur

- Une fonctionnalité **essentielle** (ajout, liste, mode courses, sauvegarde…) doit marcher sur **les deux téléphones**.
- Une fonctionnalité **de confort** peut être utilisée si elle marche sur **au moins un** des deux (ex. le bouton « Installer » d'Android), à condition que **rien ne casse** là où elle n'existe pas : elle est simplement absente.
- On n'utilise pas ce qui ne marche nulle part.

Détail des fonctionnalités du navigateur et de leur support : [07 § 3](07-architecture-technique.md#3-fonctionnalités-du-navigateur).

## Hors périmètre

- Prix, budget, estimation du total, promotions.
- Comptes utilisateurs, synchronisation temps réel, serveur.
- Photos d'articles.
- Gestion de stock du frigo / placards.
- Thème clair.
- Multilingue : l'app est en français. Les textes et le catalogue sont toutefois organisés pour qu'une version anglaise reste possible sans migration (idée I3).
