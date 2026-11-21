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
- **Saisie naturelle en anglais** ([03 A2](03-fonctionnalites.md#a2-saisie-naturelle--v10), [07 § 7.3](07-architecture-technique.md#73-parseentrytext-units--parsedentry)) : les mots lus par `parseEntry` sont en français (`et`, `puis`, nombres en lettres, « douzaine », partitifs `du`, `de`, `d'`…) ; il les faut par langue (`and`, `one`, `dozen`, `of`…), avec les noms d'unités anglais dans `units.json`. Une unité de cuisine n'est lue dans une liste que devant « de » : en anglais, il faut aussi l'accepter sans « of » quand c'est une abréviation (« 2 tbsp sugar »), sinon l'article deviendrait « tbsp sugar ». Ce qui ne lit pas de mots (puces, collage, notes) marche déjà dans toutes les langues.
