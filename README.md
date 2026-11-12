# ShoppingList

**Une liste de courses qui se range toute seule dans l'ordre de ton parcours en magasin.**

Fini les allers-retours au rayon frais parce que tu avais oublié le beurre : l'app trie ta liste rayon par rayon, dans l'ordre de **ton** magasin, et apprend ce parcours au fil de tes courses.

## Ce qu'elle fait

- ⚡ **Ajout éclair** : tape `3 tom`, Entrée, c'est ajouté. Comprend « 500 g de farine », « une douzaine d'œufs », « pommes gala ».
- 🗺️ **Tri par rayon** selon le magasin choisi, avec des rayons qui collent à la réalité de chaque magasin.
- 🧠 **Apprend l'ordre des rayons** à partir de l'ordre dans lequel tu coches tes articles.
- 🛒 **Mode courses** : grosses lignes, rayons qui se replient une fois terminés, écran qui reste allumé, alerte si tu ajoutes un article d'un rayon déjà passé, clôture des courses (et réouverture en cas d'oubli à la caisse).
- ✏️ **Tout est modifiable** : articles, catégories, rayons, magasins, unités.
- 🍲 **Recettes** _(v1.1)_ : ajoute une recette pour 6 personnes ou 2 cakes, les ingrédients sont recalculés et ajoutés à ta liste.
- 💡 **Anti-oubli** _(v1.2)_ : l'app te rappelle ce que tu achètes d'habitude.
- 📤 **Partage** _(v1.3)_ : envoie ta liste à quelqu'un qui l'importe dans son app.
- 🔒 **Sans compte, sans serveur, sans pub, gratuit.** Tes données restent sur ton téléphone et l'app marche hors ligne.

## Mode d'emploi

1. **Remplis ta liste** avec la barre du bas (`2 baguettes, du beurre`) ou le catalogue. Elle se range toute seule par rayon.
2. **En magasin**, touche **C'est parti** et choisis le magasin. Touche une ligne quand l'article est dans le caddie ; glisse-la vers la gauche s'il est introuvable ; appui long pour dire qu'il est dans un autre rayon.
3. **Tu penses à un article en passant** : ajoute-le avec la barre. Si tu l'as déjà pris, choisis « Je l'ai déjà dans le caddie » ; s'il n'est pas dans le rayon prévu, « Il est dans un autre rayon… ». Si son rayon est déjà passé, il t'attend en haut dans « À récupérer ».
4. **À la caisse**, touche **Terminer**. Un oubli ? « Rouvrir les courses » sur la liste, tant que tu n'as pas recommencé de nouvelles courses.

### Ce que l'app règle toute seule

Rien à paramétrer : l'app part d'un magasin type, puis s'adapte au tien chaque fois que tu termines tes courses.

- **L'ordre des rayons** : les rayons où tu as coché quelque chose sont rangés dans l'ordre où tu les as parcourus. Seul l'**ordre des coches** compte, pas l'heure : une pause ou une attente au rayon coupe ne change rien. Un aller-retour (un oubli repris à la fin) ne fait pas passer un rayon en dernier. Les rayons où tu n'es pas passé gardent leur place.
- **L'ordre des articles dans chaque rayon** : même principe, d'après l'ordre dans lequel tu les prends.
- **Le rayon d'un article** : quand tu le déplaces (appui long), l'app retient ton choix pour ce magasin, pour cet article seul ou pour toute sa catégorie.
- **Tes habitudes** : les articles que tu achètes souvent remontent en premier quand tu tapes dans la barre.

Chaque magasin a son propre ordre : apprendre l'un ne change pas les autres. Courses rouvertes puis terminées à nouveau : rien n'est compté deux fois.

## Installation

Optimisée pour **Chrome** sur iPhone et Android. Adresse : _disponible à la première mise en ligne_.

**iPhone (Chrome)**

1. Ouvrir l'adresse dans Chrome.
2. Bouton **Partager** (dans la barre d'adresse) → **Ajouter à l'écran d'accueil** → **Ajouter**.
3. Lancer l'app depuis l'icône de l'écran d'accueil.

> Important : installe l'app **avant** de commencer à t'en servir. Sur iPhone, l'app installée et le navigateur ne partagent pas leurs données.

**Android (Chrome)**

1. Ouvrir l'adresse dans Chrome.
2. Appuyer sur **Installer** (bouton proposé par l'app, ou menu ⋮ → _Installer l'application_).

## État du projet

🚧 **Développement de la v1.0 en cours.** Spécification validée dans [`docs/`](docs/README.md). Une version 0.9 sera d'abord utilisée en conditions réelles avant de devenir la 1.0.

## Pour les développeurs

Toute la documentation technique (fonctionnalités, architecture, tests, plan) est dans [`docs/`](docs/README.md).
