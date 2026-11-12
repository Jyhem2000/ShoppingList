# 05 — Identité visuelle

## 1. Ambiance

Un **thème sombre unique, franchement « dark mode »** : fond quasi noir et neutre (gris très foncé), et **deux couleurs** réservées aux éléments d'interface : le **violet** (couleur principale) et l'**or** (couleur secondaire) ; des touches de couleurs douces par rayon pour la variété, des icônes colorées, des coins arrondis généreux, des animations souples, de petits sons et des vibrations là où c'est possible.

Pas de thème clair, pas de sélecteur de thème.

## 2. Couleurs

### Design system : couleurs de base (tokens CSS)

Définis une seule fois dans `src/styles/index.css` ; les composants n'utilisent que ces noms (classes Tailwind `bg-surface`, `text-primary`…), jamais de valeur en dur.

| Rôle                   | Token                | Valeur    | Usage                                                                                                                                  |
| ---------------------- | -------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Fond 1                 | `--bg`               | `#0f0f12` | Fond de l'app (gris quasi noir, neutre)                                                                                                |
| Fond 2                 | `--surface`          | `#18181d` | Cartes, lignes, panneaux, barre d'onglets                                                                                              |
| Fond 3                 | `--raised`           | `#232329` | Éléments surélevés, champs de saisie, appui sur une ligne                                                                              |
| Séparateur             | `--border`           | `#2e2e36` | Bordures, séparateurs                                                                                                                  |
| Texte principal        | `--text`             | `#ededf0` | Libellés, contenu                                                                                                                      |
| Texte secondaire       | `--text-muted`       | `#a3a3ad` | Descriptions, notes, titres de section                                                                                                 |
| **Couleur principale** | `--primary`          | `#a37ef2` | **Violet** : tout ce qui s'actionne (boutons, interrupteurs, liens, focus) et les **titres d'écran**                                   |
|                        | `--primary-strong`   | `#8a62e2` | Violet appuyé (bouton pressé)                                                                                                          |
|                        | `--on-primary`       | `#140d22` | Texte sur fond violet                                                                                                                  |
| **Couleur secondaire** | `--secondary`        | `#f5c451` | **Or** : les repères — icônes d'interface, onglet actif (icône, libellé et trait au-dessus), quantités, progression, numéro de version |
|                        | `--secondary-strong` | `#e0a92e` | Or appuyé                                                                                                                              |
|                        | `--on-secondary`     | `#1d1606` | Texte sur fond or                                                                                                                      |
| Succès                 | `--success`          | `#2ec27e` | Vert franc : coche, rayon terminé, message de réussite                                                                                 |
| Information            | `--info`             | `#3d9bff` | Bleu : message d'information (conversion automatique…)                                                                                 |
| Attention              | `--warning`          | `#ff7b3a` | Orange : « À récupérer », catégories non rattachées                                                                                    |
| Danger                 | `--danger`           | `#f2484f` | Rouge franc : suppression, message d'erreur                                                                                            |

Règles :

- les fonds restent **neutres** (aucune teinte violette) ;
- **violet = action** : boutons (plein pour l'action principale de l'écran, « tonal » ou contour pour les autres), interrupteurs, liens ;
- **or = repère** : icônes hors boutons, onglet actif, quantités, progression ;
- **une icône dans un bouton prend la couleur du texte du bouton** ; un bouton fait d'une icône seule (▶ « écouter ») est en **or** ;
- les icônes d'articles (dessinées pour l'app) gardent leurs propres couleurs.

### Palette des rayons et catégories

Couleurs douces, utilisées en pastille, en liseré d'en-tête de rayon et en fond très atténué (≈ 15 %) des monogrammes.

| Nom     | Valeur    | Exemple d'usage par défaut |
| ------- | --------- | -------------------------- |
| sauge   | `#8fcf9c` | Fruits & Légumes           |
| blé     | `#e6c27a` | Boulangerie                |
| corail  | `#f29b85` | Boucherie                  |
| canard  | `#6fc3d0` | Poissonnerie               |
| rose    | `#f2a7c3` | Charcuterie & Traiteur     |
| crème   | `#f3e3a1` | Crèmerie                   |
| ambre   | `#f0b35e` | Fromages                   |
| terre   | `#c9a27e` | Épicerie salée             |
| prune   | `#d38fc4` | Épicerie sucrée            |
| ciel    | `#8fb2f2` | Boissons                   |
| glacier | `#a5e1f0` | Surgelés                   |
| lilas   | `#b9a4f0` | Hygiène                    |
| ardoise | `#9aa7bd` | Entretien & Maison         |
| gris    | `#85858f` | Non classé / Autres        |

> Contrastes à vérifier pendant la phase design (objectif WCAG AA : 4,5:1 pour le texte, 3:1 pour les éléments graphiques).

## 3. Typographie

- **Plus Jakarta Sans** (moderne, nette, chaleureuse sans être enfantine) — licence libre (OFL), **embarquée dans l'app** (pas de chargement depuis Google pour rester hors ligne). Nunito, trop arrondie, a été écartée.
- Chiffres à chasse fixe pour les quantités (`font-variant-numeric: tabular-nums`).
- Tailles : titres d'écran 24 px extra-gras en violet ; titres de section 12 px en capitales (texte secondaire) ; **en-tête de rayon 18 px extra-gras** dans la couleur du rayon ; **lignes d'article 16 px**, jamais plus grandes que l'en-tête de leur rayon, y compris en mode courses (lisibilité assurée par la hiérarchie et des lignes de 48 px) ; descriptions 14 px.

## 4. Icônes

### Deux familles

| Usage                               | Choix                                             | Style                                                                                                    |
| ----------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Interface (onglets, boutons, menus) | **Lucide** (licence ISC, gratuite)                | Trait fin, monochrome, couleur du texte                                                                  |
| Catégories et rayons                | **Lucide**                                        | Trait, dans la couleur de la catégorie ou du rayon (sur fond atténué de cette couleur dans le catalogue) |
| Articles, recettes                  | **Icônes dessinées pour l'app** (une par article) | Plat, coloré, doux                                                                                       |

Les icônes colorées sont réservées aux articles : on les repère d'un coup d'œil, et les catégories et rayons, plus sobres, structurent sans leur faire concurrence (choix du 9 novembre 2026, après essai dans la maquette). Une catégorie ou un rayon stocke le nom de son icône Lucide (`apple`) ; la liste des icônes proposées est dans `src/icons/lucide.ts`. Lucide n'a pas d'icône de fromage : un triangle en tient lieu.

### Icônes dessinées pour l'app

Décision du 9 novembre 2026, après essai dans la maquette : **toutes les icônes d'articles sont dessinées pour l'app**, une par article du catalogue (236), dans un style plat inspiré de Fluent Emoji (grille 32 × 32, aplats, une ombre et un reflet). Cohérence partout, et plus d'article sans icône.

- Source : `src/icons/drawn/<clé de l'article>.svg`. Vite les réunit au build dans le pack (`src/icons/packData.ts`) ; libellé et mots-clés viennent de l'article de même clé (nom, alias, types), et l'entrée garde sa catégorie (`c`).
- Chaque article pointe sur son icône (`"icon": "framboises"`) ; le dictionnaire de mots-clés (06 § 5) aussi, pour les articles créés par l'utilisateur.
- Les icônes se relisent dans la maquette (`#/dev/ui`, hors production).

Règles de dessin, tirées des relectures (à appliquer à toute nouvelle icône) :

- plusieurs objets qui se chevauchent : un **filet sombre** (couleur `--surface`) détoure celui de devant ;
- dans une corbeille, les produits sont **dedans** (fond de corbeille derrière, bord devant), jamais en lévitation ;
- **fidèle au produit** : framboise creuse et sans queue, fruit de la passion marron, pêche unie et sans sillon, abricot pas tout à fait rond, melon charentais entier, tranche du même diamètre que le légume ;
- un lien ou une étiquette **contraste** avec ce qu'il tient (pas de violet sur du vert) ; un dégradé est permis quand il aide (base pâle des asperges) ;
- proportions proches de l'emoji connu (aubergine allongée, courgette longue à queue courte).
- contours lisses (une mangue ne doit pas sembler cabossée), aplats nets plutôt que taches de couleur ;
- un légume coupé montre sa **face coupée au bout** du légume (et une rondelle à part), jamais un disque collé dessus ;
- rien ne dépasse du cadre 32 × 32 (feuilles comprises).
- les détails intérieurs (traits, rayures, reflets) restent **dans** la forme ; le filet sombre ne sépare que des objets distincts, jamais deux parties d'un même objet (tête de brioche) ;
- un générique ne montre que son produit type, dans son support (« Poisson au choix » : un poisson dans le bac, sans crevette) ;
- une viennoiserie ou un produit fourré se montre **coupé** quand c'est l'intérieur qui le fait reconnaître (pain au chocolat).
- **sobriété** : un seul produit (un œuf, pas une boîte), aucun accessoire (cuillère, couvercle, blini, part en trop), aucun socle sous un fromage ; bols petits ; croûte d'un fromage sur le petit côté de la part ; forme la plus parlante (nid de tagliatelles, coquillettes, chèvre cendré, une sardine).
- bols sans pied, contenant qui **contraste** avec son contenu (pas de bol blanc pour du riz) ; part de fromage = dessus et face coupée, la croûte n'apparaissant qu'en liseré sur le petit côté ; fromage rond entamé avec une encoche nette ; formes organiques plutôt que géométriques (œuf plus large à la base, pâte irrégulière).

### Le pack d'icônes : pourquoi on n'est jamais bloqué

- `src/icons/packData.ts` réunit les dessins au build (`import.meta.glob`) : aucun fichier généré à versionner, ni étape à lancer à la main, et le build n'a besoin d'aucun réseau. Le pack forme un fichier à part, chargé à la demande.
- Le pack est stocké par l'app et mis en cache pour le hors-ligne dès la première ouverture.
- Un article ne stocke que le **nom** de son icône (`framboises`).
- **Ajouter un article en plein magasin, hors ligne** : l'app cherche une icône dans le pack via le dictionnaire de mots-clés (06 § 5) → affichage immédiat. Rien à télécharger, aucun build nécessaire.
- Chaque icône du pack a un **libellé et des mots-clés français** (nom, alias et types de son article) pour la recherche dans le sélecteur (G5).

### Cascade d'affichage d'une icône d'article

```
1. Icône choisie par l'utilisateur ou définie dans le catalogue de départ
2. Icône devinée par le dictionnaire de mots-clés
3. Icône Lucide de la catégorie de l'article, dans sa couleur (si l'utilisateur l'a activé dans la fiche catégorie)
4. Monogramme
```

### Monogramme

Carré arrondi, fond = couleur de la catégorie à ~15 %, 1 ou 2 lettres en gras de la couleur de la catégorie. `Sauce nuoc-mâm` → `SN`, `Lessive` → `L`. Même taille que les icônes : visuellement homogène.

## 5. Composants clés

1. **Ligne d'article** : **indentée** sous l'en-tête de son rayon · icône 28 px · libellé 16 px · types acceptés / note en `--text-muted` · quantité + unité en or (`--secondary`), alignée à droite · toute la ligne cliquable. Hauteur 44 px, 48 px en mode courses ; ligne cochée barrée, icône grisée avec une petite coche verte.
2. **Bloc de rayon** : la couleur du rayon forme la **bordure gauche de tout le bloc** (en-tête et articles) ; en-tête au fond teinté de la couleur (~10 %) : icône 28 px · libellé 18 px · compteur · chevron ; repliable. Rayon terminé en mode courses : libellé vert et coche à la place du compteur. 16 px d'écart entre deux rayons.
3. **Barre d'ajout** : fond `--raised`, en pilule, loupe or, bouton « + » violet, flottante au-dessus de la barre d'onglets ; saisie en 16 px (pas de zoom automatique sur iPhone).
4. **Carte du catalogue** : grande icône (56 px), libellé sur 2 lignes max, pastille de quantité or si dans la liste, entourée d'un fin liseré de la couleur de la carte pour rester lisible sur une icône jaune.
5. **Boutons** : **deux styles seulement** — principal (fond violet `--primary`, texte `--on-primary`, hauteur ≥ 48 px en taille `lg`) pour l'action principale de l'écran, et secondaire (contour violet) pour les autres actions. Variantes : suppression (style principal en rouge), bouton fait d'une icône seule (▶) en or. **Appui bien visible** : le bouton rétrécit (95 %) et fonce pendant le toucher.
6. **Panneaux glissants** : fond `--surface`, poignée en haut, coins supérieurs arrondis. Une fiche à consulter d'abord (ligne, quantité, création d'article) s'ouvre **sans focus sur un champ** : le clavier ne cache pas le reste.
7. **Messages (toasts)** : en bas, au-dessus de la barre d'ajout, 5 secondes, un seul à la fois. Quatre tons, avec bordure gauche et icône de leur couleur : **réussite** (`--success` : « 3 lignes ajoutées »), **information** (`--info` : « Converti en 1,2 kg — Annuler »), **attention** (`--warning` : « Rayon Crèmerie déjà passé », phase 5), **erreur** (`--danger` : enregistrement impossible). Ton neutre pour un retrait annulable (« Pommes : retiré de la liste — Annuler »).

## 6. Animations

Bibliothèque **Motion**.

- Ajout : la ligne apparaît à sa place dans son rayon avec un léger rebond ; la ligne existante « pulse » si l'article était déjà là.
- Cocher : trait barré animé, puis glissement vers le bas ou disparition.
- Rayon terminé : repli + coche menthe.
- Panneaux : glissement depuis le bas avec ressort.
- Réglage **Animations** (H1) : _Automatique_ (suit `prefers-reduced-motion` du système) · _Toujours_ (ignore le réglage système) · _Jamais_.

## 7. Sons

### Sons (H6)

Petits sons courts, doux et discrets, **à volume bas** (un son léger, jamais plus fort que le reste du téléphone). Deux styles, au choix dans Réglages → Sons (« Style des sons ») :

- **Sons enregistrés** (par défaut) : fichiers WAV de **Kenney Interface Sounds** (licence **CC0**, domaine public, usage commercial libre, mention facultative, créditée dans l'écran Licences), dans `public/sounds/`, mis en cache pour le hors-ligne ;
- **Sons générés** : synthétisés par le code (aucun fichier), conservés tant que le choix définitif n'est pas fait.

| Action             | Son enregistré (fichier Kenney d'origine) | Son généré               |
| ------------------ | ----------------------------------------- | ------------------------ |
| Ajout d'un article | `drop_001`                                | « pop » léger            |
| Cocher             | `click_003`                               | « tic » court            |
| Rayon terminé      | `confirmation_001`                        | petit carillon (2 notes) |
| Courses terminées  | `confirmation_002`                        | carillon montant         |
| Suppression        | `close_001`                               | glissement descendant    |
| Action impossible  | `back_002`                                | son sourd bref           |

Lecture via la **Web Audio API**. Sur iPhone, le moteur audio peut rester bloqué après un passage en arrière-plan : il est fermé quand l'app est masquée et recréé au son suivant.

Points d'attention :

- sur iPhone, le son ne peut démarrer qu'après un premier geste de l'utilisateur (le premier tap suffit) ;
- **mode silencieux** : sur iPhone, la session audio est déclarée « ambient » (Audio Session API, iOS 17+) : les sons sont coupés quand le bouton silencieux est activé et n'interrompent pas la musique en cours. Android ne permet pas de connaître le mode silencieux depuis le web : les sons suivent le volume multimédia ;
- réglage **Sons** général, **style des sons** et **un interrupteur par son**, chacun pouvant être écouté (Réglages → Fonctionnalités → Sons).

### Vibrations — non retenues

Pas de vibrations (H7 retirée) : l'API Vibration n'existe pas sur iPhone, et l'astuce non officielle de retour haptique (interrupteur natif masqué) n'a rien produit sur l'iPhone de test. Plutôt que d'avoir une app différente selon le téléphone, elles sont retirées partout.

## 8. Icône de l'app et écran de démarrage

Icône d'écran d'accueil : **caddie violet (`--primary`) portant une coche or (`--secondary`)**, sur fond plein `--surface`, détourée d'un filet de fond qui la détache du caddie. Source unique `public/logo.svg` (512 × 512) ; `npm run icons` en tire toutes les tailles (`pwa-assets.config.ts`) :

- icônes standard (64, 192, 512) et favicon : carrées, fond plein, **sans marge transparente** ;
- iPhone (`apple-touch-icon` 180 × 180) : fond plein jusqu'aux bords, sans coins arrondis (iOS les arrondit lui-même) ;
- Android (`maskable` 512 × 512) : marge de 10 % de la couleur du fond, pour que le dessin tienne dans la découpe du téléphone (cercle, carré arrondi…).

Écran de démarrage aux couleurs `--bg`.
