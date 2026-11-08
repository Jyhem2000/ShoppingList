# 01 — Vision

## Le problème
Au supermarché, on arrive au rayon frais et on se rend compte qu'on a oublié le beurre… alors qu'on était devant cinq minutes plus tôt. Les apps de liste de courses sont soit de simples listes dans l'ordre d'ajout, soit des usines à gaz (comptes, publicités, promos, prix).

## La promesse
**Une liste de courses qui se range toute seule dans l'ordre de ton parcours en magasin, et qui t'aide à ne rien oublier avant de partir.**

## Les trois moments d'usage

| Moment | Contexte | Ce que l'app fait |
|---|---|---|
| **Remplir** | À la maison, au fil de la semaine, une main, 3 secondes | Ajout éclair par saisie, par le catalogue ou depuis une recette |
| **Vérifier** | Avant de partir | Suggère les articles habituels manquants, revue rapide rayon par rayon |
| **Acheter** | En magasin, caddie, mauvais réseau | Liste triée dans l'ordre des rayons du magasin, cocher d'un tap, rayons qui se replient, écran qui reste allumé |

## Principes
1. **Local, sans compte, sans serveur.** Toutes les données restent sur le téléphone. L'app fonctionne entièrement hors ligne.
2. **100 % gratuit.** Aucun service payant, aucune clé d'API, aucune bibliothèque sous licence payante. Hébergement gratuit.
3. **Rapide avant tout.** Ajouter un article connu en 2 secondes au plus. Jamais de popup bloquante sans raison.
4. **L'app apprend, l'utilisateur ne configure pas.** L'ordre des rayons et les articles habituels se déduisent de l'usage, mais **tout reste modifiable** : articles, catégories, rayons, magasins, unités, listes, recettes.
5. **Pensée pour le magasin.** Utilisable d'une main en marchant.
6. **Belle.** Thème sombre unique, violet pâle et or, icônes colorées, animations douces.
7. **Données portables.** Export et import complets à tout moment.

## Plateformes cibles
Application web installée sur l'écran d'accueil (PWA) :
- **Principale : iPhone**, dernière version d'iOS, via Safari. Tout est conçu et vérifié d'abord pour lui.
- **Secondaire : Android récent**, via Chrome (le conjoint, qui reçoit les listes partagées et fait aussi des courses). Toutes les fonctionnalités doivent y marcher ; aucune fonctionnalité propre à Android n'est ajoutée.
- Ordinateur : fonctionne probablement, ni testé ni optimisé.

## Hors périmètre
- Prix, budget, estimation du total, promotions.
- Comptes utilisateurs, synchronisation temps réel, serveur.
- Photos d'articles.
- Gestion de stock du frigo / placards.
- Thème clair, multilingue (l'app est en français ; les textes sont toutefois centralisés).
- Vibrations (non supportées par Safari iOS ; pas ajoutées pour Android seul).
