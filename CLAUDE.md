# ShoppingList — consignes pour l'agent

PWA de liste de courses, local-first (aucun serveur, aucun compte), triée par rayon selon le magasin. Optimisée pour Chrome : iPhone (dernière version d'iOS, cible principale) et Android récent (cible secondaire).

## Phase actuelle : développement de la v1.0 — phase 1 (socle)
La documentation est **validée** (8 novembre 2026). Suivre le plan de `docs/09-plan-de-developpement.md` phase par phase : une phase = une branche = une pull request. Pour les phases 3 à 6 et 8, proposer un plan avant d'implémenter. Ne jamais commencer une phase suivante sans validation de la précédente.

## Documentation de référence
`docs/` fait foi : vision (01), modèle métier (02), fonctionnalités et versions (03), écrans (04), identité visuelle (05), données initiales (06), architecture (07), tests (08), plan (09). En cas de doute, la relire plutôt que supposer. Toute décision qui s'en écarte → mettre à jour `docs/` dans le même commit.

## Contraintes produit non négociables
- Sur iPhone, tout tourne dans **WebKit** (Chrome iPhone comme app installée). Fonctionnalités **essentielles** : doivent marcher sur iPhone ET Android. Fonctionnalités **de confort** (vibrations…) : au moins un des deux, avec détection préalable et **aucune erreur** là où elles manquent. Rien qui ne marche nulle part.
- **100 % gratuit** : aucune API payante, aucune clé d'API payante, aucun service tiers payant.
- **Thème sombre unique** (pas de thème clair ni de sélecteur de thème).
- Interface **en français** ; tous les textes dans `src/i18n/fr.ts`.
- Tout est modifiable par l'utilisateur (articles, catégories, rayons, magasins, unités, listes, recettes).

## Stack (une fois le code démarré)
Vite · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui · React Router 7 (hash) · Dexie · Motion · dnd-kit · lucide-react · Fluent Emoji Flat (Iconify) · Web Audio · lz-string · vite-plugin-pwa · Biome · Vitest · Playwright (WebKit/iPhone + Chromium/Android) · Cloudflare Pages via GitHub Actions.

## Règles de code
- Logique métier dans `src/domain/` : fonctions pures, sans React ni Dexie.
- IDs : `crypto.randomUUID()`. Libellé ≠ identifiant ≠ slug ; slugs via `slugify` (docs/02 § 1).
- Ne jamais stocker de donnée dérivée ; ne jamais recopier le libellé d'un article dans une ligne, un ingrédient ou l'historique.
- Toute évolution du schéma Dexie = nouvelle version + migration + test. La version du schéma est indépendante de la version de l'app.
- Mobile d'abord (390×844), zones de sécurité, cibles tactiles ≥ 44 px (48 px en mode courses).
- Animations via Motion, en respectant le réglage « Animations » de l'app (auto / toujours / jamais).
- Sons et vibrations uniquement via le module `src/feedback/`.
- Version de l'app : source unique `package.json`, injectée au build ; jamais de numéro de version écrit en dur.

## Tests
- Uniquement dans `tests/unit` (Vitest) et `tests/e2e` (Playwright). **Aucun test dans `src/`.**
- Seulement les tests utiles listés dans docs/08 § 3 ; pas de course au taux de couverture.
- Avant de déclarer une tâche terminée : lint, types, tests unitaires et E2E verts, et vérification visuelle en taille téléphone.

## Git et publication
- Auteur des commits : **Jyhem2000** avec l'adresse masquée `32844022+Jyhem2000@users.noreply.github.com` (déjà dans la config git locale ; ne pas utiliser l'identité git globale). **Ne jamais ajouter de ligne `Co-Authored-By`** ni de mention de génération par IA dans les commits ou pull requests.
- Messages en français, format Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Une branche par phase, pull request vers `main`.
- Fin de phase de la v1.0 : `npm version minor --no-git-tag-version` (0.1.0 … 0.7.0, sans tag). Puis tag `v0.9.0` (premier déploiement en production), correctifs `0.9.x`, et `v1.0.0` après validation (docs/07 § 9 — Cycle des versions).
- Publication d'une version taguée : `CHANGELOG.md` + `npm version <minor|patch>` + `git push --follow-tags`. Ne jamais publier de version sans demande explicite.
