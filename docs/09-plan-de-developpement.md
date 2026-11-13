# 09 — Plan de développement

Développement confié à un agent IA, par **phases courtes et vérifiables**. Chaque phase se termine par : tests verts, app déployée en préproduction, checklist téléphone ([08 § 5](08-tests-et-qualite.md#5-checklist-manuelle-sur-téléphone-fin-de-chaque-phase)) validée par toi.

| Version                                                                  | Phases                                                                                                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| —                                                                        | 0. Validation de la doc ✅                                                                                                           |
| **v1.0 — Cœur** (0.N.0 à chaque phase N validée, puis 0.9 en usage réel) | 1. Socle · 2. Maquette visuelle · 3. Données et logique · 4. Liste · 5. Mode courses · 6. Tout modifiable · 7. Réglages et finitions |
| **v1.1 — Recettes**                                                      | 8. Recettes                                                                                                                          |
| **v1.2 — Anti-oubli**                                                    | 9. Anti-oubli                                                                                                                        |
| **v1.3 — Partage**                                                       | 10. Partage                                                                                                                          |

Numérotation : la version **`0.N.0` sort quand la phase N est validée** ; elle peut contenir en avant-première le travail de la phase suivante. Correctifs entre deux : `0.N.1`, `0.N.2`… Détails et déploiements : [07 § 9 — Cycle des versions](07-architecture-technique.md#cycle-des-versions).

### Versions publiées

| Version | Date             | Contenu                                                                                                                                                                                                                              |
| ------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `0.4.0` | 12 novembre 2026 | Phases 1 à 4 validées ; mode courses (phase 5) en avant-première, à valider par un essai en magasin.                                                                                                                                 |
| `0.5.0` | 12 novembre 2026 | Phase 5 publiée **avant** l'essai en magasin, à la demande de l'utilisateur (seul utilisateur) : l'essai se fait sur la production ; correctifs en `0.5.x` ou dans la `0.6.0`. Thème clair, recherche du catalogue, retours de test. |
| `0.6.0` | 12 novembre 2026 | Phase 6 (tout modifiable : magasins et rayons, articles et doublons, icônes, catégories, unités), publiée pour un essai réel par l'utilisateur ; validation sur la production, correctifs en `0.6.x`.                                |
| `0.6.1` | 13 novembre 2026 | Retours du premier essai réel : liste par catégorie (rayons en mode courses), sauvegarde (export, import), catalogue mis à jour sans réinstaller, « où l'as-tu pris ? », quantité modifiable en magasin, « Pas pris ».               |

Les `0.1.0` et `0.3.0` publiées les 8 et 9 novembre 2026 ont disparu avec la reprise à zéro de l'historique git (12 novembre 2026).

## Phase 0 — Validation de la documentation ✅

- Tous les documents de `docs/` sont au statut « Validé » (le 8 novembre 2026).

## v1.0 — Cœur

### Phase 1 — Socle technique

- Initialisation : Vite, React, TypeScript strict, Tailwind v4, shadcn/ui, ESLint + Prettier, Vitest, Playwright (WebKit/iPhone + Chromium/Android), vite-plugin-pwa, police Plus Jakarta Sans, tokens de couleurs (05 § 2).
- Structure de dossiers (07 § 8), coquille de l'app : onglets, zones de sécurité, écran de premier lancement (installation iPhone et Android), bandeau de mise à jour, écran « À propos » (version, nouveautés, licences).
- Déploiement Cloudflare Pages connecté au dépôt (préproduction sur `dev`, production sur `main`) et script de publication `npm run release` — voir 07 § 9.
- Réglages → **Fonctionnalités** : sons (général et un par un, avec écoute), écran allumé pendant les courses ; grisées si le téléphone ne les permet pas. Écran À propos avec « Rechercher une mise à jour ».
- À vérifier sur les deux téléphones : installation, plein écran, hors ligne, sons et mode silencieux, mise à jour après un nouveau déploiement. Le Wake Lock en situation réelle se vérifie en phase 5 (mode courses).
- ✅ _L'app vide s'installe, s'ouvre hors ligne et se met à jour sur les deux téléphones._ → version `0.1.0`.
- **Prérequis de ton côté** : compte Cloudflare (gratuit) et projet Pages connecté au dépôt GitHub — procédure dans `docs/deploiement-cloudflare.md`.

### Phase 2 — Maquette visuelle

- Page interne `#/dev/ui` présentant tous les composants clés (05 § 5) avec de fausses données : lignes, en-têtes de rayon, barre d'ajout, cartes du catalogue, panneaux, boutons, monogrammes, sons.
- Script `build-icon-pack` et premier pack d'icônes (274 icônes), monogramme pour les articles sans icône.
- Maquette accessible hors production par Réglages → À propos → « Maquette des composants ».
- ✅ _Tu valides le rendu sur iPhone (couleurs, tailles, icônes, sons) avant de construire les fonctionnalités._ → `0.2.0`.

### Phase 3 — Données et logique métier

- Schéma Dexie, données initiales (06) avec un premier catalogue de ~150 articles (238 livrés), initialisation au premier lancement.
- `src/domain/` : slugify, recherche (avec alias), parseEntry, rayon effectif (principal/secondaire), groupement, quantités (conversion, simplification) + tests unitaires.
- ✅ _Tests unitaires verts sur tous les cas de 03 § A2, la simplification et le tri par rayon._ → `0.3.0`.

### Phase 4 — Remplir et afficher la liste

A1 à A7, B1 à B6, H8. Résolution d'icône en cascade et monogramme, sons d'ajout.

- ✅ _Scénarios E2E 1, 2, 3 et 6 verts._ → `0.4.0`.

### Phase 5 — Mode courses, clôture et apprentissage

C1 à C8.

- ✅ _Scénario E2E 4 vert ; tests unitaires clôture/apprentissage/réouverture verts ; essai réel en magasin (préproduction)._ → `0.5.0`.

### Phase 6 — Tout est modifiable

G1 à G5 (articles et alias, catégories, magasins et rayons avec glisser-déposer et rayons principaux/secondaires, apprentissage de l'ordre activé ou non par magasin, unités, sélecteur d'icône).

- ✅ _Scénario E2E 5 vert._ → `0.6.0`.

### Phase 7 — Réglages, sauvegarde, finitions

H1 à H6 (H4 avancée en partie dans la `0.6.1` : export et import en remplacement), H9 et H10 (écran d'aide : mode d'emploi, ce que l'app règle toute seule, conseil de suivre le même parcours pendant l'apprentissage), catalogue complet (~1 000 articles avec alias) **relu par toi catégorie par catégorie**, passe d'animations et de sons, accessibilité, états vides.

- ✅ _Essai réel en magasin sur les deux téléphones (préproduction)._ → `0.7.0`.

### Publication 0.9 puis 1.0

- 🚀 **`npm run release -- 0.9.0`** : installation définitive de la production sur les deux téléphones.
- 2-3 semaines d'usage réel ; correctifs publiés en `0.9.1`, `0.9.2`…
- 🎉 _**Validation → `npm run release -- 1.0.0`** (même code). Les données restent en place._

## v1.1 — Recettes

### Phase 8 — Recettes

E1, E2 : onglet Recettes, fiche recette avec rendement (personnes ou unité libre), ajout à une liste avec recalcul, arrondi, simplification et fusion des quantités.

- ✅ _Tests unitaires `scaleRecipe` / `mergeQuantity` verts ; scénario E2E 7 vert._
- 🎉 _**Publication v1.1.0.**_

## v1.2 — Anti-oubli

### Phase 9 — Anti-oubli

D1, D2 : suggestions basées sur la fréquence d'achat, revue rapide par catégorie.

- 🎉 _**Publication v1.2.0.**_

## v1.3 — Partage

### Phase 10 — Partage

F1, F2, A8 : envoyer une liste, l'importer (lien sur Android, « Coller une liste partagée » sur iPhone), aperçu d'import avec « C'est le même que… », coller une liste en texte.

- ✅ _Scénario E2E 8 vert ; essai réel iPhone → Android et Android → iPhone._
- 🎉 _**Publication v1.3.0.**_

## Plus tard et idées

- Plus tard : saisonnalité (D3), partage de recettes (E3).
- Idées non planifiées, peut-être jamais : scan de code-barres (I1), convertisseur d'unités (I2).

---

## Conventions git

- Dépôt public : `https://github.com/Jyhem2000/ShoppingList`.
- Auteur des commits : **Jyhem2000**, adresse masquée GitHub `32844022+Jyhem2000@users.noreply.github.com` (configurée localement dans le dépôt). **Pas de ligne `Co-Authored-By`** dans les messages de commit.
- Messages de commit en français, format _Conventional Commits_ : `feat: barre d'ajout éclair`, `fix: arrondi des recettes`, `docs: …`, `test: …`, `chore: …`.
- On travaille **directement sur `dev`** (branche par défaut) : chaque commit poussé met à jour la préproduction, sans branche de travail ni pull request. La checklist téléphone se fait en préproduction.
- `main` = production : n'avance que par `npm run release`, jamais de travail ni de fusion directe.
- Publication d'une version : `npm run release` depuis `dev`, sur demande explicite (07 § 9 : nouveautés, contrôles, version, tag, avance de `main`, déploiement automatique).
- Toute décision qui s'écarte de `docs/` → mise à jour de `docs/` dans le même commit.

## Travailler avec l'agent

- Une phase = une demande, avec les identifiants de fonctionnalités et les critères d'acceptation de [03](03-fonctionnalites.md).
- Pour les phases 3 à 6 et 8 : demander d'abord un **plan**, le valider, puis lancer l'implémentation.
- L'agent doit lancer lint, types, tests unitaires et E2E, et regarder l'app en taille téléphone avant de déclarer une tâche terminée.
- Relire soi-même les fonctions de `src/domain/` et les données initiales : c'est là que se jouent la justesse et la qualité perçue.
- Essais sur téléphone : sur la préproduction `dev` (le service worker et le Wake Lock exigent HTTPS).
