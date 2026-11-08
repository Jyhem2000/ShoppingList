# 05 — Identité visuelle

## 1. Ambiance
Un **thème sombre unique**, chaleureux plutôt que technique : fond violet très profond, accents **violet pâle** et **or**, des touches de couleurs douces par rayon pour la variété, des icônes colorées, des coins arrondis généreux, des animations souples, de petits sons et des vibrations là où c'est possible.

Pas de thème clair, pas de sélecteur de thème.

## 2. Couleurs

### Couleurs de base (tokens CSS)
| Token | Valeur | Usage |
|---|---|---|
| `--bg` | `#131019` | Fond de l'app |
| `--surface` | `#1c1824` | Cartes, lignes, panneaux |
| `--surface-2` | `#262131` | Éléments surélevés, champs de saisie |
| `--border` | `#352e44` | Séparateurs |
| `--text` | `#eeeaf5` | Texte principal |
| `--text-muted` | `#a69db8` | Texte secondaire (notes, catégories) |
| `--primary` | `#cdb4f5` | **Violet pâle** : éléments actifs, onglet sélectionné, liens, focus |
| `--primary-strong` | `#a98be0` | Variante appuyée |
| `--primary-soft` | `#cdb4f5` à 12 % | Fond des éléments sélectionnés |
| `--gold` | `#f5c451` | **Or** : action principale (« C'est parti », « Ajouter »), quantités, progression |
| `--gold-strong` | `#e0a92e` | Variante appuyée |
| `--on-gold` | `#1d1606` | Texte sur fond or |
| `--done` | `#7fd4a8` | Vert menthe : coche, rayon terminé |
| `--warning` | `#ffa463` | Orange : « À récupérer », catégories non rattachées |
| `--danger` | `#ff7a85` | Suppression |

Répartition : **violet pâle = navigation et sélection**, **or = action et quantités**. L'or reste rare pour garder son impact (un bouton principal par écran).

### Palette des rayons et catégories
Couleurs douces, utilisées en pastille, en liseré d'en-tête de rayon et en fond très atténué (≈ 15 %) des monogrammes.

| Nom | Valeur | Exemple d'usage par défaut |
|---|---|---|
| sauge | `#8fcf9c` | Fruits & légumes |
| blé | `#e6c27a` | Boulangerie |
| corail | `#f29b85` | Boucherie |
| canard | `#6fc3d0` | Poissonnerie |
| rose | `#f2a7c3` | Charcuterie & traiteur |
| crème | `#f3e3a1` | Crèmerie |
| ambre | `#f0b35e` | Fromages |
| terre | `#c9a27e` | Épicerie salée |
| prune | `#d38fc4` | Épicerie sucrée |
| ciel | `#8fb2f2` | Boissons |
| glacier | `#a5e1f0` | Surgelés |
| lilas | `#b9a4f0` | Hygiène |
| ardoise | `#9aa7bd` | Entretien & maison |
| gris | `#7d7590` | Non classé / Autres |

> Contrastes à vérifier pendant la phase design (objectif WCAG AA : 4,5:1 pour le texte, 3:1 pour les éléments graphiques).

## 3. Typographie
- **Nunito** (ronde, chaleureuse, très lisible) — licence libre (OFL), **embarquée dans l'app** (pas de chargement depuis Google pour rester hors ligne). Alternative : *Plus Jakarta Sans*.
- Chiffres à chasse fixe pour les quantités (`font-variant-numeric: tabular-nums`).
- Tailles : texte 16 px (17 px pour les lignes de liste), 18 px minimum en mode courses, titres 22-28 px.

## 4. Icônes

### Deux familles
| Usage | Choix | Style |
|---|---|---|
| Interface (onglets, boutons, menus) | **Lucide** (licence ISC, gratuite) | Trait fin, monochrome, couleur du texte |
| Articles, catégories, rayons, recettes | **Microsoft Fluent Emoji — Flat** (licence MIT, gratuite) | Plat, coloré, doux |

Le contraste UI monochrome / contenu coloré guide l'œil vers les articles.

### Le pack d'icônes : pourquoi on n'est jamais bloqué
**On n'embarque pas « une icône par article du catalogue », mais tout un pack d'icônes.**
- Au build, un script extrait du set Fluent Emoji Flat (via Iconify) **toutes les icônes pertinentes** pour des courses : alimentation, boissons, plantes, maison, hygiène, bébé, animaux… soit **~300 à 500 icônes** (quelques centaines de Ko compressés).
- Le pack est stocké par l'app et mis en cache pour le hors-ligne dès la première ouverture.
- Un article ne stocke que le **nom** de son icône (`red-apple`).
- **Ajouter un article en plein magasin, hors ligne** : l'app cherche une icône dans le pack via le dictionnaire de mots-clés (06 § 5) → affichage immédiat. Rien à télécharger, aucun build nécessaire.
- Un nouveau build n'est nécessaire que pour **élargir le pack** lui-même (rare).

Chaque icône du pack a des **mots-clés français** (issus des annotations Unicode/CLDR en français, libres de droits, complétées à la main) pour la recherche dans le sélecteur (G5).

### Cascade d'affichage d'une icône d'article
```
1. Icône choisie par l'utilisateur ou définie dans le catalogue de départ
2. Icône devinée par le dictionnaire de mots-clés
3. Icône de la catégorie de l'article (si l'utilisateur l'a activé dans la fiche catégorie)
4. Monogramme
```

### Monogramme
Carré arrondi, fond = couleur de la catégorie à ~15 %, 1 ou 2 lettres en gras de la couleur de la catégorie. `Sauce nuoc-mâm` → `SN`, `Lessive` → `L`. Même taille que les icônes : visuellement homogène.

> À vérifier au démarrage : couverture de Fluent Emoji Flat pour les emojis alimentaires les plus récents (🫚 gingembre, 🫛 petits pois…). Les manques sont couverts par le monogramme ou l'icône de catégorie.

## 5. Composants clés
1. **Ligne d'article** : icône 36-40 px · libellé · types acceptés / note en `--text-muted` · quantité + unité en `--gold`, alignée à droite · toute la ligne cliquable.
2. **En-tête de rayon** : pastille de couleur · icône · libellé · compteur ; repliable.
3. **Barre d'ajout** : fond `--surface-2`, coins très arrondis, flottante au-dessus de la barre d'onglets.
4. **Carte du catalogue** : grande icône (56 px), libellé sur 2 lignes max, pastille de quantité or si dans la liste.
5. **Bouton principal** : fond or, texte `--on-gold`, hauteur ≥ 48 px.
6. **Panneaux glissants** : fond `--surface`, poignée en haut, coins supérieurs arrondis.

## 6. Animations
Bibliothèque **Motion**.
- Ajout : la ligne apparaît à sa place dans son rayon avec un léger rebond ; la ligne existante « pulse » si l'article était déjà là.
- Cocher : trait barré animé, puis glissement vers le bas ou disparition.
- Rayon terminé : repli + coche menthe.
- Panneaux : glissement depuis le bas avec ressort.
- Réglage **Animations** (H1) : *Automatique* (suit `prefers-reduced-motion` du système) · *Toujours* (ignore le réglage système) · *Jamais*.

## 7. Sons et vibrations

### Sons (H6)
Petits sons courts, doux et discrets, cohérents entre eux (même « famille »). **Gratuits** :
- source : packs de sons d'interface sous licence **CC0** (domaine public, aucune attribution obligatoire), par exemple ceux de *Kenney* ; ou sons synthétisés directement dans le code (aucun fichier) ;
- format `.mp3` ou `.m4a` (lus partout, y compris sur iPhone), quelques Ko chacun, mis en cache pour le hors-ligne ;
- lecture via la **Web Audio API** (disponible partout, faible latence, sons préchargés).

| Action | Son |
|---|---|
| Ajout d'un article | « pop » léger |
| Cocher | « tic » court |
| Rayon terminé | petit carillon (2 notes) |
| Courses terminées | carillon montant |
| Suppression | « swoosh » discret |
| Action impossible | son sourd bref |

Points d'attention :
- sur iPhone, le son ne peut démarrer qu'après un premier geste de l'utilisateur (le premier tap suffit) ;
- respecter le mode silencieux du téléphone quand le navigateur le permet (à vérifier sur iPhone en phase 1) ;
- volume modéré par défaut ; réglage Sons activés / désactivés.

### Vibrations (H7)
- **Android (Chrome)** : vibrations courtes via l'API Vibration — cocher : 10 ms ; rayon terminé : 15-40-15 ms ; courses terminées : motif plus long ; action impossible : 2 × 30 ms.
- **iPhone** : l'API Vibration n'existe pas dans WebKit (donc ni dans Chrome iPhone, ni dans l'app installée). L'app vérifie sa présence et **ne fait rien** si elle est absente ; le réglage est masqué.
- *Piste à évaluer en phase 1* : une astuce non officielle permet de déclencher le retour haptique système sur iPhone récent (bascule d'un interrupteur natif masqué). Utilisée seulement si elle fonctionne de façon fiable, sans risque de casser l'interface.

## 8. Icône de l'app et écran de démarrage
Icône d'écran d'accueil : un caddie ou un panier stylisé, or sur fond violet profond (versions iPhone et Android, dont l'icône « adaptative » Android). Écran de démarrage aux couleurs `--bg`. À dessiner pendant la phase design (SVG, puis export PNG aux tailles iOS).
