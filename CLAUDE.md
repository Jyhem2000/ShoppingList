# ShoppingList — consignes pour l'agent

PWA de liste de courses, local-first (aucun serveur, aucun compte), triée par rayon selon le magasin. Optimisée pour Chrome : iPhone (dernière version d'iOS, cible principale) et Android récent (cible secondaire).

## Phase actuelle : développement de la v1.0 — phase 6 (tout modifiable) publiée, à valider

Version `0.6.1` publiée (phase 6 et retours du premier essai réel) ; correctifs en `0.6.x`. Ensuite : phase 7 (réglages, sauvegarde, aide, finitions).

La documentation est **validée** (8 novembre 2026). Suivre le plan de `docs/09-plan-de-developpement.md` phase par phase, en travaillant directement sur `dev` (pas de branche de travail ni de pull request). Pour les phases 3 à 6 et 8, proposer un plan avant d'implémenter. Ne jamais commencer une phase suivante sans validation de la précédente.

## Documentation de référence

`docs/` fait foi : vision (01), modèle métier (02), fonctionnalités et versions (03), écrans (04), identité visuelle (05), données initiales (06), architecture (07), tests (08), plan (09). En cas de doute, la relire plutôt que supposer. Toute décision qui s'en écarte → mettre à jour `docs/` dans le même commit.

## Contraintes produit non négociables

- Sur iPhone, tout tourne dans **WebKit** (Chrome iPhone comme app installée). Fonctionnalités **essentielles** : doivent marcher sur iPhone ET Android. Fonctionnalités **de confort** (bouton « Installer » d'Android…) : au moins un des deux, avec détection préalable et **aucune erreur** là où elles manquent. Rien qui ne marche nulle part.
- **100 % gratuit** : aucune API payante, aucune clé d'API payante, aucun service tiers payant.
- **Thème sombre par défaut, thème clair au choix** (Réglages → Thème : automatique, sombre, clair ; docs/05 § 2). Tout écran doit rester lisible dans les deux : uniquement les tokens, jamais de couleur en dur.
- Interface **en français** ; tous les textes dans `src/i18n/fr.ts`.
- Tout est modifiable par l'utilisateur (articles, catégories, rayons, magasins, unités, listes, recettes).

## Stack (une fois le code démarré)

Vite · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui · React Router 8 (hash) · Dexie · Motion · dnd-kit · lucide-react · icônes d'articles dessinées pour l'app (`src/icons/drawn`) · Web Audio · lz-string · vite-plugin-pwa · ESLint + Prettier · Vitest · Playwright (WebKit/iPhone + Chromium/Android) · Cloudflare Pages connecté au dépôt (pas de GitHub Actions).

## Règles de code

- Logique métier dans `src/domain/` : fonctions pures, sans React ni Dexie.
- IDs : `crypto.randomUUID()`. Libellé ≠ identifiant ≠ slug ; slugs via `slugify` (docs/02 § 1).
- Ne jamais stocker de donnée dérivée ; ne jamais recopier le libellé d'un article dans une ligne, un ingrédient ou l'historique.
- Toute évolution du schéma Dexie = nouvelle version + migration + test. La version du schéma est indépendante de la version de l'app.
- Mobile d'abord (390×844), zones de sécurité, cibles tactiles ≥ 44 px (48 px en mode courses).
- Animations via Motion, en respectant le réglage « Animations » de l'app (auto / toujours / jamais).
- Sons uniquement via le module `src/feedback/`. Pas de vibrations (retirées, docs/05 § 7).
- Version de l'app : source unique `package.json`, injectée au build ; jamais de numéro de version écrit en dur.
- Couleurs : uniquement les tokens du design system (docs/05 § 2, `src/styles/index.css`). Violet = ce qui s'actionne et titres d'écran ; or = icônes et repères ; une icône dans un bouton prend la couleur du texte.
- Formatage Prettier (réglages par défaut) sur tout le dépôt, doc comprise ; ESLint strict. Exclure un fichier = le dire et le justifier, jamais contourner.

## Tests

- Uniquement dans `tests/unit` (Vitest) et `tests/e2e` (Playwright). **Aucun test dans `src/`.**
- Seulement les tests utiles listés dans docs/08 § 3 ; pas de course au taux de couverture.
- Avant de déclarer une tâche terminée : `npm run check` (format, lint, types, tests unitaires) et `npm run e2e` verts, et vérification visuelle en taille téléphone.
- Résultats des tests E2E dans `tests/e2e/.results` et `tests/e2e/.report` (ignorés par git).

## Git et publication

- Auteur des commits : **Jyhem2000** avec l'adresse masquée `32844022+Jyhem2000@users.noreply.github.com` (déjà dans la config git locale ; ne pas utiliser l'identité git globale). **Ne jamais ajouter de ligne `Co-Authored-By`** ni de mention de génération par IA dans les commits ou pull requests.
- Messages en français, format Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- On travaille **directement sur `dev`** : commits poussés sur `dev` (préproduction, déployée automatiquement), sans branche de travail ni pull request.
- **Jamais de travail ni de push direct sur `main`** : elle n'avance que par `npm run release` (mise en production, manuelle).
- Publication d'une version : `npm run release` depuis `dev` (calcule la version depuis les commits, vérifie que ses nouveautés sont écrites dans `src/i18n/fr.ts` → `releaseNotes`, lance tous les contrôles, tague, avance `main` ; Cloudflare déploie). Numérotation : **`0.N.0` = phase N validée** (peut contenir en avant-première la phase suivante), correctifs `0.N.x` ; puis `0.9.0` (installation définitive), correctifs `0.9.x`, `1.0.0` après validation (docs/07 § 9, tableau des versions publiées dans docs/09). **Ne jamais publier sans demande explicite.**

## Outils locaux de l'agent (non versionnés)

`.claude/` est ignoré par git. Pour l'aperçu dans l'app Claude, `.claude/launch.json` déclare deux serveurs :

- `shoppinglist` : `npm run dev -- --port 5173 --strictPort` (port 5173) ;
- `shoppinglist-preview` : `npm run preview -- --port 4173 --strictPort` (port 4173, après `npm run build`).
