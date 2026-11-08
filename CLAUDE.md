# ShoppingList — consignes pour l'agent

PWA de liste de courses, local-first (aucun serveur, aucun compte), triée par rayon selon le magasin. Cible principale iPhone (Safari, dernière version d'iOS), cible secondaire Android récent (Chrome).

## ⚠️ Phase actuelle : conception
**N'écris aucun code applicatif tant que tous les documents de `docs/` ne sont pas au statut « ✅ Validé »** (tableau dans `docs/README.md`). Seule la documentation peut être modifiée pendant cette phase.

## Documentation de référence
`docs/` fait foi : vision (01), modèle métier (02), fonctionnalités (03), écrans (04), identité visuelle (05), données initiales (06), architecture (07), tests (08), plan (09). En cas de doute, la relire plutôt que supposer. Toute décision qui s'en écarte → mettre à jour `docs/` dans le même commit.

## Contraintes produit non négociables
- Cible : **iPhone, Safari, app installée sur l'écran d'accueil** ; tout doit aussi marcher sur **Chrome Android**. Pas de fonctionnalité qui dépend d'une API absente de Safari iOS.
- **100 % gratuit** : aucune API payante, aucune clé d'API, aucun service tiers payant.
- **Thème sombre unique** (pas de thème clair ni de sélecteur de thème).
- Interface **en français** ; tous les textes dans `src/i18n/fr.ts`.
- Tout est modifiable par l'utilisateur (articles, catégories, rayons, magasins, unités, listes, recettes).

## Stack (une fois le code démarré)
Vite · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui · React Router 7 (hash) · Dexie · Motion · dnd-kit · lucide-react · Fluent Emoji Flat (Iconify) · lz-string · vite-plugin-pwa · Biome · Vitest · Playwright (WebKit/iPhone + Chromium/Android).

## Règles de code
- Logique métier dans `src/domain/` : fonctions pures, sans React ni Dexie.
- IDs : `crypto.randomUUID()`. Libellé ≠ identifiant ; slugs via `slugify` (docs/02 § 1).
- Ne jamais stocker de donnée dérivée ; ne jamais recopier le libellé d'un article dans une ligne, un ingrédient ou l'historique.
- Toute évolution du schéma Dexie = nouvelle version + migration + test.
- Mobile d'abord (390×844), zones de sécurité iOS, cibles tactiles ≥ 44 px (48 px en mode courses).
- Animations via Motion, en respectant le réglage « Animations » de l'app (auto / toujours / jamais).

## Tests
- Uniquement dans `tests/unit` (Vitest) et `tests/e2e` (Playwright). **Aucun test dans `src/`.**
- Seulement les tests utiles listés dans docs/08 § 3 ; pas de course au taux de couverture.
- Avant de déclarer une tâche terminée : lint, types, tests unitaires et E2E verts, et vérification visuelle en taille iPhone.

## Git
- Auteur des commits : **Jyhem2000** avec l'adresse masquée `32844022+Jyhem2000@users.noreply.github.com` (déjà dans la config git locale ; ne pas utiliser l'identité git globale). **Ne jamais ajouter de ligne `Co-Authored-By`** ni de mention de génération par IA dans les commits ou pull requests.
- Messages en français, format Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Une branche par phase, pull request vers `main`.
