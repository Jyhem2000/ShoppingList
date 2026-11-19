/**
 * Tous les textes de l'interface (docs : interface en français, textes centralisés).
 * Guillemets « » toujours avec une espace insécable, écrite `\u00a0`, à l'intérieur :
 * un guillemet ne se retrouve jamais seul en début ou en fin de ligne.
 */
export const fr = {
  appName: "ShoppingList",
  /** Noms donnés aux données créées au premier lancement (docs/04 § 2.11). */
  defaults: {
    listName: "Liste 1",
    unsortedAisle: "À placer",
  },
  /** Désigner un rayon : son nom, ou un titre tiré de ses catégories (docs/02 § 4). */
  aisles: {
    kicker: "Rayon",
    label: (title: string) => `Rayon ${title}`,
    into: (title: string) => `au rayon ${title}`,
    newAisle: "Nouveau rayon",
    unplaced: "À placer",
    intoUnplaced: "dans «\u00a0À placer\u00a0»",
  },
  /** Bulles d'aide montrées une seule fois (docs/03 H12). */
  help: {
    title: "Aide",
    hint: "Mode d'emploi, ce que l'app règle toute seule",
    advice: {
      title: "Le conseil pour bien démarrer",
      text: "Pendant les premières courses dans un magasin, suis le même parcours et coche chaque article au moment où tu le prends, pas tout à la caisse : l'app apprend ton magasin plus vite. Ensuite, tu pourras figer l'ordre s'il te convient.",
    },
    sections: [
      {
        title: "Remplir la liste",
        points: [
          "Tape «\u00a02 baguettes, du beurre\u00a0» dans la barre du bas : les articles s'ajoutent, rangés par catégorie. Tu peux aussi parcourir le Catalogue.",
          "Plusieurs articles d'un coup : sépare-les par une virgule ou par «\u00a0et\u00a0». À la dictée (micro du clavier), dis «\u00a0et\u00a0» (ou «\u00a0puis\u00a0», «\u00a0virgule\u00a0») entre deux articles : sinon, tout devient un seul article.",
          "Une sorte précise ? Tape-la après le nom («\u00a0pommes golden\u00a0») ou choisis-la dans les suggestions. Pour une autre sorte du même article, retouche-le : «\u00a0Une autre sorte\u00a0» ajoute une ligne à part, avec sa propre quantité.",
          "Touche une ligne pour changer sa quantité, sa note ou les types qui te vont ; glisse-la vers la gauche pour la retirer.",
          "Plusieurs listes : touche le nom de la liste en haut. Le menu ⋯ agit sur la liste affichée.",
        ],
      },
      {
        title: "Faire les courses",
        points: [
          "«\u00a0C'est parti\u00a0», puis choisis le magasin, ou donne son nom la première fois.",
          "Touche un article quand il est dans le caddie. Glisse-le s'il n'y en avait pas ; appui long pour le changer de rayon ; touche la quantité pour la corriger.",
          "Premières courses dans un magasin : tout est «\u00a0À placer\u00a0». Coche dans l'ordre où tu prends, et touche «\u00a0Rayon suivant\u00a0» quand tu changes de rayon : l'app construit ton magasin.",
          "✕ en haut : tu quittes le mode courses sans les terminer, et tu pourras les reprendre.",
        ],
      },
      {
        title: "Terminer et rouvrir",
        points: [
          "«\u00a0Terminer\u00a0» : les articles pris quittent la liste, ceux qui manquaient y restent pour la prochaine fois.",
          "Un oubli à la caisse ? «\u00a0Rouvrir les courses\u00a0», le jour même, depuis la liste.",
        ],
      },
      {
        title: "Ce que l'app règle toute seule",
        points: [
          "L'ordre des rayons et des articles, d'après l'ordre de tes coches, magasin par magasin.",
          "Le rayon d'un article : celui de sa catégorie, sauf si tu l'as rangé ailleurs.",
          "Tes habitudes : ce que tu achètes souvent remonte dans la recherche et dans «\u00a0Habituels\u00a0» du Catalogue.",
          "Si l'ordre d'un magasin te convient, fige-le : Réglages → Magasins & rayons → ton magasin → «\u00a0Apprendre l'ordre de mes courses\u00a0».",
        ],
      },
    ],
  },
  tips: {
    dismiss: "Touche l'écran pour continuer",
    place:
      "Touche un article quand il est dans le caddie : l'app retient dans quel rayon il se trouve.",
    next: "Tu changes de rayon ? Touche ici : les articles suivants iront dans le nouveau rayon.",
    stored:
      "Ton magasin est enregistré : la prochaine fois, ta liste suivra ton parcours.",
    reset: "Revoir les conseils",
    resetAction: "Revoir",
    resetHint: "Les bulles d'aide du premier usage reviendront.",
    resetDone: "Les conseils reviendront.",
  },
  sheet: { close: "Fermer", back: "Retour" },
  /** Glisser-déposer annoncé au lecteur d'écran (src/ui/sortable.ts). */
  sortable: {
    instructions:
      "Pour déplacer cet élément, appuie sur Espace ou Entrée, puis sur les flèches haut et bas. Espace ou Entrée pour le poser, Échap pour annuler.",
    picked: (name: string) => `${name} saisi.`,
    over: (name: string, position: number, count: number) =>
      `${name} : position ${position} sur ${count}.`,
    dropped: (name: string, position: number, count: number) =>
      `${name} posé en position ${position} sur ${count}.`,
    cancelled: (name: string) =>
      `Déplacement annulé : ${name} reste à sa place.`,
  },
  toast: { close: "Fermer le message" },
  /** Base de données impossible à ouvrir au démarrage (src/app/StartupError.tsx). */
  startup: {
    title: "Impossible d'ouvrir tes données",
    text: "Le stockage du téléphone est peut-être plein, ou la navigation privée l'empêche. Libère de la place ou ouvre l'app normalement, puis recharge.",
    reload: "Recharger",
  },
  /** Écran qui n'a pas pu s'ouvrir (fichier non chargé, hors ligne…). */
  screenError: {
    title: "Cet écran n'a pas pu s'ouvrir",
    text: "Vérifie ta connexion, puis recharge l'app. Tes données ne sont pas touchées.",
    reload: "Recharger",
    home: "Revenir à la liste",
  },
  search: { clear: "Effacer la recherche" },
  /** Barre de mise en forme d'un texte (src/ui/Markdown.tsx). */
  markdown: {
    toolbar: "Mise en forme",
    bold: "Gras",
    heading: "Titre",
    bullets: "Liste à puces",
    numbers: "Liste numérotée",
  },
  tabs: {
    navigation: "Navigation principale",
    list: "Liste",
    catalog: "Catalogue",
    recipes: "Recettes",
    settings: "Réglages",
  },
  list: {
    loading: "Chargement…",
    emptyTitle: "Ta liste est vide",
    emptyText:
      "Ajoute un article avec la barre du bas («\u00a02 baguettes, du beurre\u00a0») ou parcours le catalogue.",
    openCatalog: "Ouvrir le catalogue",
    chooseList: "Changer de liste",
    menu: "Actions sur la liste",
    addPlaceholder: "Ajouter un ou plusieurs articles…",
    addLabel: "Ajouter",
    create: (name: string) => `Créer «\u00a0${name}\u00a0»`,
    inList: (quantity: string) => `Dans la liste : ${quantity}`,
    typesOne: (type: string) => `${type} uniquement`,
    typesMany: (types: string[]) => types.join(" ou "),
    withType: (name: string, type: string) => `${name} · ${type}`,
    otherType: "Une autre sorte, sur une ligne à part",
    linesJoined:
      "Mêmes types qu'une autre ligne : les deux n'en font plus qu'une.",
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
      otherType: (quantity: string) =>
        `Ou ajouter ${quantity} d'une autre sorte, sur une ligne à part`,
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
        "Rangé dans «\u00a0Achats ponctuels\u00a0» pour le retrouver plus tard. Tu pourras en faire un article normal en lui donnant une catégorie.",
    },
    keepOneOff: {
      hint: "Achat ponctuel. Pour le garder comme article normal, choisis sa catégorie.",
      category: "Catégorie",
      choose: "Choisir une catégorie",
      keep: "Garder dans le catalogue",
      done: (name: string, category: string) =>
        `«\u00a0${name}\u00a0» rangé dans ${category}`,
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
      description: "Actions sur cette liste",
      rename: "Renommer",
      duplicate: "Dupliquer",
      addLists: "Compléter avec une liste",
      clear: "Vider la liste",
      delete: "Supprimer la liste",
      confirmClear: "Vider la liste ?",
      confirmClearText:
        "Toutes les lignes seront retirées. Tu pourras annuler juste après.",
      confirmDelete: (name: string) => `Supprimer «\u00a0${name}\u00a0» ?`,
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
      include: "Reprendre le contenu de",
      create: "Créer la liste",
    },
    merge: {
      title: (name: string) => `Compléter «\u00a0${name}\u00a0»`,
      text: "Les articles des listes choisies s'ajoutent à celle-ci ; ceux qu'elle contient déjà voient leur quantité augmenter.",
      sources: "Prendre le contenu de",
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
    unavailableLastTime: "Pas pris la dernière fois",
    via: (recipes: string[]) => `via ${recipes.join(", ")}`,
  },
  share: {
    send: "Partager la liste",
    sendRecipe: "Partager la recette",
    paste: "Coller une liste",
    pasteRecipe: "Coller une recette",
    messageTitle: (name: string, count: number) =>
      `${name} (${count > 1 ? `${count} articles` : "1 article"})`,
    messageLink:
      "Pour l'ajouter dans l'app ShoppingList : copie ce message (ou juste le lien), puis dans l'app, ⋯ → Coller une liste. Sur Android, toucher le lien suffit souvent :",
    recipeMessageTitle: (name: string, amount: string) =>
      `${name} (pour ${amount})`,
    recipeMessageLink:
      "Pour l'ajouter dans l'app ShoppingList : copie ce message (ou juste le lien), puis dans l'app, Recettes → Coller une recette. Sur Android, toucher le lien suffit souvent :",
    copied: "Liste copiée : colle-la dans ton message.",
    recipeCopied: "Recette copiée : colle-la dans ton message.",
    shareError: "Partage impossible sur ce téléphone.",
    pasteTitle: "Coller une liste",
    pasteText:
      "Colle ici le message reçu, ou n'importe quelle liste : une ligne par article.",
    pastePlaceholder: "2 baguettes\ndu beurre\n6 œufs",
    pasteRecipeText:
      "Colle ici le message reçu : une recette partagée depuis l'app ShoppingList.",
    pasteRecipePlaceholder: "Le message reçu, avec son lien",
    pasteContinue: "Continuer",
    titleShared: "Liste reçue",
    titlePasted: "Liste collée",
    titleRecipe: "Recette reçue",
    pastedListName: "Liste collée",
    loading: "Lecture…",
    brokenTitle: "Lien illisible",
    broken:
      "Ce lien est incomplet ou abîmé. Demande à la personne de te le renvoyer.",
    notRecipeTitle: "Pas de recette",
    notRecipe:
      "Ce texte n'est pas une recette partagée par l'app ShoppingList. Demande à la personne de te l'envoyer depuis l'app : fiche de la recette → Partager la recette.",
    isRecipeTitle: "C'est une recette",
    isRecipe: `Ce message contient une recette : colle-le depuis l'onglet Recettes → «\u00a0Coller une recette\u00a0».`,
    isListTitle: "C'est une liste",
    isList: `Ce message contient une liste : colle-le depuis ta liste, ⋯ → «\u00a0Coller une liste\u00a0».`,
    empty: "Rien à ajouter dans ce texte.",
    catalogError:
      "Le catalogue de l'app n'a pas pu être chargé. Reviens à ta liste, puis réessaie.",
    outdated:
      "Certains articles viennent d'une version plus récente de l'app. Ferme-la puis rouvre-la pour la mettre à jour.",
    backToList: "Revenir à ma liste",
    backToRecipes: "Revenir aux recettes",
    summary: (known: number, probable: number, unknown: number) =>
      [
        known && (known > 1 ? `${known} reconnus` : "1 reconnu"),
        probable && `${probable} à confirmer`,
        unknown && (unknown > 1 ? `${unknown} non reconnus` : "1 non reconnu"),
      ]
        .filter(Boolean)
        .join(", "),
    summaryHint:
      "Touche une ligne pour choisir l'article qui correspond chez toi, ou en créer un.",
    target: "Ajouter à",
    newList: (name: string) => `Une nouvelle liste «\u00a0${name}\u00a0»`,
    sectionCheck: "À vérifier",
    sectionKnown: "Reconnus",
    checkAll: "Tout cocher",
    uncheckAll: "Tout décocher",
    toConfirm: (label: string) => `reçu : «\u00a0${label}\u00a0», à confirmer`,
    received: (label: string) => `reçu : «\u00a0${label}\u00a0»`,
    willCreate: (category: string) => `nouvel article, ${category}`,
    open: (name: string) => `Choisir l'article pour ${name}`,
    apply: (count: number) =>
      count > 1 ? `Ajouter ${count} lignes` : "Ajouter 1 ligne",
    applyRecipe: (count: number) =>
      count > 1
        ? `Ajouter la recette (${count} ingrédients)`
        : count === 1
          ? "Ajouter la recette (1 ingrédient)"
          : "Ajouter la recette",
    recipeDone: (name: string) => `Recette «\u00a0${name}\u00a0» ajoutée`,
    done: (count: number, list: string) =>
      `${count > 1 ? `${count} lignes ajoutées` : "1 ligne ajoutée"} à «\u00a0${list}\u00a0»`,
    choiceTitle: (label: string) => `«\u00a0${label}\u00a0»`,
    choiceText: (category: string, quantity: string) =>
      `Reçu : ${category}, ${quantity}`,
    candidates: "Peut-être chez toi",
    noCandidates: "Aucun article ressemblant.",
    allInCategory: "Voir tous mes articles de cette catégorie",
    search: "Chercher dans mes articles",
    createTitle: "Ou créer un nouvel article",
    createName: "Nom",
    create: "Créer cet article",
    inCategory: (category: string) =>
      `Gardé dans le catalogue, dans la catégorie ${category}.`,
    browserTitle: "Ouvre-la dans l'app",
    browserText:
      "Sur iPhone, l'app installée ne voit pas ce que reçoit le navigateur. Copie le lien, ouvre ShoppingList depuis ton écran d'accueil, puis ⋯ → «\u00a0Coller une liste\u00a0».",
    copyLink: "Copier le lien",
    linkCopied:
      "Lien copié. Ouvre l'app, puis ⋯ → «\u00a0Coller une liste\u00a0».",
    copyError: "Copie impossible : garde le message et colle-le depuis l'app.",
    importHere: "Ajouter la liste ici quand même",
    browserRecipeText: `Sur iPhone, l'app installée ne voit pas ce que reçoit le navigateur. Copie le lien, ouvre ShoppingList depuis ton écran d'accueil, puis Recettes → «\u00a0Coller une recette\u00a0».`,
    linkCopiedRecipe: `Lien copié. Ouvre l'app, puis Recettes → «\u00a0Coller une recette\u00a0».`,
    importRecipeHere: "Ajouter la recette ici quand même",
  },
  shopping: {
    /** Champ d'ajout, à côté de « Terminer » : la place manque pour le libellé de la liste. */
    addPlaceholder: "Ajouter…",
    start: "C'est parti",
    resume: "Reprendre les courses",
    reopen: (time: string) => `Rouvrir les courses (${time})`,
    startTitle: "Faire les courses",
    startText: "Dans quel magasin ?",
    newStore: "Un autre magasin",
    newStoreName: "Nom du magasin",
    newStorePlaceholder: "Super U, marché du samedi…",
    newStoreHint:
      "Ses rayons se rangent pendant tes courses : touche un article quand il est dans le caddie, et «\u00a0Rayon suivant\u00a0» quand tu changes de rayon.",
    go: "C'est parti",
    nextAisle: "Rayon suivant",
    nextAisleHint: "Les articles cochés ensuite iront dans un nouveau rayon",
    emptyAisle:
      "Touche un article de «\u00a0À placer\u00a0» quand il est dans le caddie : il sera rangé dans ce rayon.",
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
    aislePassed: (label: string) =>
      `${label} déjà passé : il t'attend dans «\u00a0À récupérer\u00a0».`,
    current: "Tu es ici",
    aisleOpened:
      "Nouveau rayon\u00a0: les articles cochés ensuite y seront rangés.",
    aisleStillEmpty:
      "Tu es déjà dans un nouveau rayon, encore vide\u00a0: coche un article de «\u00a0À placer\u00a0» pour le remplir.",
    swipeHint:
      "Glisser vers la gauche : pas pris · appui long : changer de rayon",
    unavailable: "Pas pris",
    moveAisle: "Changer de rayon",
    changeQuantity: (name: string) => `Changer la quantité de ${name}`,
    unavailableToast: (name: string) => `${name} : pas pris`,
    screenOnFailed:
      "L'écran pourra se mettre en veille : ce téléphone ne permet pas de le garder allumé.",
    allDone: "Tout est dans le caddie !",
    added: {
      title: (name: string) => `${name} ajouté`,
      inAisle: (into: string) => `Rangé ${into}.`,
      alreadyTaken: "Je l'ai déjà dans le caddie",
      otherAisle: "Il est dans un autre rayon…",
      ok: "OK, à prendre",
    },
    where: {
      title: (name: string) => `Où as-tu pris ${name} ?`,
      text: "Pour que l'app sache où le trouver la prochaine fois.",
      here: (into: string) => `Ici, ${into}`,
      hereHint: "Il sera rangé dans ce rayon pour les prochaines courses.",
      usual: (title: string) => `Dans son rayon : ${title}`,
      other: "Dans un autre rayon…",
    },
    move: {
      title: (name: string) => `Déplacer ${name}`,
      text: "Vers quel rayon de ce magasin ?",
      hereSection: "Le rayon où tu es",
      withCategory: "Où l'on trouve sa catégorie",
      others: "Autres rayons",
      all: "Rayons du magasin",
      current: "son rayon actuel",
      scopeTitle: (into: string) => `Ranger ${into}`,
      scopeText: (into: string) =>
        `L'app s'en souviendra pour tes prochaines courses dans ce magasin. Qu'est-ce qui se trouve ${into} ?`,
      onlyArticle: (name: string) => `Seulement ${name}`,
      onlyArticleHint: (category: string) =>
        `Les autres articles de ${category} restent où ils sont.`,
      wholeCategory: (category: string) => `Toute la catégorie ${category}`,
      wholeCategoryHint: (into: string) => `Tous ses articles iront ${into}.`,
      done: (name: string, label: string) => `${name} → ${label}`,
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
          ? `${count} pas pris, restés dans la liste`
          : "1 pas pris, resté dans la liste",
      duration: (duration: string) => `Durée : ${duration}`,
      learned: "Ordre des rayons mis à jour pour ce magasin.",
      back: "Retour à la liste",
      reopen: "Rouvrir les courses",
      missing: "Ces courses ne sont plus disponibles.",
    },
  },
  manage: {
    section: "Mes données",
    style: {
      icon: "Icône",
      color: "Couleur",
      none: "Aucune",
    },
    confirmCancel: "Annuler",
    backup: {
      section: "Sauvegarde",
      keep: "Garder une copie",
      restore: "Récupérer une copie",
      export: "Exporter un fichier",
      exportHint:
        "Un fichier avec tes listes, magasins, rayons, articles et ton historique, à garder dans tes fichiers ou ton stockage en ligne. Utile pour changer de téléphone ou réinstaller l'app : la supprimer efface ses données.",
      last: (days: number | undefined) =>
        days === undefined
          ? "Aucune sauvegarde pour l'instant."
          : days === 0
            ? "Dernière sauvegarde : aujourd'hui."
            : `Dernière sauvegarde : il y a ${days} jour${days > 1 ? "s" : ""}.`,
      exported: "Sauvegarde prête",
      copy: "Copier les données",
      copyHint:
        "La même sauvegarde, en texte dans le presse-papiers : colle-la dans une note ou un message pour la garder, puis «\u00a0Coller les données\u00a0» dans l'app réinstallée.",
      copied:
        "Données copiées dans le presse-papiers : colle-les dans une note ou un message pour les garder",
      copyFailed:
        "Copie impossible : utilise plutôt «\u00a0Exporter un fichier\u00a0».",
      paste: "Coller les données",
      pasteTitle: "Coller une sauvegarde",
      pasteText:
        "Colle ici le texte d'une sauvegarde copiée (touche longue → Coller).",
      pastePlaceholder: '{ "app": "ShoppingList", … }',
      pasteCheck: "Vérifier la sauvegarde",
      invalidText: "Ce texte n'est pas une sauvegarde de ShoppingList.",
      import: "Importer un fichier",
      importHint:
        "Remplace toutes les données de l'app par celles d'une sauvegarde, après confirmation.",
      importTitle: "Remplacer toutes tes données ?",
      importText: (
        date: string,
        articles: number,
        lists: number,
        stores: number,
      ) =>
        `Sauvegarde du ${date} : ${articles} articles, ${lists} liste${lists > 1 ? "s" : ""}, ${stores} magasin${stores > 1 ? "s" : ""}. Tes données actuelles seront remplacées ; elles sont d'abord gardées dans les copies automatiques, en bas de cet écran.`,
      importConfirm: "Remplacer mes données",
      invalid: "Ce fichier n'est pas une sauvegarde de ShoppingList.",
      newer:
        "Cette sauvegarde vient d'une version plus récente de l'app : mets l'app à jour d'abord.",
      imported: "Données importées",
      replaceFailed: "Le remplacement a échoué : tes données n'ont pas changé.",
      copies: {
        section: "Copies automatiques",
        hint: "Chaque jour, l'app garde une copie de tes données dans le téléphone, sur les 7 derniers jours : pour revenir en arrière après une fausse manipulation, un import ou une mise à jour. Elles disparaissent avec l'app : pour changer de téléphone, exporte un fichier.",
        none: "Aucune copie pour l'instant : la première sera faite au prochain lancement de l'app.",
        title: (date: string, beforeReplace: boolean) =>
          date.charAt(0).toLocaleUpperCase("fr") +
          date.slice(1) +
          (beforeReplace ? ", avant remplacement" : ""),
        summary: (articles: number, lists: number, stores: number) =>
          `${articles} articles · ${lists} liste${lists > 1 ? "s" : ""} · ${stores === 0 ? "aucun magasin" : `${stores} magasin${stores > 1 ? "s" : ""}`}`,
        restoreTitle: (date: string) => `Revenir à la copie du ${date} ?`,
        restoreText:
          "Toutes tes données actuelles (listes, magasins, articles, historique) seront remplacées par celles de cette copie. Elles sont d'abord copiées, et les copies restent : tu pourras revenir en arrière.",
        restoreConfirm: "Restaurer cette copie",
      },
    },
    categories: {
      title: "Catégories",
      hint: "Noms, icônes et couleurs, fusion",
      count: (count: number) =>
        count > 1 ? `${count} articles` : `${count} article`,
      add: "Nouvelle catégorie",
      newTitle: "Nouvelle catégorie",
      name: "Nom",
      create: "Créer la catégorie",
      nameTaken: "Une autre catégorie porte déjà ce nom.",
      shortName: "Nom court (facultatif)",
      shortNameHint:
        "Sert au titre des rayons qui la contiennent («\u00a0Pain · Café & thé +2\u00a0»).",
      system:
        "Catégorie de l'app : elle ne se supprime pas. Ses articles vont dans «\u00a0À placer\u00a0».",
      newHint:
        "Pense à la ranger dans un rayon de chaque magasin (Magasins & rayons).",
      merge: "Fusionner avec une autre catégorie",
      mergeTitle: (name: string) => `Fusionner ${name} dans…`,
      mergeText:
        "La catégorie choisie reprend ses articles et ses rayons ; celle-ci disparaît.",
      merged: (from: string, into: string) => `${from} fusionnée dans ${into}`,
      delete: "Supprimer la catégorie",
      deleteTitle: (name: string) => `Supprimer ${name} ?`,
      deleteText: (count: number) =>
        count === 0
          ? "Elle ne contient aucun article."
          : `${count > 1 ? `Ses ${count} articles iront` : "Son article ira"} dans la catégorie choisie.`,
      moveTo: "Déplacer ses articles vers",
      deleted: (name: string) => `Catégorie ${name} supprimée`,
      done: "Terminé",
    },
    units: {
      title: "Unités",
      hint: "Poids, volumes, contenants et leurs abréviations",
      add: "Nouvelle unité",
      newTitle: "Nouvelle unité",
      singular: "Nom (singulier)",
      plural: "Pluriel",
      abbr: "Abréviation",
      abbrHint:
        "Facultative. Sans abréviation : le nom en entier («\u00a02 bouteilles\u00a0»).",
      group: "Type",
      factor: (base: string) => `Valeur en ${base}`,
      factorHint: (base: string) =>
        `Combien de ${base} dans une unité : 1000 pour un kilogramme. Permet de convertir.`,
      base: { mass: "grammes", volume: "millilitres" },
      step: "Pas des boutons − et +",
      create: "Créer l'unité",
      nameTaken: "Une autre unité porte déjà ce nom.",
      save: "Enregistrer",
      usage: (lines: number, articles: number) =>
        `Utilisée par ${articles} article${articles > 1 ? "s" : ""} et ${lines} ligne${lines > 1 ? "s" : ""}.`,
      delete: "Supprimer l'unité",
      deleteTitle: (name: string) => `Supprimer «\u00a0${name}\u00a0» ?`,
      deleteText:
        "Les articles et les lignes qui l'utilisent passent à l'unité choisie, la quantité convertie quand c'est possible.",
      replaceWith: "Remplacer par",
      deleted: (name: string) => `Unité «\u00a0${name}\u00a0» supprimée`,
    },
    icon: {
      title: "Icône",
      search: "Chercher une icône",
      none: "Aucune (initiales)",
      noResult: "Aucune icône ne correspond.",
      change: "Changer l'icône",
      featured: "Plats et desserts",
      others: "Toutes les icônes",
    },
    articles: {
      title: "Articles",
      hint: "Noms, catégories, unités, types, icônes",
      search: "Chercher un article",
      allCategories: "Toutes les catégories",
      count: (count: number) =>
        count > 1 ? `${count} articles` : `${count} article`,
      add: "Nouvel article",
      create: "Créer l'article",
      exists: (name: string) => `«\u00a0${name}\u00a0» existe déjà`,
      duplicates: "Doublons probables",
      duplicatesHint:
        "Même catégorie, même icône et noms proches. Fusionne-les, ou dis à l'app que ce sont bien deux articles.",
      merge: "Fusionner",
      notDuplicate: "Ce ne sont pas des doublons",
      notDuplicateDone: "Compris, ils ne seront plus proposés",
      noResult: "Aucun article trouvé.",
    },
    article: {
      name: "Nom",
      nameTaken: "Un autre article porte déjà ce nom.",
      category: "Catégorie",
      unit: "Unité par défaut",
      quantity: "Quantité par défaut",
      quantityHint: "Ajoutée quand tu n'en précises pas (vide : 1).",
      types: "Types",
      typesHint:
        "Les variétés qu'on peut choisir sur une ligne : Gala, Golden…",
      newType: "Nouveau type",
      addType: "Ajouter le type",
      removeType: (type: string) => `Retirer le type ${type}`,
      aliases: "Autres noms",
      aliasesHint:
        "Pour le trouver aussi sous ces noms en tapant : sopalin, pdt, coca…",
      newAlias: "Autre nom",
      addAlias: "Ajouter le nom",
      removeAlias: (alias: string) => `Retirer le nom ${alias}`,
      favorite: "Favori",
      favoriteHint: "Toujours en tête du catalogue.",
      countable: "Se compte à la pièce",
      countableHint:
        "Un nombre tapé seul compte des pièces\u00a0: 3\u00a0pommes. Sinon, des portions de la quantité par défaut\u00a0: 2\u00a0beurres → 500\u00a0g.",
      usage: (lines: number, lists: number, recipes: number) =>
        [
          lines === 0
            ? "Dans aucune liste pour l'instant."
            : lists > 1
              ? `Dans ${lists} listes.`
              : "Dans une liste.",
          recipes === 0
            ? ""
            : recipes > 1
              ? `Utilisé dans ${recipes} recettes.`
              : "Utilisé dans une recette.",
        ]
          .filter(Boolean)
          .join(" "),
      merge: "Fusionner avec un autre article",
      mergeTitle: (name: string) => `Fusionner dans ${name}`,
      mergeSearch: "Article à fusionner",
      mergeText: (keep: string, other: string) =>
        `${other} disparaît : ses lignes et son historique passent à ${keep}, et «\u00a0${other}\u00a0» devient un autre nom de ${keep}.`,
      mergeConfirm: "Fusionner",
      merged: (other: string, keep: string) => `${other} fusionné dans ${keep}`,
      keep: (name: string) => `Garder ${name}`,
      delete: "Supprimer l'article",
      deleteTitle: (name: string) => `Supprimer ${name} ?`,
      deleteText: (lists: number, recipes: number) => {
        const where = [
          lists > 1 ? `des ${lists} listes` : lists === 1 ? "de la liste" : "",
          recipes > 1
            ? `des ${recipes} recettes`
            : recipes === 1
              ? "de la recette"
              : "",
        ].filter(Boolean);
        return where.length === 0
          ? "Il disparaît du catalogue. L'historique de tes courses reste."
          : `Il disparaît du catalogue et ${where.join(" et ")} où il se trouve. L'historique de tes courses reste.`;
      },
      deleted: (name: string) => `${name} supprimé`,
      missing: "Cet article n'existe plus.",
      edit: "Modifier l'article",
    },
    stores: {
      title: "Magasins & rayons",
      hint: "Rayons, leur ordre et les catégories de chacun",
      aisles: (count: number) =>
        count > 1 ? `${count} rayons` : `${count} rayon`,
      add: "Nouveau magasin",
      emptyTitle: "Aucun magasin pour l'instant",
      emptyText:
        "Le premier se crée au premier «\u00a0C'est parti\u00a0», et ses rayons se rangent pendant tes courses. Tu peux aussi le préparer d'ici.",
      newTitle: "Nouveau magasin",
      name: "Nom du magasin",
      from: "Rayons de départ",
      fromCopy: "Une copie",
      fromEmpty: "Aucun rayon",
      emptyHint:
        "Ses rayons se rangent pendant tes premières courses : touche un article quand il est dans le caddie, et «\u00a0Rayon suivant\u00a0» quand tu changes de rayon.",
      copyOf: "Copier les rayons de",
      create: "Créer le magasin",
    },
    store: {
      name: "Nom",
      learn: "Apprendre l'ordre de mes courses",
      learnHint:
        "À la fin des courses, les rayons parcourus prennent l'ordre de ton passage.",
      aisles: "Rayons",
      aislesHint:
        "Glisse la poignée pour changer l'ordre ; touche un rayon pour ses catégories.",
      reorder: (name: string) => `Déplacer ${name}`,
      categories: (count: number) =>
        count === 0
          ? "Aucune catégorie"
          : count > 1
            ? `${count} catégories`
            : "1 catégorie",
      always: "toujours en dernier",
      addAisle: "Nouveau rayon",
      unattached: "Catégories non rattachées",
      unattachedHint:
        "Leurs articles vont dans «\u00a0À placer\u00a0». Touche-en une pour la ranger.",
      place: (category: string) => `Ranger ${category}`,
      placeHint: "Dans quel rayon ? Elle y sera principale.",
      overrides: "Exceptions",
      overridesHint:
        "Articles rangés ailleurs que dans le rayon de leur catégorie, pour ce magasin.",
      removeOverride: (name: string) => `Retirer l'exception de ${name}`,
      overrideRemoved: (name: string) =>
        `${name} retourne dans le rayon de sa catégorie`,
      delete: "Supprimer le magasin",
      deleteTitle: (name: string) => `Supprimer «\u00a0${name}\u00a0» ?`,
      deleteText:
        "Ses rayons et ses exceptions seront supprimés. Tes listes et l'historique de tes courses restent.",

      deleteShopping:
        "Des courses sont en cours dans ce magasin : termine-les d'abord.",
      deleted: (name: string) => `«\u00a0${name}\u00a0» supprimé`,
      edit: "Modifier ce magasin",
      missing: "Ce magasin n'existe plus.",
    },
    aisle: {
      title: "Rayon",
      name: "Nom du rayon (facultatif)",
      nameHint:
        "Sans nom, son titre vient de ses catégories (indiqué en gris).",
      description: "Repère (facultatif)",
      descriptionPlaceholder: "Au fond du magasin, à côté des caisses…",
      categories: "Catégories",
      categoriesHint:
        "Pleine : rayon principal de la catégorie (ses articles y vont). Contour : elle s'y trouve aussi.",
      primary: "principale",
      secondary: "aussi ici",
      makePrimary: (category: string) => `${category} : rendre principale`,
      makeSecondary: (category: string) => `${category} : rendre secondaire`,
      removeCategory: (category: string) => `Retirer ${category}`,
      addCategory: "Ajouter une catégorie",
      chooseCategory: "Choisir une catégorie",
      unsortedHint:
        "Les articles dont la catégorie n'a pas encore de rayon dans ce magasin. En courses, touche-les quand ils sont dans le caddie : ils se rangent dans le rayon où tu es.",
      merge: "Fusionner avec un autre rayon",
      mergeTitle: (name: string) => `Fusionner ${name} dans…`,
      mergeText:
        "Le rayon choisi reçoit toutes ses catégories ; celui-ci disparaît.",
      merged: (from: string, into: string) => `${from} fusionné dans ${into}`,
      delete: "Supprimer le rayon",
      deleteTitle: (name: string) => `Supprimer ${name} ?`,
      deleteText:
        "Les catégories dont c'est le rayon principal iront dans «\u00a0À placer\u00a0».",
      deletePromote:
        "Ou dans un de leurs rayons secondaires quand elles en ont un",
      deleted: (label: string) => `${label} supprimé`,
      done: "Terminé",
    },
  },
  recipes: {
    title: "Recettes",
    search: "Rechercher une recette",
    create: "Nouvelle recette",
    menu: "Actions sur les recettes",
    menuDescription: "Ajouter une recette",
    count: (count: number) =>
      count > 1 ? `${count} recettes` : count === 1 ? "1 recette" : "Recettes",
    noResult: "Aucune recette ne correspond.",
    emptyTitle: "Aucune recette",
    emptyText:
      "Note une recette une fois : ses ingrédients s'ajoutent ensuite à ta liste, pour le nombre de personnes voulu.",
    newTitle: "Nouvelle recette",
    name: "Nom",
    namePlaceholder: "Cake aux olives",
    yield: "Pour",
    yieldQuantity: "Nombre",
    yieldUnit: "Unité",
    yieldHint: "Personnes, parts, cake… : ce que la recette donne.",
    yieldUnits: ["personnes", "parts", "cake", "tarte", "gâteau", "pièces"],
    createSubmit: "Créer la recette",
    missing: "Cette recette n'existe plus.",
    serves: (amount: string) => `Pour ${amount}`,
    edit: "Modifier",
    editDone: "OK",
    ingredients: "Ingrédients",
    noIngredients: "Aucun ingrédient pour l'instant.",
    noIngredientsEdit:
      "Ajoute les ingrédients avec la barre du bas : «\u00a0200 g de farine, 3 œufs\u00a0».",
    steps: "Étapes",
    noSteps: "Aucune étape notée.",
    stepsPlaceholder: "1. Préchauffer le four à 180 °C…",
    optional: "facultatif",
    fixed: "quantité fixe",
    addPlaceholder: "Ajouter un ingrédient…",
    addLabel: "Ajouter l'ingrédient",
    addToList: "Ajouter à une liste",
    duplicate: "Dupliquer",
    duplicateTitle: (name: string) => `Dupliquer «\u00a0${name}\u00a0»`,
    duplicateName: "Nom de la nouvelle recette",
    duplicateSubmit: "Créer la copie",
    duplicated: (name: string) => `«\u00a0${name}\u00a0» créée`,
    delete: "Supprimer la recette",
    deleteTitle: (name: string) => `Supprimer «\u00a0${name}\u00a0» ?`,
    deleteText:
      "Les ingrédients déjà ajoutés à tes listes y restent. La recette, elle, ne se récupère pas.",
    deleted: (name: string) => `«\u00a0${name}\u00a0» supprimée`,
    /** Icônes de plats (`src/icons/dishes`) : libellé et mots-clés pour la recherche. */
    dishes: {
      soupe: { label: "Soupe", keywords: ["velouté", "potage", "bouillon"] },
      cake: { label: "Cake", keywords: ["cake salé", "cake sucré"] },
      tarte: { label: "Tarte", keywords: ["tarte aux pommes", "tarte sucrée"] },
      gateau: {
        label: "Gâteau",
        keywords: ["gâteau au chocolat", "anniversaire", "layer cake"],
      },
      gratin: { label: "Gratin", keywords: ["gratin dauphinois", "four"] },
      "salade-composee": {
        label: "Salade composée",
        keywords: ["salade", "crudités"],
      },
    } as Record<string, { label: string; keywords: string[] } | undefined>,
    ingredient: {
      optional: "Facultatif",
      optionalHint: "décoché au moment d'ajouter la recette à une liste",
      fixed: "Quantité fixe",
      fixedHint:
        "ne change pas avec le nombre de personnes : un pot de crème pour la raclette",
      remove: "Retirer",
      done: "OK",
    },
    add: {
      title: (name: string) => `Ajouter «\u00a0${name}\u00a0»`,
      into: (list: string) => `Dans la liste «\u00a0${list}\u00a0».`,
      list: "Dans la liste",
      amount: "Pour",
      less: "Moins",
      more: "Plus",
      ingredients: "Ingrédients",
      hint: "Décoche ce que tu as déjà.",
      isNew: "à ajouter",
      merged: (before: string, after: string) => `déjà ${before} → ${after}`,
      note: (before: string) => `déjà ${before}, ajouté en note`,
      empty: "Cette recette n'a pas encore d'ingrédient.",
      apply: (count: number) =>
        count > 1
          ? `Ajouter ${count} ingrédients`
          : count === 1
            ? "Ajouter 1 ingrédient"
            : "Rien à ajouter",
      done: (count: number, list: string) =>
        count > 1
          ? `${count} ingrédients ajoutés à «\u00a0${list}\u00a0»`
          : `1 ingrédient ajouté à «\u00a0${list}\u00a0»`,
    },
  },
  catalog: {
    title: "Catalogue",
    search: "Chercher un article",
    favorites: "Favoris",
    usual: "Habituels",
    categories: "Catégories",
    noResult: "Aucun article trouvé.",
    emptyCategory: "Aucun article ici",
    emptyCategoryText:
      "Tape le nom d'un nouvel article dans la barre d'ajout de la liste pour le créer, ou passe par Réglages → Articles.",
    suggestions: "Articles trouvés",
    added: (name: string) => `${name} ajouté à la liste`,
    showAll: (count: number) => `Voir les ${count} résultats`,
    categoryResult: (count: number) =>
      `Catégorie · ${count > 1 ? `ses ${count} articles` : "son article"}`,
    back: "Catalogue",
    quantityTitle: (name: string) => name,
    otherType: "Ajouter une autre sorte",
    removeLine: (label?: string) =>
      label ? `Retirer la ligne «\u00a0${label}\u00a0»` : "Retirer de la liste",
    remove: "Retirer de la liste",
    done: "Terminé",
    count: (count: number) =>
      count > 1 ? `${count} articles` : `${count} article`,
  },
  settings: {
    title: "Réglages",
    dataIntro:
      "Le cœur de l'app : tes articles, leurs catégories, les rayons de tes magasins. Tout se modifie ici.",
    counts: {
      articles: (n: number) => (n > 1 ? `${n} articles` : `${n} article`),
      categories: (n: number) => (n > 1 ? `${n} catégories` : `${n} catégorie`),
      stores: (n: number) =>
        n === 0 ? "Aucun magasin" : n > 1 ? `${n} magasins` : "1 magasin",
      units: (n: number) => (n > 1 ? `${n} unités` : `${n} unité`),
    },
    preferences: {
      title: "Préférences",
      hint: "Sons, écran allumé, thème",
    },
    sectionFeatures: "Fonctionnalités",
    sectionApp: "Application",
    sectionDisplay: "Affichage",
    theme: {
      title: "Thème",
      hint: "Automatique : suit le réglage clair ou sombre du téléphone.",
      options: { auto: "Automatique", dark: "Sombre", light: "Clair" },
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
      title: "Écran allumé",
      hint: "Seulement sur deux écrans : le mode courses et la fiche d'une recette. Ailleurs, le téléphone se met en veille comme d'habitude.",
    },
  },
  soundsPage: {
    title: "Sons",
    master: "Sons de l'app",
    silentIos:
      "Le mode silencieux de l'iPhone a toujours le dernier mot : quand il est activé, aucun son n'est joué, même si les sons de l'app sont activés.",
    silentOther:
      "Le volume des sons est celui du multimédia du téléphone : baisse-le pour les rendre plus discrets.",
    listen: (label: string) => `Écouter «\u00a0${label}\u00a0»`,
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
        "Une nouvelle version est prête : touche «\u00a0Mettre à jour\u00a0» en haut de l'écran.",
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
    list: "Liste rangée par catégorie",
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
    soundsHint: "Les sons de l'app, à écouter un par un.",
    icons: (count: number) => `Icônes d'articles (${count})`,
    iconsHint:
      "Le pack embarqué dans l'app, disponible hors ligne. Un monogramme remplace les icônes manquantes.",
    addBar: "Barre d'ajout",
    addPlaceholder: "Ajouter un ou plusieurs articles…",
    add: "Ajouter",
    added: (text: string) => `«\u00a0${text}\u00a0» ajouté (maquette)`,
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
        version: "1.1.1",
        date: "2026-11-19",
        items: [
          "Recettes : nouvelles unités «\u00a0verre\u00a0» et «\u00a0décilitre\u00a0». Une cuillère, une pincée ou un verre ne s'achète pas : à l'ajout à une liste, l'article arrive dans son unité habituelle (1 bouteille de vin blanc) et la quantité de la recette passe en note. Tapé dans la liste, «\u00a01 verre de vin\u00a0» ajoute aussi le vin dans son unité habituelle.",
          "Une liste à puces copiée depuis Notes ou une autre app se colle d'un coup dans la barre d'ajout : un article par puce.",
          "Recettes : «\u00a0Nouvelle recette\u00a0» et «\u00a0Coller une recette\u00a0» passent dans le menu ⋯, pour laisser la place aux recettes.",
        ],
      },
      {
        version: "1.1.0",
        date: "2026-11-19",
        items: [
          "Partage d'une liste ou d'une recette : envoie-la par message, la personne la colle dans son app (⋯ → «\u00a0Coller une liste\u00a0», ou Recettes → «\u00a0Coller une recette\u00a0»).",
          "Optimisation du code.",
        ],
      },
      {
        version: "1.0.1",
        date: "2026-11-16",
        items: [
          "Corrections de bugs et améliorations de l'expérience utilisateur.",
        ],
      },
      {
        version: "1.0.0",
        date: "2026-11-16",
        items: [
          "Ta liste de courses, rangée par catégorie à la maison et par rayon en magasin, dans l'ordre de ton parcours.",
          "Ajout éclair : «\u00a03 tomates, du beurre et 6 œufs\u00a0», au clavier ou en dictée.",
          "483 articles, chacun avec son icône dessinée pour l'app. Tout se modifie : articles, catégories, rayons, magasins, unités.",
          "Chaque magasin se construit pendant tes courses : coche dans l'ordre, «\u00a0Rayon suivant\u00a0» quand tu changes de rayon. La fois suivante, la liste suit ce parcours.",
          "Recettes : note une recette une fois, puis ajoute ses ingrédients à ta liste pour le nombre de personnes voulu. Les quantités sont recalculées et s'ajoutent à celles déjà dans la liste.",
          "Plusieurs listes, sauvegarde et copies automatiques dans le téléphone, thème sombre ou clair, et l'app marche sans connexion.",
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
      "Choisis «\u00a0Ajouter à l'écran d'accueil\u00a0».",
      "Touche «\u00a0Ajouter\u00a0», puis ouvre l'app depuis son icône.",
    ],
    iosSafariSteps: [
      "Touche le bouton Partager en bas de l'écran.",
      "Choisis «\u00a0Sur l'écran d'accueil\u00a0».",
      "Touche «\u00a0Ajouter\u00a0», puis ouvre l'app depuis son icône.",
    ],
    androidButton: "Installer l'application",
    androidManual:
      "Si le bouton reste grisé : menu ⋮ de Chrome → «\u00a0Installer l'application\u00a0».",
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
