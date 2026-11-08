# Guide — Configurer le déploiement Cloudflare Pages

À faire **une seule fois**. Tant que ce n'est pas fait, la CI GitHub vérifie tout mais n'envoie rien en ligne (message « Cloudflare n'est pas encore configuré »). Tout est gratuit.

Rappel des environnements ([07 § 9](07-architecture-technique.md#9-hébergement-versions-et-déploiement)) :

| Environnement | Déclencheur | Adresse |
|---|---|---|
| Aperçu | pull request | `<branche>.<projet>.pages.dev` |
| Préproduction | push sur `main` | `main.<projet>.pages.dev` |
| Production | tag `vX.Y.Z` | `<projet>.pages.dev` |

> Les intitulés exacts du tableau de bord Cloudflare peuvent légèrement varier selon les mises à jour de leur interface.

## 1. Créer le compte
1. Aller sur `https://dash.cloudflare.com/sign-up` et créer un compte (formule gratuite).
2. Confirmer l'adresse e-mail.

## 2. Relever l'identifiant du compte (Account ID)
Dans le tableau de bord : page d'accueil du compte ou **Workers & Pages** → colonne de droite **Account ID** → copier la valeur (32 caractères hexadécimaux).

## 3. Créer le projet Pages
Le plus simple, depuis le dossier du projet sur le PC :

```bash
npx wrangler login
```

```bash
npx wrangler pages project create shoppinglist --production-branch=production
```

- `wrangler login` ouvre le navigateur pour autoriser l'accès à ton compte.
- **`--production-branch=production` est important** : ainsi, seuls les déploiements marqués `production` (les tags de version) vont en production ; `main` devient la préproduction.
- Si le nom `shoppinglist` est déjà pris sur Cloudflare, en choisir un autre (ex. `shoppinglist-jyhem`) et le réutiliser à l'étape 5.

## 4. Créer un jeton d'API
1. Tableau de bord → icône de profil → **My Profile** → **API Tokens** → **Create Token**.
2. **Create Custom Token** :
   - nom : `GitHub Actions ShoppingList` ;
   - permissions : **Account** · **Cloudflare Pages** · **Edit** ;
   - ressources du compte : ton compte uniquement.
3. **Continue to summary** → **Create Token** → copier le jeton (il n'est affiché qu'une fois).

## 5. Enregistrer les informations dans GitHub
Dépôt `Jyhem2000/ShoppingList` → **Settings** → **Secrets and variables** → **Actions** :

| Onglet | Nom | Valeur |
|---|---|---|
| **Secrets** | `CLOUDFLARE_API_TOKEN` | le jeton de l'étape 4 |
| **Secrets** | `CLOUDFLARE_ACCOUNT_ID` | l'identifiant de l'étape 2 |
| **Variables** | `CF_PAGES_PROJECT` | le nom du projet de l'étape 3 (ex. `shoppinglist`) |

## 6. Vérifier
- Onglet **Actions** du dépôt → relancer le dernier workflow **CI** de la pull request (**Re-run all jobs**).
- Le job « Déploiement Cloudflare » affiche l'adresse d'aperçu (`https://phase-1-socle.<projet>.pages.dev`).
- L'ouvrir sur les téléphones et suivre la checklist de [08 § 5](08-tests-et-qualite.md#5-checklist-manuelle-sur-téléphone-fin-de-chaque-phase).

## Sécurité
- Le jeton ne donne accès qu'à Cloudflare Pages. En cas de doute, le révoquer dans **API Tokens** et en recréer un.
- Ne jamais écrire le jeton dans un fichier du dépôt (public) : uniquement dans les secrets GitHub.
