/** Tous les textes de l'interface (docs : interface en français, textes centralisés). */
export const fr = {
  appName: "ShoppingList",
  tabs: {
    list: "Liste",
    catalog: "Catalogue",
    settings: "Réglages",
  },
  list: {
    title: "Courses",
    emptyTitle: "Ta liste arrive bientôt",
    emptyText:
      "L'ajout d'articles et le tri par rayon seront disponibles dans une prochaine version.",
  },
  catalog: {
    title: "Catalogue",
    emptyTitle: "Le catalogue arrive bientôt",
    emptyText: "Tu pourras bientôt parcourir les articles par catégorie.",
  },
  settings: {
    title: "Réglages",
    sectionFeatures: "Fonctionnalités",
    sectionApp: "Application",
    about: "À propos",
    unavailable: "Non disponible sur ce téléphone",
    sounds: {
      title: "Sons",
      hint: "Petits sons quand tu ajoutes, coches ou termines un rayon.",
      stateOff: "Désactivés",
      stateAll: "Activés",
      stateSome: (on: number, total: number) => `${on} sons sur ${total}`,
    },
    haptics: {
      title: "Vibrations",
      hint: "Léger retour quand tu coches un article ou termines un rayon.",
      hintIos: "Léger retour haptique (expérimental sur iPhone).",
      test: "Tester les vibrations",
    },
    keepScreenOn: {
      title: "Écran allumé pendant les courses",
      hint: "L'écran ne se met pas en veille en mode courses.",
    },
  },
  soundsPage: {
    title: "Sons",
    master: "Sons",
    silentIos: "Coupés quand l'iPhone est en mode silencieux.",
    silentOther: "Suivent le volume multimédia du téléphone.",
    eachTitle: "Chaque son",
    listen: (label: string) => `Écouter « ${label} »`,
    events: {
      add: "Ajout d'un article",
      check: "Article coché",
      aisleDone: "Rayon terminé",
      done: "Courses terminées",
      remove: "Suppression",
      error: "Action impossible",
    },
  },
  about: {
    title: "À propos",
    tagline:
      "Une liste de courses qui se range toute seule dans l'ordre de ton parcours en magasin.",
    version: "Version",
    build: "Compilée le",
    source: "Code source",
    licences: "Licences",
    licencesHint: "Bibliothèques utilisées par l'app",
    releaseNotes: "Nouveautés",
    releaseNotesHint: "Ce qui a changé à chaque version",
    channels: {
      production: "",
      preprod: "préproduction",
      preview: "aperçu",
      dev: "développement",
    } as Record<string, string>,
    updates: {
      check: "Rechercher une mise à jour",
      checking: "Recherche…",
      upToDate: "L'app est à jour.",
      available:
        "Une nouvelle version est prête : touche « Mettre à jour » en haut de l'écran.",
      failed: "Pas de réponse du serveur. Vérifie ta connexion et réessaie.",
      unavailable:
        "Mises à jour indisponibles dans cette version de développement.",
    },
  },
  licences: {
    title: "Licences",
    intro:
      "ShoppingList est construite avec ces bibliothèques libres. Touche une ligne pour lire sa licence.",
    unknown: "licence non précisée",
    noText: "Texte de licence non fourni par la bibliothèque.",
    unavailable: "Liste disponible dans la version installée de l'app.",
  },
  /**
   * Nouveautés de chaque version, écrites pour l'utilisateur (pas les messages de commit).
   * La plus récente en premier ; `npm run release` refuse de publier une version absente d'ici.
   */
  releaseNotes: {
    title: "Nouveautés",
    version: (version: string) => `Version ${version}`,
    versions: [
      {
        version: "0.1.0",
        date: "2026-11-08",
        items: [
          "L'app s'installe sur l'écran d'accueil de l'iPhone et d'Android, en plein écran, et fonctionne hors ligne.",
          "Au premier lancement, un écran explique comment l'installer selon ton téléphone.",
          "Réglages → Fonctionnalités : sons (tous ou un par un), vibrations et écran allumé pendant les courses.",
          "Un bandeau propose la nouvelle version quand elle est disponible.",
        ],
      },
    ],
  },
  install: {
    title: "Installe l'app",
    intro:
      "ShoppingList s'utilise comme une application installée sur ton écran d'accueil : plein écran, hors ligne, et tes données restent sur ton téléphone.",
    iosWarning:
      "Sur iPhone, l'app installée et le navigateur ne partagent pas leurs données : installe-la avant de commencer.",
    iosChromeSteps: [
      "Touche le bouton Partager dans la barre d'adresse de Chrome.",
      "Choisis « Ajouter à l'écran d'accueil ».",
      "Touche « Ajouter », puis ouvre l'app depuis son icône.",
    ],
    iosSafariSteps: [
      "Touche le bouton Partager en bas de l'écran.",
      "Choisis « Sur l'écran d'accueil ».",
      "Touche « Ajouter », puis ouvre l'app depuis son icône.",
    ],
    androidButton: "Installer l'application",
    androidManual:
      "Si le bouton reste grisé : menu ⋮ de Chrome → « Installer l'application ».",
    otherText:
      "Utilise le menu de ton navigateur pour installer l'application, si elle le permet.",
    continue: "Continuer dans le navigateur",
  },
  update: {
    available: "Nouvelle version disponible",
    availableVersion: (version: string) => `Version ${version} disponible`,
    action: "Mettre à jour",
  },
} as const;
