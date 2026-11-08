# 09 — Plan de développement

Développement confié à un agent IA, par **phases courtes et vérifiables**. Chaque phase se termine par : tests verts, app déployée, checklist iPhone ([08 § 5](08-tests-et-qualite.md#5-checklist-manuelle-sur-iphone-fin-de-chaque-phase)) validée par toi.

## Phase 0 — Validation de la documentation (en cours)
- Relire et valider chaque document de `docs/` (statuts dans [README](README.md)).
- Trancher les questions ouvertes.
- ✅ *Tous les documents au statut « Validé ». Aucune ligne de code avant.*

## Phase 1 — Socle technique
- Initialisation : Vite, React, TypeScript strict, Tailwind v4, shadcn/ui, Biome, Vitest, Playwright, vite-plugin-pwa, police Nunito, tokens de couleurs (05 § 2).
- Structure de dossiers (07 § 8), coquille de l'app : onglets, zones de sécurité iOS, écran de premier lancement (installation).
- GitHub Actions (lint, types, tests, build, E2E) + déploiement.
- Vérification sur iPhone **et** Android : installation, plein écran, hors ligne, **Wake Lock dans l'app installée** (petit écran de test).
- ✅ *L'app vide s'installe et s'ouvre hors ligne sur les deux téléphones.*

## Phase 2 — Maquette visuelle
- Page interne `#/dev/ui` présentant tous les composants clés (05 § 5) avec de fausses données : lignes, en-têtes de rayon, barre d'ajout, cartes du catalogue, panneaux, boutons, monogrammes.
- Script `build-icon-pack` et premier pack d'icônes.
- ✅ *Tu valides le rendu sur iPhone (couleurs, tailles, icônes) avant de construire les fonctionnalités.*

## Phase 3 — Données et logique métier
- Schéma Dexie, données initiales (06) avec un premier catalogue de ~100 articles, initialisation au premier lancement.
- `src/domain/` : slugify, recherche, parseEntry, rayon effectif, groupement, quantités + tests unitaires.
- ✅ *Tests unitaires verts sur tous les cas de 03 § A2 et le tri par rayon.*

## Phase 4 — Remplir et afficher la liste
A1 à A7, B1 à B6. Résolution d'icône en cascade et monogramme.
- ✅ *Scénarios E2E 1, 2, 3 et 8 verts.*

## Phase 5 — Mode courses et apprentissage
C1 à C7.
- ✅ *Scénario E2E 4 vert ; test unitaire d'apprentissage (3 sessions simulées) vert ; essai réel en magasin.*

## Phase 6 — Tout est modifiable
G1 à G5 (articles, catégories, magasins et rayons avec glisser-déposer, unités, sélecteur d'icône).
- ✅ *Scénario E2E 5 vert.*

## Phase 7 — Réglages, sauvegarde, finitions du cœur
H1 à H5, catalogue complet (~500 articles) **relu par toi catégorie par catégorie**, passe d'animations, accessibilité, états vides.
- ✅ *Le cœur de la v1.0 est utilisable au quotidien (essai réel en magasin, iPhone et Android).*

## Phase 8 — Recettes (étape à part de la v1.0)
E1, E2 : onglet Recettes, fiche recette, ajout à une liste pour N personnes avec recalcul, arrondi et fusion des quantités.
- ✅ *Test unitaire `scaleRecipe` / `mergeQuantity` vert ; scénario E2E 6 vert.*
- 🎉 ***v1.0 publiée. Utilisation réelle pendant 2-3 semaines avant la suite.***

## Phase 9 — v1.1 : partage
F1, F2, A8 : envoyer une liste, l'importer (lien sur Android, « Coller une liste partagée » sur iPhone), aperçu d'import, coller une liste en texte.
- ✅ *Scénario E2E 7 vert ; essai réel iPhone → Android et Android → iPhone.*

## Phase 10 — v1.2 : anti-oubli
D1, D2 : suggestions basées sur la fréquence d'achat, revue rapide par catégorie.

## Plus tard
Saisonnalité (D3), partage de recettes (E3), scan de code-barres (F3). L'ordre des phases 9 et 10 pourra être inversé selon l'usage réel.

---

## Conventions git
- Dépôt : `https://github.com/Jyhem2000/ShoppingList`.
- Auteur des commits : **Jyhem2000**, adresse masquée GitHub `32844022+Jyhem2000@users.noreply.github.com` (configurée localement dans le dépôt). **Pas de ligne `Co-Authored-By`** dans les messages de commit.
- Messages de commit en français, format *Conventional Commits* : `feat: barre d'ajout éclair`, `fix: arrondi des recettes`, `docs: …`, `test: …`, `chore: …`.
- Une branche par phase (`phase-4-liste`), pull request vers `main`, fusion quand la CI est verte et la checklist validée. `main` est toujours déployable.
- Toute décision qui s'écarte de `docs/` → mise à jour de `docs/` dans le même commit.

## Travailler avec l'agent
- Une phase = une demande, avec les identifiants de fonctionnalités et les critères d'acceptation de [03](03-fonctionnalites.md).
- Pour les phases 3 à 6 : demander d'abord un **plan**, le valider, puis lancer l'implémentation.
- L'agent doit lancer lint, types, tests unitaires et E2E, et regarder l'app en taille iPhone avant de déclarer une tâche terminée.
- Relire soi-même les fonctions de `src/domain/` et les données initiales : c'est là que se jouent la justesse et la qualité perçue.
- Essai sur iPhone : sur la version déployée (le service worker et le Wake Lock exigent HTTPS, ce qu'un serveur de dev local sur le réseau ne fournit pas sans configuration).
