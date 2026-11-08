# Guide — Configurer Cloudflare Pages et GitHub

À faire **une seule fois**. Tout est gratuit. Ensuite, chaque push sur GitHub est construit et mis en ligne par Cloudflare, sans rien d'autre à faire.

Rappel ([07 § 9](07-architecture-technique.md#9-hébergement-versions-et-déploiement)) :

| Branche                    | Environnement      | Adresse                  |
| -------------------------- | ------------------ | ------------------------ |
| `phase-…`, `fix-…`         | — (pas construite) | —                        |
| `dev` (branche par défaut) | Préproduction      | `dev.<projet>.pages.dev` |
| `main`                     | Production         | `<projet>.pages.dev`     |

> Les intitulés exacts des tableaux de bord Cloudflare et GitHub peuvent légèrement varier selon les mises à jour de leur interface.

## 1. GitHub : branche par défaut `dev`

La branche `dev` est déjà créée et poussée.

1. Dépôt `Jyhem2000/ShoppingList` → **Settings** → **General** → **Default branch** → icône ⇄ → choisir **`dev`** → **Update**.
2. Ainsi, les pull requests visent `dev` par défaut. `main` ne reçoit que les versions publiées (`npm run release`).

_Facultatif_ : **Settings** → **Rules** → **Rulesets** → **New branch ruleset** sur `main`, en interdisant la suppression et le _force push_.

## 2. Cloudflare : créer le compte

1. Aller sur `https://dash.cloudflare.com/sign-up` et créer un compte (formule gratuite).
2. Confirmer l'adresse e-mail.

## 3. Cloudflare : connecter le dépôt

1. Tableau de bord → **Workers & Pages** → **Create** → onglet **Pages** → **Connect to Git**.
2. **Connect GitHub** : GitHub demande d'installer l'application Cloudflare. Choisir **Only select repositories** → `ShoppingList` → **Install & Authorize**. Le dépôt peut rester privé : seul le site publié est public.
3. Choisir le dépôt `ShoppingList` → **Begin setup**.
4. Réglages du projet :

   | Champ                  | Valeur                                                     |
   | ---------------------- | ---------------------------------------------------------- |
   | Project name           | `shoppinglist` (ou un autre nom libre, il forme l'adresse) |
   | Production branch      | **`main`**                                                 |
   | Framework preset       | `None`                                                     |
   | Build command          | **`npm run build:checked`**                                |
   | Build output directory | **`dist`**                                                 |

5. **Environment variables (advanced)** → ajouter `NODE_VERSION` = `26`.
6. **Save and Deploy**. Le premier déploiement construit `main`, qui ne contient encore que la doc : il peut échouer, c'est normal tant qu'aucune version n'est publiée.

## 4. Cloudflare : construire seulement `dev` en plus de `main`

Projet → **Settings** → **Build** → **Branch control** → crayon :

1. **Preview branch** : **Custom branches**.
2. **Include Preview branches** : taper `dev` puis **appuyer sur Entrée**, pour que `dev` devienne une étiquette. Sans Entrée, le champ reste vide pour Cloudflare (« Please specify custom branches… ») et rien n'est enregistré.
3. **Exclude Preview branches** : laisser vide.
4. **Save**.

Ainsi seules `main` (production) et `dev` (préproduction) sont construites ; les branches de travail ne consomment aucun build.

## 5. Vérifier

1. Projet → **Deployments** : un déploiement par branche poussée. Un projet relié à Git n'a **pas de bouton pour lancer un déploiement** : seul un push (ou un _Deploy Hook_, ci-dessous) déclenche un build. **Retry deployment** reconstruit le _même_ commit qu'à l'origine, pas le dernier.
2. Si un push ne déclenche rien, ou si Cloudflare affiche « This project is disconnected from your Git account » : GitHub → **Settings** (du compte) → **Applications** → **Installed GitHub Apps** → **Cloudflare Workers and Pages** → **Configure** → vérifier que `ShoppingList` est autorisé → **Save**. Cela arrive notamment après un changement de visibilité du dépôt.
3. Ouvrir la préproduction (`https://dev.<projet>.pages.dev`) sur les téléphones, installer l'app et suivre la checklist de [08 § 5](08-tests-et-qualite.md#5-checklist-manuelle-sur-téléphone-fin-de-chaque-phase).
4. Si un build échoue, son journal indique quel contrôle (format, lint, types, tests) a échoué ; rien n'est mis en ligne dans ce cas.

## Relancer un build sans push (Deploy Hook)

Utile pour reconstruire une branche dont le dernier build a échoué pour une raison extérieure (connexion GitHub, réglage Cloudflare).

1. Projet → **Settings** → **Deploy Hooks** → **+** → nom `manuel`, branche `main` (ou `dev`) → **Save**. Cloudflare affiche une adresse.
2. Sur le PC : `curl -X POST "<adresse du hook>"`. Le build du dernier commit de la branche démarre.

L'adresse du hook permet à quiconque la connaît de lancer un build : ne jamais l'écrire dans le dépôt (public).

## Sécurité

- L'application Cloudflare n'a accès qu'au dépôt choisi ; révocable dans GitHub → **Settings** (du compte) → **Applications**.
- Aucun jeton ni secret à stocker dans le dépôt.
