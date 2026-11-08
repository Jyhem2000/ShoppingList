# Guide — Configurer Cloudflare Pages et GitHub

À faire **une seule fois**. Tout est gratuit. Ensuite, chaque push sur GitHub est construit et mis en ligne par Cloudflare, sans rien d'autre à faire.

Rappel ([07 § 9](07-architecture-technique.md#9-hébergement-versions-et-déploiement)) :

| Branche                    | Environnement | Adresse                        |
| -------------------------- | ------------- | ------------------------------ |
| `phase-…`, `fix-…`         | Aperçu        | `<branche>.<projet>.pages.dev` |
| `dev` (branche par défaut) | Préproduction | `dev.<projet>.pages.dev`       |
| `main`                     | Production    | `<projet>.pages.dev`           |

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

5. **Environment variables (advanced)** → ajouter `NODE_VERSION` = `24`.
6. **Save and Deploy**. Le premier déploiement construit `main`, qui ne contient encore que la doc : il peut échouer, c'est normal tant qu'aucune version n'est publiée.

## 4. Cloudflare : aperçus de toutes les branches

Projet → **Settings** → **Builds** (ou **Builds & deployments**) → **Branch control** → **Preview branch** : **All non-production branches**. Ainsi `dev` (préproduction) et chaque branche de phase ont leur adresse.

## 5. Vérifier

1. Projet → **Deployments** : un déploiement par branche poussée. Une branche poussée avant la connexion n'apparaît qu'au push suivant (ou via **Create deployment** / **Retry deployment**).
2. Ouvrir `https://phase-1-socle.<projet>.pages.dev` sur les téléphones, installer l'app et suivre la checklist de [08 § 5](08-tests-et-qualite.md#5-checklist-manuelle-sur-téléphone-fin-de-chaque-phase).
3. Si un build échoue, son journal indique quel contrôle (format, lint, types, tests) a échoué ; rien n'est mis en ligne dans ce cas.

## Sécurité

- L'application Cloudflare n'a accès qu'au dépôt choisi ; révocable dans GitHub → **Settings** (du compte) → **Applications**.
- Aucun jeton ni secret à stocker dans le dépôt.
