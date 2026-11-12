/** Tous les textes de l'interface (docs : interface en français, textes centralisés). */
export const fr = {
  appName: "ShoppingList",
  /** Noms donnés aux données créées au premier lancement (docs/04 § 2.11). */
  defaults: {
    listName: "Courses",
    storeName: "Mon supermarché",
    unsortedAisle: "Non classé",
  },
  tabs: {
    list: "Liste",
    catalog: "Catalogue",
    settings: "Réglages",
  },
  list: {
    loading: "Chargement…",
    emptyTitle: "Ta liste est vide",
    emptyText:
      "Ajoute un article avec la barre du bas (« 2 baguettes, du beurre ») ou parcours le catalogue.",
    openCatalog: "Ouvrir le catalogue",
    chooseList: "Changer de liste",
    chooseStore: "Changer de magasin",
    menu: "Actions sur la liste",
    addPlaceholder: "Ajouter un article…",
    addLabel: "Ajouter",
    create: (name: string) => `Créer « ${name} »`,
    inList: (quantity: string) => `Dans la liste : ${quantity}`,
    typesOne: (type: string) => `${type} uniquement`,
    typesMany: (types: string[]) => types.join(" ou "),
    removed: (name: string) => `${name} : retiré de la liste`,
    removedMany: (count: number) =>
      count > 1 ? `${count} lignes retirées` : "1 ligne retirée",
    undo: "Annuler",
    saveError: "Impossible d'enregistrer. Réessaie dans un instant.",
    converted: (quantity: string) => `Converti en ${quantity}`,
    swipeHint: "Glisser vers la gauche pour retirer",
    exists: {
      text: (quantity: string) => `Déjà dans la liste : ${quantity}.`,
      add: (quantity: string) => `Ajouter ${quantity}`,
      nothing: "Ne rien faire",
      incompatible: (existing: string, added: string) =>
        `Déjà dans la liste : ${existing}. Unités différentes de ${added}.`,
      keep: "Garder l'existant",
      replace: (quantity: string) => `Remplacer par ${quantity}`,
      asNote: "Ajouter en note",
    },
    createSheet: {
      title: "Nouvel article",
      name: "Nom",
      category: "Catégorie",
      unit: "Unité",
      submit: "Créer et ajouter",
      cancel: "Annuler",
      oneOff: "Juste cette fois",
      oneOffHint:
        "Pour un achat ponctuel (une friteuse…) : pas besoin de catégorie, il ne s'ajoute pas au catalogue.",
      oneOffOn:
        "Rangé dans « Achats ponctuels » pour le retrouver plus tard. Tu pourras en faire un article normal en lui donnant une catégorie.",
    },
    keepOneOff: {
      hint: "Achat ponctuel. Pour le garder comme article normal, choisis sa catégorie.",
      category: "Catégorie",
      choose: "Choisir une catégorie",
      keep: "Garder dans le catalogue",
      done: (name: string, category: string) =>
        `« ${name} » rangé dans ${category}`,
    },
    unitGroups: {
      mass: "Poids",
      volume: "Volume",
      container: "Contenants",
      count: "À l'unité",
      kitchen: "Cuisine",
    },
    line: {
      quantity: "Quantité",
      less: "Diminuer",
      more: "Augmenter",
      unit: "Unité",
      types: "Types acceptés",
      anyType: "Peu importe",
      newType: "Nouveau type",
      addType: "Ajouter le type",
      note: "Note",
      notePlaceholder: "bio, la marque verte…",
      remove: "Retirer de la liste",
      done: "Terminé",
    },
    menuSheet: {
      title: "Liste",
      rename: "Renommer",
      duplicate: "Dupliquer",
      addLists: "Ajouter une autre liste",
      removeChecked: "Retirer les articles cochés",
      clear: "Vider la liste",
      delete: "Supprimer la liste",
      manage: "Toutes mes listes",
      confirmClear: "Vider la liste ?",
      confirmClearText:
        "Toutes les lignes seront retirées. Tu pourras annuler juste après.",
      confirmDelete: (name: string) => `Supprimer « ${name} » ?`,
      confirmDeleteText:
        "La liste et toutes ses lignes seront supprimées définitivement.",
      cancel: "Annuler",
      copyName: (name: string) => `${name} (copie)`,
      renameTitle: "Renommer la liste",
      save: "Enregistrer",
    },
    lists: {
      title: "Mes listes",
      reorder: (name: string) => `Déplacer ${name}`,
      newList: "Nouvelle liste",
      newTitle: "Nouvelle liste",
      name: "Nom de la liste",
      include: "Y ajouter le contenu de",
      create: "Créer la liste",
    },
    merge: {
      title: "Ajouter une autre liste",
      sources: "Listes à ajouter",
      lines: "Lignes",
      nothing: "Choisis une ou plusieurs listes.",
      empty: "Ces listes n'ont rien à ajouter.",
      isNew: "à ajouter",
      merged: (quantity: string) => `→ ${quantity}`,
      apply: (count: number) =>
        count > 1 ? `Ajouter ${count} lignes` : "Ajouter 1 ligne",
      done: (count: number) =>
        count > 1 ? `${count} lignes ajoutées` : "1 ligne ajoutée",
    },
    stores: {
      title: "Magasin",
      newStore: "Nouveau magasin",
      newTitle: "Nouveau magasin",
      template: "Rayons de départ",
      name: "Nom du magasin",
      create: "Créer le magasin",
      later: "Les rayons se modifient dans une prochaine version.",
    },
    unavailableLastTime: "Introuvable la dernière fois",
  },
  shopping: {
    start: "C'est parti",
    resume: "Reprendre les courses",
    reopen: (time: string) => `Rouvrir les courses (${time})`,
    startTitle: "Faire les courses",
    startText: "Dans quel magasin ?",
    go: "C'est parti",
    quit: "Quitter le mode courses (les courses restent ouvertes)",
    progress: (checked: number, total: number) => `${checked} / ${total}`,
    progressLabel: (checked: number, total: number) =>
      `${checked} articles dans le caddie sur ${total}`,
    finish: "Terminer",
    finishLong: "Terminer les courses",
    finishTitle: "Terminer les courses ?",
    finishText: (count: number) =>
      count > 0
        ? `${count === 1 ? "Il reste 1 article à prendre : il restera" : `Il reste ${count} articles à prendre : ils resteront`} dans la liste.`
        : "Les articles cochés quittent la liste.",
    finishConfirm: "Terminer",
    cancel: "Continuer les courses",
    pickUp: "À récupérer",
    aislePassed: (aisle: string) =>
      `Rayon ${aisle} déjà passé : il t'attend dans « À récupérer ».`,
    current: "rayon en cours",
    swipeHint:
      "Glisser vers la gauche : introuvable · appui long : changer de rayon",
    unavailable: "Introuvable",
    unavailableToast: (name: string) => `${name} : introuvable`,
    screenOnFailed:
      "L'écran pourra se mettre en veille : ce téléphone ne permet pas de le garder allumé.",
    allDone: "Tout est dans le caddie !",
    added: {
      title: (name: string) => `${name} ajouté`,
      inAisle: (aisle: string) => `Rangé dans le rayon ${aisle}.`,
      alreadyTaken: "Je l'ai déjà dans le caddie",
      otherAisle: "Il est dans un autre rayon…",
      ok: "OK, à prendre",
    },
    move: {
      title: (name: string) => `Déplacer ${name}`,
      text: "Vers quel rayon de ce magasin ?",
      withCategory: "Où l'on trouve sa catégorie",
      others: "Autres rayons",
      here: "rayon actuel",
      scopeTitle: (aisle: string) => `Vers ${aisle}`,
      scopeText: "Pour les prochaines courses dans ce magasin :",
      onlyArticle: (name: string) => `Seulement ${name}`,
      wholeCategory: (category: string) => `Toute la catégorie ${category}`,
      done: (name: string, aisle: string) => `${name} → ${aisle}`,
    },
    when: { today: "aujourd'hui", yesterday: "hier" },
    stale: {
      title: (when: string) => `Tu as terminé tes courses de ${when} ?`,
      text: "Elles sont restées ouvertes.",
      finish: "Terminer",
      resume: "Continuer",
    },
    recap: {
      title: "Courses terminées",
      bought: (count: number) =>
        count > 1
          ? `${count} articles achetés`
          : count === 1
            ? "1 article acheté"
            : "Aucun article acheté",
      unavailable: (count: number) =>
        count > 1
          ? `${count} introuvables, restés dans la liste`
          : "1 introuvable, resté dans la liste",
      duration: (duration: string) => `Durée : ${duration}`,
      learned: "Ordre des rayons mis à jour pour ce magasin.",
      back: "Retour à la liste",
      reopen: "Rouvrir les courses",
      missing: "Ces courses ne sont plus disponibles.",
    },
  },
  catalog: {
    title: "Catalogue",
    search: "Chercher un article",
    favorites: "Favoris",
    usual: "Habituels",
    categories: "Catégories",
    noResult: "Aucun article trouvé.",
    back: "Catalogue",
    quantityTitle: (name: string) => name,
    remove: "Retirer de la liste",
    done: "Terminé",
    count: (count: number) =>
      count > 1 ? `${count} articles` : `${count} article`,
  },
  settings: {
    title: "Réglages",
    sectionFeatures: "Fonctionnalités",
    sectionApp: "Application",
    sectionList: "Liste",
    simplify: {
      title: "Simplifier les quantités",
      hint: "1200 g devient 1,2 kg, 150 cl devient 1,5 L.",
    },
    about: "À propos",
    unavailable: "Non disponible sur ce téléphone",
    sounds: {
      title: "Sons",
      hint: "Petits sons quand tu ajoutes, coches ou termines un rayon.",
      stateOff: "Désactivés",
      stateAll: "Activés",
      stateSome: (on: number, total: number) => `${on} sons sur ${total}`,
    },
    keepScreenOn: {
      title: "Écran allumé pendant les courses",
      hint: "L'écran ne se met pas en veille en mode courses.",
    },
  },
  soundsPage: {
    title: "Sons",
    master: "Sons de l'app",
    silentIos:
      "Le mode silencieux de l'iPhone a toujours le dernier mot : quand il est activé, aucun son n'est joué, même si les sons de l'app sont activés.",
    silentOther:
      "Le volume des sons est celui du multimédia du téléphone : baisse-le pour les rendre plus discrets.",
    listen: (label: string) => `Écouter « ${label} »`,
    styleTitle: "Style des sons",
    styles: { recorded: "Sons enregistrés", generated: "Sons générés" },
    stylesHint: {
      recorded: "Doux et naturels.",
      generated: "Petits sons synthétisés par l'app.",
    },
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
  devUi: {
    title: "Maquette",
    link: "Maquette des composants",
    linkHint: "Hors production : couleurs, icônes, sons",
    intro:
      "Aperçu des éléments de l'app avec de fausses données, pour valider le rendu sur le téléphone.",
    colors: "Couleurs",
    typography: "Typographie",
    typeTitle: "Titre d'écran",
    typeBody: "Texte d'une ligne de liste",
    typeMuted: "Texte secondaire : notes, types, descriptions",
    buttons: "Boutons",
    letsGo: "C'est parti",
    outline: "Secondaire",
    delete: "Supprimer",
    listen: "Écouter",
    toggle: "Interrupteur",
    list: "Liste triée par rayon",
    shopping: "Mode courses",
    shoppingHint:
      "Touche une ligne pour la cocher : elle glisse en bas du rayon.",
    catalog: "Catalogue",
    sheet: "Panneau",
    openSheet: "Ouvrir le panneau",
    sheetTitle: "Lait",
    sheetText: "Déjà dans la liste : 6 litres.",
    sheetAdd: "Ajouter 1 litre",
    sheetNothing: "Ne rien faire",
    sounds: "Sons",
    soundsHint:
      "Chaque son dans les deux styles. Le style utilisé par l'app se choisit dans Réglages → Sons.",
    soundRecorded: "Enregistré",
    soundGenerated: "Généré",
    icons: (count: number) => `Icônes d'articles (${count})`,
    iconsHint:
      "Le pack embarqué dans l'app, disponible hors ligne. Un monogramme remplace les icônes manquantes.",
    addPlaceholder: "Ajouter un article…",
    add: "Ajouter",
    added: (text: string) => `« ${text} » ajouté (maquette)`,
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
        version: "0.3.0",
        date: "2026-11-09",
        items: [
          "Nouvelle apparence : thème sombre violet et or, nouvelle police, icônes d'articles en couleur et sons plus doux.",
          "La barre d'onglets reste bien en bas de l'écran dès l'ouverture sur iPhone, et le titre de chaque écran reste visible en haut.",
          "Les données de départ sont prêtes : 238 articles courants, leurs catégories et le magasin « Mon supermarché ». Les listes arrivent dans la prochaine version.",
        ],
      },
      {
        version: "0.1.0",
        date: "2026-11-08",
        items: [
          "L'app s'installe sur l'écran d'accueil de l'iPhone et d'Android, en plein écran, et fonctionne hors ligne.",
          "Au premier lancement, un écran explique comment l'installer selon ton téléphone.",
          "Réglages → Fonctionnalités : sons (tous ou un par un) et écran allumé pendant les courses.",
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
    applying: "Mise à jour…",
  },
} as const;
