# Guide — Configurer Cloudflare Pages et GitHub

À faire **une seule fois**. Tout est gratuit. Ensuite, chaque push sur GitHub est construit et mis en ligne par Cloudflare, sans rien d'autre à faire.

Rappel ([07 § 9](07-architecture-technique.md#9-hébergement-versions-et-déploiement)) :

| Branche                    | Environnement | Adresse                                                              |
| -------------------------- | ------------- | -------------------------------------------------------------------- |
| `dev` (branche par défaut) | Préproduction | `dev.shoppinglist-app.pages.dev`                                     |
| `main`                     | Production    | `shoppinglist.jyhem.cloud` (`shoppinglist-app.pages.dev` y redirige) |

> Les intitulés exacts des tableaux de bord Cloudflare et GitHub peuvent légèrement varier selon les mises à jour de leur interface.

## 1. GitHub : branche par défaut `dev`

La branche `dev` est déjà créée et poussée.

1. Dépôt `Jyhem2000/ShoppingList` → **Settings** → **General** → **Default branch** → icône ⇄ → choisir **`dev`** → **Update**.
2. Tout le travail est poussé directement sur `dev`. `main` ne reçoit qu'un commit par version publiée (`npm run release`).

_Facultatif_ : **Settings** → **Rules** → **Rulesets** → **New branch ruleset** sur `main`, en interdisant la suppression et le _force push_.

## 2. Cloudflare : créer le compte

1. Aller sur `https://dash.cloudflare.com/sign-up` et créer un compte (formule gratuite).
2. Confirmer l'adresse e-mail.

## 3. Cloudflare : connecter le dépôt

1. Tableau de bord → **Workers & Pages** → **Create** → onglet **Pages** → **Connect to Git**.
2. **Connect GitHub** : GitHub demande d'installer l'application Cloudflare. Choisir **Only select repositories** → `ShoppingList` → **Install & Authorize**. Le dépôt peut rester privé : seul le site publié est public.
3. Choisir le dépôt `ShoppingList` → **Begin setup**.
4. Réglages du projet :

   | Champ                  | Valeur                                                                                           |
   | ---------------------- | ------------------------------------------------------------------------------------------------ |
   | Project name           | `shoppinglist-app` (il forme l'adresse `shoppinglist-app.pages.dev` ; `shoppinglist` était pris) |
   | Production branch      | **`main`**                                                                                       |
   | Framework preset       | `None`                                                                                           |
   | Build command          | **`npm run build:checked`**                                                                      |
   | Build output directory | **`dist`**                                                                                       |

5. **Environment variables (advanced)** : rien à ajouter. La version de Node vient du fichier `.node-version` du dépôt (`26`), que Cloudflare lit au build ; ne pas définir `NODE_VERSION`, qui ferait une seconde source.
6. **Save and Deploy**. Le premier déploiement construit `main`, qui ne contient encore que la doc : il peut échouer, c'est normal tant qu'aucune version n'est publiée.

## 4. Cloudflare : construire seulement `dev` en plus de `main`

Projet → **Settings** → **Build** → **Branch control** → crayon :

1. **Preview branch** : **Custom branches**.
2. **Include Preview branches** : taper `dev` puis **appuyer sur Entrée**, pour que `dev` devienne une étiquette. Sans Entrée, le champ reste vide pour Cloudflare (« Please specify custom branches… ») et rien n'est enregistré.
3. **Exclude Preview branches** : laisser vide.
4. **Save**.

Ainsi seules `main` (production) et `dev` (préproduction) sont construites.

## 5. Vérifier

1. Projet → **Deployments** : un déploiement par branche poussée. Un projet relié à Git n'a **pas de bouton pour lancer un déploiement** : seul un push (ou un _Deploy Hook_, ci-dessous) déclenche un build. **Retry deployment** reconstruit le _même_ commit qu'à l'origine, pas le dernier.
2. Si un push ne déclenche rien, ou si Cloudflare affiche « This project is disconnected from your Git account » : GitHub → **Settings** (du compte) → **Applications** → **Installed GitHub Apps** → **Cloudflare Workers and Pages** → **Configure** → vérifier que `ShoppingList` est autorisé → **Save**. Cela arrive notamment après un changement de visibilité du dépôt.
3. Ouvrir la préproduction (`https://dev.shoppinglist-app.pages.dev`) sur les téléphones, installer l'app et suivre la checklist de [08 § 5](08-tests-et-qualite.md#5-checklist-manuelle-sur-téléphone-avant-chaque-version).
4. Si un build échoue, son journal indique quel contrôle (format, lint, types, tests) a échoué ; rien n'est mis en ligne dans ce cas.

## 6. Domaine personnalisé

La production est servie sur `https://shoppinglist.jyhem.cloud` (DNS du domaine `jyhem.cloud` chez Cloudflare).

1. Projet → **Custom domains** → **Set up a custom domain** → `shoppinglist.jyhem.cloud` → **Continue** → **Activate domain**. Cloudflare crée l'enregistrement `CNAME shoppinglist → shoppinglist-app.pages.dev` (proxié) et le certificat.
2. Attendre l'état **Active**, puis vérifier : `https://shoppinglist.jyhem.cloud/version.json` renvoie la même version que `https://shoppinglist-app.pages.dev/version.json`.

Aucune adresse n'est écrite en dur dans le code : le manifeste (`id`, `start_url`, `scope`) et le service worker utilisent des adresses relatives (`/`). Pas d'Open Graph, de `canonical`, d'API, de CORS ni d'OAuth à adapter.

## 7. Rediriger `shoppinglist-app.pages.dev` vers le domaine

_En place : `shoppinglist-app.pages.dev` redirige vers le domaine. La marche à suivre est gardée pour la refaire au besoin._

> **Les données ne suivent pas l'adresse.** La base (IndexedDB : listes, articles, magasins, recettes) et les préférences de l'appareil (`localStorage` : thème, sons, écran allumé) appartiennent à l'adresse d'origine. Sur le nouveau domaine, l'app démarre vide. **Avant d'activer la redirection**, sur chaque téléphone : dans l'app installée depuis `shoppinglist-app.pages.dev`, **Réglages → Sauvegarde → Exporter un fichier** ; installer l'app depuis `https://shoppinglist.jyhem.cloud` ; **Importer un fichier** ; refaire les préférences de l'appareil (elles ne sont pas dans la sauvegarde) ; supprimer l'ancienne icône. Après la redirection, l'ancienne app installée ne se met plus à jour.

Redirection par **Bulk Redirects** (gratuit, sans code). Elle ne vise que le nom exact `shoppinglist-app.pages.dev` : la préproduction (`dev.shoppinglist-app.pages.dev`) et les aperçus de déploiement (`<empreinte>.shoppinglist-app.pages.dev`) ne sont pas redirigés.

1. Tableau de bord du compte → **Bulk Redirects** → **Create Bulk Redirect List** → nom `pages_dev`, contenu **Redirect** → **Next**.
2. **Manually add URL redirects** :

   | Champ                 | Valeur                             |
   | --------------------- | ---------------------------------- |
   | Source URL            | `shoppinglist-app.pages.dev`       |
   | Target URL            | `https://shoppinglist.jyhem.cloud` |
   | Status                | `301`                              |
   | Preserve query string | coché                              |
   | Include subdomains    | **décoché** (garde dev et aperçus) |
   | Subpath matching      | coché                              |
   | Preserve path suffix  | coché                              |

3. **Next** → **Save and Deploy** (ou, depuis **Bulk Redirects** → **Create Bulk Redirect Rule**, choisir la liste `pages_dev` → **Save and Deploy**).
4. Vérifier : `curl -sI https://shoppinglist-app.pages.dev/version.json` → `301` vers `https://shoppinglist.jyhem.cloud/version.json` ; `curl -sI https://dev.shoppinglist-app.pages.dev/version.json` → `200`.

## Relancer un build sans push (Deploy Hook)

Utile pour reconstruire une branche dont le dernier build a échoué pour une raison extérieure (connexion GitHub, réglage Cloudflare).

1. Projet → **Settings** → **Deploy Hooks** → **+** → nom `manuel`, branche `main` (ou `dev`) → **Save**. Cloudflare affiche une adresse.
2. Sur le PC : `curl -X POST "<adresse du hook>"`. Le build du dernier commit de la branche démarre.

L'adresse du hook permet à quiconque la connaît de lancer un build : ne jamais l'écrire dans le dépôt (public).

## Sécurité

- L'application Cloudflare n'a accès qu'au dépôt choisi ; révocable dans GitHub → **Settings** (du compte) → **Applications**.
- Aucun jeton ni secret à stocker dans le dépôt.
