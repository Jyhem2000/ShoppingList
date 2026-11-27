# 09 — Feuille de route

Les prochaines versions. Le détail de chaque fonctionnalité (critères, écrans) est dans [03](03-fonctionnalites.md) ; ce qui est déjà publié se lit dans l'écran Nouveautés de l'app.

## 1.2.0 — Anti-oubli et saisonnalité

- **Faire le tour** : un bouton « Rien oublié ? Faire le tour » au-dessus des lignes de la liste, avec le nombre d'articles à racheter.
  - **À racheter** ([03 D1](03-fonctionnalites.md#d1-suggestions-anti-oubli--v12)) : ce qu'il est temps de reprendre d'après le rythme des achats (07 § 7.7) ; un toucher ajoute, « Pas cette fois » masque jusqu'aux prochaines courses ; en tête des Habituels du catalogue.
  - **Revue par catégorie** ([03 D2](03-fonctionnalites.md#d2-revue-rapide-par-catégorie--v12)) : un écran par catégorie avec ses articles habituels.
- **Saisonnalité des fruits et légumes** ([03 D3](03-fonctionnalites.md#d3-saisonnalité--v12)) :
  - le catalogue donne les mois de saison des fruits, légumes et herbes aromatiques par zone (`season`, 06 § 4) : l'endroit où l'on fait ses courses, pas la langue ; seule zone, la France métropolitaine, sans réglage ;
  - mois copiés dans l'article à sa création, modifiables dans sa fiche (calendrier des 12 mois) ; un article créé à la main n'a pas de mois, on peut les saisir ;
  - pastille « de saison » (feuille verte) dans le catalogue, la liste et les suggestions anti-oubli ; calendrier des 12 mois dans la fiche article ; filtre « De saison » dans le catalogue.
- **Unité selon l'usage** ([03 A2](03-fonctionnalites.md#a2-saisie-naturelle--v10)) : un article ajouté sans unité prend celle qu'on achète le plus pour lui (à partir de 3 achats), sauf unité ou quantité choisie à la main dans sa fiche.

## 1.3.0 — Anglais

- **Interface et catalogue en anglais** ([03 I3](03-fonctionnalites.md#i3-anglais--v13)), langue choisie dans les réglages. Les données sont déjà organisées pour (02 § 1, 06 § 4) : rien à migrer.
  - **Anglais britannique** (aubergine, courgette, coriander) ; les mots américains (eggplant, zucchini, cilantro) sont des alias.
  - **Premier lancement** : l'anglais si le téléphone est en anglais, sinon le français. Une installation existante reste en français.
  - **Changer de langue** renomme dans la nouvelle langue ce qui vient du catalogue et n'a jamais été renommé (articles, catégories, unités) ; ce que l'utilisateur a renommé ou créé garde son nom. Un message le précise avant de confirmer. Dates, nombres et tri suivent la langue.
- **Saisie naturelle en anglais** ([03 A2](03-fonctionnalites.md#a2-saisie-naturelle--v10), [07 § 7.3](07-architecture-technique.md#73-parseentrytext-units--parsedentry)) : les mots lus par `parseEntry` sont en français (`et`, `puis`, nombres en lettres, « douzaine », partitifs `du`, `de`, `d'`…) ; il les faut par langue (`and`, `one`, `dozen`, `of`…), avec les noms d'unités anglais dans `units.json`. Une unité de cuisine n'est lue dans une liste que devant « de » : en anglais, il faut aussi l'accepter sans « of » quand c'est une abréviation (« 2 tbsp sugar »), sinon l'article deviendrait « tbsp sugar ». Ce qui ne lit pas de mots (puces, collage, notes) marche déjà dans toutes les langues.

## 1.4.0 — Saisons selon la région

- **Région des saisons au choix** ([03 D3](03-fonctionnalites.md#d3-saisonnalité--v12)) : Réglages → Préférences → Région des saisons, l'endroit où l'on fait ses courses, toujours indépendant de la langue (même liste de choix que la langue). Les réglages ne gardent que la région ; une installation existante, sans région, reste en France métropolitaine.
- **Zones climatiques** : les saisons dépendent du climat, pas des frontières. Chaque région est rattachée à une zone, et les mois ne s'écrivent qu'une fois par zone :
  - **tempérée** (`temperate`, l'ancienne clé `FR` de `season`, 06 § 4) : France métropolitaine, Belgique, Luxembourg, Suisse, Royaume-Uni, Irlande ;
  - **méditerranéenne** (`mediterranean`, plus précoce) : Sud-Est de la France ; mois écrits pour chaque fruit, légume et herbe qui a des mois tempérés (pas un simple décalage), d'après les calendriers publics ;
  - **hémisphère sud** : pas de mois écrits, ceux de la zone tempérée décalés de six mois (des fraises d'avril à septembre deviennent d'octobre à mars).
  - Espagne, Italie et Portugal viendront avec l'espagnol, mois relus avec quelqu'un sur place (le sud de l'Espagne est plus précoce que la Provence).
- **Premier lancement** : la région se déduit du fuseau horaire du téléphone (`Europe/Brussels` → Belgique, `Australia/Sydney` → hémisphère sud), plus fiable que la langue, dont la région suit souvent la langue choisie plutôt que le pays ; à défaut, de la région de la langue (`fr-CH`, `en-IE`), puis la France métropolitaine. Le Sud-Est de la France ne se devine pas (même fuseau) : il se choisit.
- **Changer de région** : si la zone change, les mois de la nouvelle zone remplacent ceux de tous les articles du catalogue, y compris ceux dont le calendrier a été changé à la main dans la fiche, et un article sans mois dans la nouvelle zone n'en a plus ; un message le précise avant de confirmer. Les articles créés à la main gardent les leurs. Dans la même zone (France → Belgique), rien n'est recopié et rien n'est demandé. Les mois sont lus dans le catalogue de l'app : pas de mise à jour du catalogue (`CATALOG_VERSION`) pour la nouvelle zone.
- **Code** : la zone d'une région, le décalage des mois et la région du premier lancement sont des fonctions pures (`src/domain/season.ts`) ; le changement de région suit `changeLanguage` (une transaction : réglages et articles) ; `buildInitialData` reçoit la région comme la langue. La sauvegarde garde la région avec les articles.
- **Tests** : unitaires pour la zone d'une région, le décalage (à cheval sur l'année), la région du premier lancement et la recopie au changement ; E2E à mi-novembre : passer à l'hémisphère sud fait entrer les fraises dans « De saison » et en sortir les poireaux.

## Après la 1.4.0 — Espagnol

- **Espagnol d'Espagne** (`es`), comme l'anglais britannique : interface et catalogue. Les mots d'Amérique latine sont des alias (papa → patata, jugo → zumo, durazno → melocotón, ejotes → judías verdes, frutilla → fresa, palta → aguacate, porotos → alubias, choclo → maíz…). Unités métriques, comme partout en Espagne et en Amérique latine. Interface au tutoiement (`tú`), compris partout ; jamais `vosotros`.
- **Code propre à l'espagnol** (tables `ByLanguage`) : mots de la saisie (`y`, `luego`, `de`, nombres en lettres, `docena`, `media docena`), singulier de la recherche (‑s, ‑es, ‑ces → ‑z), pluriel, accord du rendement des recettes en genre (`personas`, `raciones`), petits mots des monogrammes, dates et nombres (`es-ES`).
- **Catalogue** : noms, alias et types de chaque article (même nombre et même ordre de types dans chaque langue), catégories, unités et mots-clés, à relire avec quelqu'un qui fait ses courses en Espagne.

## Plus tard — Variantes, à la demande

Seulement pour de vrais utilisateurs qui les demandent. Une variante est une couche de différences au-dessus de sa langue (textes et noms d'articles qui changent), pas une langue complète ; en attendant, ses mots sont des alias.

- **Anglais américain** (`en-US`) : une centaine de textes et de noms (store, cart, can, color ; zucchini, eggplant, cilantro, ground beef…) et surtout des **unités impériales** proposées par défaut (cups, oz, lb, fl oz).
- **Français du Québec** (`fr-CA`) : quelques textes (faire l'épicerie, panier) et noms (bleuets, blé d'Inde, croustilles…), et les **tasses** et **livres** des recettes : le même besoin d'unités non métriques que `en-US`, à faire ensemble.
- **Espagnol d'Amérique latine** (`es-419`) : de nombreux noms d'articles différents de l'Espagne (papa, jugo, durazno, frijoles…), unités métriques ; seulement si les alias ne suffisent pas.
- **Inutiles** : français de Belgique et de Suisse (quelques mots, déjà en alias : chicons, pistolets, couques…), anglais d'Irlande, d'Australie ou du Canada (proches de l'anglais britannique).
- **Une autre langue** (italien, allemand…) : même travail que l'espagnol. L'allemand est le plus coûteux (pluriels irréguliers, mots composés).
