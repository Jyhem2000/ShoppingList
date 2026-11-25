import type { Texts } from "./index";

/**
 * Tous les textes de l'interface en anglais (britannique : colour, catalogue, trolley ;
 * docs/03 I3). Même forme que `fr.ts`, vérifiée par le type `Texts` : aucun texte
 * ne peut manquer. Guillemets “ ”.
 */

/** Espace insécable, pour garder ensemble « 7 days ». */
const nbsp = String.fromCharCode(160);

/** « 1 day », « 7 days » (espace insécable). */
const days = (count: number) =>
  count === 1 ? `${count}${nbsp}day` : `${count}${nbsp}days`;

/** « 1 item », « 3 items ». */
const items = (count: number) =>
  count === 1 ? `${count} item` : `${count} items`;

const plural = (count: number, word: string) =>
  count === 1 ? word : `${word}s`;

export const en: Texts = {
  appName: "ShoppingList",
  defaults: {
    listName: "List 1",
    unsortedAisle: "Unsorted",
  },
  aisles: {
    kicker: "Aisle",
    label: (title: string) => `${title} aisle`,
    into: (title: string) => `in the ${title} aisle`,
    newAisle: "New aisle",
    unplaced: "Unsorted",
    intoUnplaced: "in “Unsorted”",
  },
  help: {
    title: "Help",
    hint: "How to use it, what the app sorts out by itself",
    advice: {
      title: "Tip for a good start",
      text: "On your first trips to a shop, follow the same route and tick each item as you pick it up, not all at the checkout: the app learns your shop faster. Later, you can freeze the order if it suits you.",
    },
    sections: [
      {
        title: "Filling the list",
        points: [
          "Type “2 baguettes, butter” in the bar at the bottom: the items are added, sorted by category. You can also browse the Catalogue.",
          "Several items at once: separate them with a comma or “and”. With dictation (the keyboard's microphone), say “and” (or “then”, “comma”) between two items: otherwise, everything becomes a single item.",
          "A particular kind? Pick it from the suggestions. For another kind of the same item, edit it: “Another kind” adds a separate line, with its own quantity.",
          "Tap a line to change its quantity, its note or the kinds that suit you; swipe it left to remove it.",
          "Several lists: tap the list's name at the top. The ⋯ menu acts on the list shown.",
          "“Forgotten anything? Run through”, above the list: first what's due to be bought again (“Not this time” sets it aside until your next shop), then your usual items, category by category.",
          "The green leaf marks a fruit, vegetable or herb in season this month; the Catalogue's “In season” chip shows them all. Its months can be changed on the item's page.",
        ],
      },
      {
        title: "Doing the shopping",
        points: [
          "“Let's go”, then choose the shop, or give its name the first time.",
          "Tap an item once it's in the trolley. Swipe it if there wasn't any; long press to move it to another aisle; tap the quantity to correct it.",
          "First trip to a shop: everything is “Unsorted”. Tick items in the order you pick them up, and tap “Next aisle” when you change aisle: the app builds your shop.",
          "✕ at the top: you leave shopping mode without finishing, and can pick up where you left off.",
        ],
      },
      {
        title: "Finishing and reopening",
        points: [
          "“Finish”: the items you got leave the list, those that were missing stay for next time.",
          "Forgot something at the checkout? “Reopen shopping”, the same day, from the list.",
        ],
      },
      {
        title: "What the app sorts out by itself",
        points: [
          "The order of aisles and items, from the order of your ticks, shop by shop.",
          "An item's aisle: its category's, unless you've put it somewhere else.",
          "The unit of an item added without one: the one you buy most for it, after 3 purchases, with the quantity you usually take. A unit or quantity chosen on its page takes priority.",
          "Your habits: what you buy often comes first in search and in the Catalogue's “Regulars”; what's due to be bought again comes top, based on how often you buy it.",
          "If a shop's order suits you, freeze it: Settings → Shops & aisles → your shop → turn off “Learn the order of my shopping”.",
        ],
      },
    ],
  },
  tips: {
    dismiss: "Tap the screen to continue",
    place:
      "Tap an item once it's in the trolley: the app remembers which aisle it's in.",
    next: "Changing aisle? Tap here: the next items will go in the new aisle.",
    stored: "Your shop is saved: next time, your list will follow your route.",
    reset: "Show the tips again",
    resetAction: "Show again",
    resetHint: "The first-use help bubbles will come back.",
    resetDone: "The tips will come back.",
  },
  sheet: { close: "Close", back: "Back" },
  sortable: {
    instructions:
      "To move this item, press Space or Enter, then the up and down arrows. Space or Enter to drop it, Escape to cancel.",
    picked: (name: string) => `${name} picked up.`,
    over: (name: string, position: number, count: number) =>
      `${name}: position ${position} of ${count}.`,
    dropped: (name: string, position: number, count: number) =>
      `${name} dropped at position ${position} of ${count}.`,
    cancelled: (name: string) => `Move cancelled: ${name} stays where it was.`,
  },
  toast: { close: "Close the message" },
  startup: {
    title: "Can't open your data",
    text: "The phone's storage may be full, or private browsing may be blocking it. Free up some space or open the app normally, then reload.",
    reload: "Reload",
  },
  screenError: {
    title: "This screen couldn't open",
    text: "Check your connection, then reload the app. Your data hasn't been touched.",
    reload: "Reload",
    home: "Back to the list",
  },
  search: { clear: "Clear the search" },
  markdown: {
    toolbar: "Formatting",
    bold: "Bold",
    heading: "Heading",
    bullets: "Bulleted list",
    numbers: "Numbered list",
  },
  tabs: {
    navigation: "Main navigation",
    list: "List",
    catalog: "Catalogue",
    recipes: "Recipes",
    settings: "Settings",
  },
  list: {
    loading: "Loading…",
    emptyTitle: "Your list is empty",
    emptyText:
      "Add an item with the bar at the bottom (“2 baguettes, butter”) or browse the catalogue.",
    openCatalog: "Open the catalogue",
    chooseList: "Switch list",
    menu: "List actions",
    addPlaceholder: "Add one or more items…",
    addLabel: "Add",
    create: (name: string) => `Create “${name}”`,
    inList: (quantity: string) => `In the list: ${quantity}`,
    typesOne: (type: string) => `${type} only`,
    typesMany: (types: string[]) => types.join(" or "),
    withType: (name: string, type: string) => `${name} · ${type}`,
    otherType: "Another kind, on a separate line",
    linesJoined: "Same kinds as another line: the two are now one.",
    removed: (name: string) => `${name}: removed from the list`,
    removedMany: (count: number) =>
      count === 1 ? "1 line removed" : `${count} lines removed`,
    undo: "Undo",
    saveError: "Couldn't save. Try again in a moment.",
    converted: (quantity: string) => `Converted to ${quantity}`,
    swipeHint: "Swipe left to remove",
    exists: {
      text: (quantity: string) => `Already in the list: ${quantity}.`,
      add: (quantity: string) => `Add ${quantity}`,
      nothing: "Do nothing",
      incompatible: (existing: string, added: string) =>
        `Already in the list: ${existing}. Different units from ${added}.`,
      keep: "Keep the existing one",
      replace: (quantity: string) => `Replace with ${quantity}`,
      asNote: "Add as a note",
      otherType: (quantity: string) =>
        `Or add ${quantity} of another kind, on a separate line`,
    },
    createSheet: {
      title: "New item",
      name: "Name",
      category: "Category",
      unit: "Unit",
      submit: "Create and add",
      cancel: "Cancel",
      oneOff: "Just this once",
      oneOffHint:
        "For a one-off purchase (a deep fryer…): no category needed, it isn't added to the catalogue.",
      oneOffOn:
        "Kept in “One-off purchases” so you can find it later. You can turn it into a normal item by giving it a category.",
    },
    keepOneOff: {
      hint: "One-off purchase. To keep it as a normal item, choose its category.",
      category: "Category",
      choose: "Choose a category",
      keep: "Keep in the catalogue",
      done: (name: string, category: string) => `“${name}” put in ${category}`,
    },
    unitGroups: {
      mass: "Weight",
      volume: "Volume",
      container: "Containers",
      count: "By the piece",
      kitchen: "Kitchen",
    },
    line: {
      quantity: "Quantity",
      less: "Decrease",
      more: "Increase",
      unit: "Unit",
      types: "Accepted kinds",
      anyType: "Any",
      newType: "New kind",
      addType: "Add the kind",
      note: "Note",
      notePlaceholder: "organic, the green brand…",
      remove: "Remove from the list",
      done: "Done",
    },
    menuSheet: {
      title: "List",
      description: "Actions on this list",
      rename: "Rename",
      duplicate: "Duplicate",
      addLists: "Add from another list",
      clear: "Clear the list",
      delete: "Delete the list",
      confirmClear: "Clear the list?",
      confirmClearText:
        "All the lines will be removed. You can undo right afterwards.",
      confirmDelete: (name: string) => `Delete “${name}”?`,
      confirmDeleteText: "The list and all its lines will be deleted for good.",
      cancel: "Cancel",
      copyName: (name: string) => `${name} (copy)`,
      renameTitle: "Rename the list",
      save: "Save",
    },
    lists: {
      title: "My lists",
      reorder: (name: string) => `Move ${name}`,
      newList: "New list",
      newTitle: "New list",
      name: "List name",
      include: "Copy the contents of",
      create: "Create the list",
    },
    merge: {
      title: (name: string) => `Add to “${name}”`,
      text: "The items from the chosen lists are added to this one; those it already has get a bigger quantity.",
      sources: "Take the contents of",
      lines: "Lines",
      nothing: "Choose one or more lists.",
      empty: "These lists have nothing to add.",
      isNew: "to add",
      merged: (quantity: string) => `→ ${quantity}`,
      apply: (count: number) =>
        count === 1 ? "Add 1 line" : `Add ${count} lines`,
      done: (count: number) =>
        count === 1 ? "1 line added" : `${count} lines added`,
    },
    unavailableLastTime: "Not taken last time",
    via: (recipes: string[]) => `via ${recipes.join(", ")}`,
  },
  share: {
    send: "Share the list",
    sendRecipe: "Share the recipe",
    paste: "Paste a list",
    pasteRecipe: "Paste a recipe",
    messageTitle: (name: string, count: number) => `${name} (${items(count)})`,
    messageLink:
      "To add it in the ShoppingList app: copy this message (or just the link), then in the app, ⋯ → Paste a list. On Android, tapping the link is often enough:",
    recipeMessageTitle: (name: string, amount: string) =>
      `${name} (serves ${amount})`,
    recipeMessageLink:
      "To add it in the ShoppingList app: copy this message (or just the link), then in the app, Recipes → Paste a recipe. On Android, tapping the link is often enough:",
    copied: "List copied: paste it into your message.",
    recipeCopied: "Recipe copied: paste it into your message.",
    shareError: "Sharing isn't possible on this phone.",
    pasteTitle: "Paste a list",
    pasteText:
      "Paste the message you received here, or any list: one item per line.",
    pastePlaceholder: "2 baguettes\nbutter\n6 eggs",
    pasteRecipeText:
      "Paste the message you received here: a recipe shared from the ShoppingList app.",
    pasteRecipePlaceholder: "The message received, with its link",
    pasteContinue: "Continue",
    titleShared: "List received",
    titlePasted: "Pasted list",
    titleRecipe: "Recipe received",
    pastedListName: "Pasted list",
    loading: "Reading…",
    brokenTitle: "Unreadable link",
    broken:
      "This link is incomplete or damaged. Ask the person to send it again.",
    notRecipeTitle: "Not a recipe",
    notRecipe:
      "This text isn't a recipe shared by the ShoppingList app. Ask the person to send it from the app: the recipe's page → Share the recipe.",
    isRecipeTitle: "It's a recipe",
    isRecipe:
      "This message contains a recipe: paste it from the Recipes tab → “Paste a recipe”.",
    isListTitle: "It's a list",
    isList:
      "This message contains a list: paste it from your list, ⋯ → “Paste a list”.",
    empty: "Nothing to add in this text.",
    catalogError:
      "The app's catalogue couldn't be loaded. Go back to your list, then try again.",
    outdated:
      "Some items come from a newer version of the app. Close it and open it again to update it.",
    backToList: "Back to my list",
    backToRecipes: "Back to recipes",
    summary: (known: number, probable: number, unknown: number) =>
      [
        known && `${known} recognised`,
        probable && `${probable} to confirm`,
        unknown && `${unknown} not recognised`,
      ]
        .filter(Boolean)
        .join(", "),
    summaryHint:
      "Tap a line to choose the matching item in your app, or to create one.",
    target: "Add to",
    newList: (name: string) => `A new list “${name}”`,
    sectionCheck: "To check",
    sectionKnown: "Recognised",
    checkAll: "Tick all",
    uncheckAll: "Untick all",
    toConfirm: (label: string) => `received: “${label}”, to confirm`,
    received: (label: string) => `received: “${label}”`,
    willCreate: (category: string) => `new item, ${category}`,
    open: (name: string) => `Choose the item for ${name}`,
    apply: (count: number) =>
      count === 1 ? "Add 1 line" : `Add ${count} lines`,
    applyRecipe: (count: number) =>
      count === 0
        ? "Add the recipe"
        : `Add the recipe (${count} ${plural(count, "ingredient")})`,
    recipeDone: (name: string) => `Recipe “${name}” added`,
    done: (count: number, list: string) =>
      `${count === 1 ? "1 line added" : `${count} lines added`} to “${list}”`,
    choiceTitle: (label: string) => `“${label}”`,
    choiceText: (category: string, quantity: string) =>
      `Received: ${category}, ${quantity}`,
    candidates: "Maybe in your app",
    noCandidates: "No similar item.",
    allInCategory: "See all my items in this category",
    search: "Search my items",
    createTitle: "Or create a new item",
    createName: "Name",
    create: "Create this item",
    inCategory: (category: string) =>
      `Kept in the catalogue, in the ${category} category.`,
    browserTitle: "Open it in the app",
    browserText:
      "On iPhone, the installed app can't see what the browser receives. Copy the link, open ShoppingList from your home screen, then ⋯ → “Paste a list”.",
    copyLink: "Copy the link",
    linkCopied: "Link copied. Open the app, then ⋯ → “Paste a list”.",
    copyError: "Can't copy: keep the message and paste it from the app.",
    importHere: "Add the list here anyway",
    browserRecipeText:
      "On iPhone, the installed app can't see what the browser receives. Copy the link, open ShoppingList from your home screen, then Recipes → “Paste a recipe”.",
    linkCopiedRecipe:
      "Link copied. Open the app, then Recipes → “Paste a recipe”.",
    importRecipeHere: "Add the recipe here anyway",
  },
  shopping: {
    addPlaceholder: "Add…",
    start: "Let's go",
    resume: "Resume shopping",
    reopen: (time: string) => `Reopen shopping (${time})`,
    startTitle: "Go shopping",
    startText: "Which shop?",
    newStore: "Another shop",
    newStoreName: "Shop name",
    newStorePlaceholder: "Tesco, Saturday market…",
    newStoreHint:
      "Its aisles sort themselves out while you shop: tap an item once it's in the trolley, and “Next aisle” when you change aisle.",
    go: "Let's go",
    nextAisle: "Next aisle",
    nextAisleHint: "Items ticked next will go in a new aisle",
    emptyAisle:
      "Tap an item from “Unsorted” once it's in the trolley: it will be put in this aisle.",
    quit: "Leave shopping mode (the shopping stays open)",
    progress: (checked: number, total: number) => `${checked} / ${total}`,
    progressLabel: (checked: number, total: number) =>
      `${checked} of ${total} items in the trolley`,
    finish: "Finish",
    finishLong: "Finish shopping",
    finishTitle: "Finish shopping?",
    finishText: (count: number) =>
      count > 0
        ? `${count === 1 ? "1 item is left to get: it will stay" : `${count} items are left to get: they will stay`} in the list.`
        : "The ticked items leave the list.",
    finishConfirm: "Finish",
    cancel: "Keep shopping",
    pickUp: "To pick up",
    aislePassed: (label: string) =>
      `${label} already passed: it's waiting for you in “To pick up”.`,
    current: "You are here",
    aisleOpened: "New aisle: items ticked next will be put in it.",
    aisleStillEmpty:
      "You're already in a new, still empty aisle: tick an item from “Unsorted” to fill it.",
    swipeHint: "Swipe left: not taken · long press: change aisle",
    unavailable: "Not taken",
    moveAisle: "Change aisle",
    changeQuantity: (name: string) => `Change the quantity of ${name}`,
    unavailableToast: (name: string) => `${name}: not taken`,
    screenOnFailed: "The screen may go to sleep: this phone can't keep it on.",
    allDone: "Everything's in the trolley!",
    added: {
      title: (name: string) => `${name} added`,
      inAisle: (into: string) => `Put ${into}.`,
      alreadyTaken: "It's already in my trolley",
      otherAisle: "It's in another aisle…",
      ok: "OK, to get",
    },
    where: {
      title: (name: string) => `Where did you get ${name}?`,
      text: "So the app knows where to find it next time.",
      here: (into: string) => `Here, ${into}`,
      hereHint: "It will be put in this aisle for your next trips.",
      usual: (title: string) => `In its aisle: ${title}`,
      other: "In another aisle…",
    },
    move: {
      title: (name: string) => `Move ${name}`,
      text: "To which aisle of this shop?",
      hereSection: "The aisle you're in",
      withCategory: "Where its category is",
      others: "Other aisles",
      all: "The shop's aisles",
      current: "its current aisle",
      scopeTitle: (into: string) => `Put ${into}`,
      scopeText: (into: string) =>
        `The app will remember it for your next trips to this shop. What is found ${into}?`,
      onlyArticle: (name: string) => `Only ${name}`,
      onlyArticleHint: (category: string) =>
        `The other ${category} items stay where they are.`,
      wholeCategory: (category: string) => `The whole ${category} category`,
      wholeCategoryHint: (into: string) => `All its items will go ${into}.`,
      done: (name: string, label: string) => `${name} → ${label}`,
    },
    when: {
      today: "today",
      yesterday: "yesterday",
      /** « 18:02 », « 18:00 » : l'heure sur 24 heures, comme au Royaume-Uni. */
      clock: (hours: number, minutes: number) =>
        `${hours}:${String(minutes).padStart(2, "0")}`,
      /** « 42 min », « 1 h 05 min ». */
      duration: (hours: number, minutes: number) =>
        hours
          ? `${hours} h ${String(minutes).padStart(2, "0")} min`
          : `${minutes} min`,
    },
    stale: {
      title: (when: string) => `Did you finish your shopping from ${when}?`,
      text: "It was left open.",
      finish: "Finish",
      resume: "Continue",
    },
    recap: {
      title: "Shopping finished",
      summary: "Summary",
      bought: (count: number) =>
        count === 0 ? "No items bought" : `${items(count)} bought`,
      unavailable: (count: number) => `${count} not taken, left in the list`,
      duration: (duration: string) => `Time: ${duration}`,
      learned: "Aisle order updated for this shop.",
      back: "Back to the list",
      reopen: "Reopen shopping",
      missing: "This shopping trip is no longer available.",
    },
  },
  manage: {
    section: "My data",
    style: {
      icon: "Icon",
      color: "Colour",
      none: "None",
    },
    confirmCancel: "Cancel",
    backup: {
      section: "Backup",
      keep: "Keep a copy",
      restore: "Get a copy back",
      export: "Export a file",
      exportHint:
        "A file with your lists, shops, aisles, items and history, to keep in your files or cloud storage. Useful when changing phones or reinstalling the app: deleting it erases its data.",
      last: (days: number | undefined) =>
        days === undefined
          ? "No backup yet."
          : days === 0
            ? "Last backup: today."
            : `Last backup: ${days} ${plural(days, "day")} ago.`,
      exported: "Backup ready",
      copy: "Copy the data",
      copyHint:
        "The same backup, as text on the clipboard: paste it into a note or a message to keep it, then use “Paste the data” in the reinstalled app.",
      copied:
        "Data copied to the clipboard: paste it into a note or a message to keep it",
      copyFailed: "Can't copy: use “Export a file” instead.",
      paste: "Paste the data",
      pasteTitle: "Paste a backup",
      pasteText: "Paste the text of a copied backup here (long press → Paste).",
      pastePlaceholder: '{ "app": "ShoppingList", … }',
      pasteCheck: "Check the backup",
      invalidText: "This text isn't a ShoppingList backup.",
      import: "Import a file",
      importHint:
        "Replaces all the app's data with that of a backup, after confirmation.",
      importTitle: "Replace all your data?",
      importText: (
        date: string,
        articles: number,
        lists: number,
        stores: number,
      ) =>
        `Backup from ${date}: ${items(articles)}, ${lists} ${plural(lists, "list")}, ${stores} ${plural(stores, "shop")}. Your current data will be replaced; it's first kept in the automatic copies, at the bottom of this screen.`,
      importConfirm: "Replace my data",
      invalid: "This file isn't a ShoppingList backup.",
      newer:
        "This backup comes from a newer version of the app: update the app first.",
      imported: "Data imported",
      replaceFailed: "Replacing failed: your data hasn't changed.",
      copies: {
        section: "Automatic copies",
        hint: "Every day, the app keeps a copy of your data on the phone, for the last 7 days: to go back after a mistake, an import or an update. They disappear with the app: to change phones, export a file.",
        none: "No copy yet: the first one will be made the next time the app starts.",
        title: (date: string, beforeReplace: boolean) =>
          date.charAt(0).toLocaleUpperCase("en") +
          date.slice(1) +
          (beforeReplace ? ", before replacing" : ""),
        summary: (articles: number, lists: number, stores: number) =>
          `${items(articles)} · ${lists} ${plural(lists, "list")} · ${stores === 0 ? "no shops" : `${stores} ${plural(stores, "shop")}`}`,
        restoreTitle: (date: string) => `Go back to the copy from ${date}?`,
        restoreText:
          "All your current data (lists, shops, items, history) will be replaced by this copy's. It's copied first, and the copies stay: you can go back.",
        restoreConfirm: "Restore this copy",
      },
    },
    categories: {
      title: "Categories",
      hint: "Names, icons and colours, merging",
      count: items,
      add: "New category",
      newTitle: "New category",
      name: "Name",
      create: "Create the category",
      nameTaken: "Another category already has this name.",
      shortName: "Short name (optional)",
      shortNameHint:
        "Used in the title of the aisles that hold it (“Bread · Tea & coffee +2”).",
      system:
        "One of the app's categories: it can't be deleted. Its items go in “Unsorted”.",
      newHint: "Remember to put it in an aisle of each shop (Shops & aisles).",
      merge: "Merge with another category",
      mergeTitle: (name: string) => `Merge ${name} into…`,
      mergeText:
        "The chosen category takes over its items and aisles; this one disappears.",
      merged: (from: string, into: string) => `${from} merged into ${into}`,
      delete: "Delete the category",
      deleteTitle: (name: string) => `Delete ${name}?`,
      deleteText: (count: number) =>
        count === 0
          ? "It holds no items."
          : `${count === 1 ? "Its item will go" : `Its ${count} items will go`} into the chosen category.`,
      moveTo: "Move its items to",
      deleted: (name: string) => `Category ${name} deleted`,
      done: "Done",
    },
    units: {
      title: "Units",
      hint: "Weights, volumes, containers and their abbreviations",
      add: "New unit",
      newTitle: "New unit",
      singular: "Name (singular)",
      plural: "Plural",
      abbr: "Abbreviation",
      abbrHint:
        "Optional. Without an abbreviation: the full name (“2 bottles”).",
      group: "Type",
      factor: (base: string) => `Value in ${base}`,
      factorHint: (base: string) =>
        `How many ${base} in one unit: 1000 for a kilogram. Used for conversions.`,
      base: { mass: "grams", volume: "millilitres" },
      step: "Step of the − and + buttons",
      create: "Create the unit",
      nameTaken: "Another unit already has this name.",
      save: "Save",
      usage: (lines: number, articles: number) =>
        `Used by ${items(articles)} and ${lines} ${plural(lines, "line")}.`,
      delete: "Delete the unit",
      deleteTitle: (name: string) => `Delete “${name}”?`,
      deleteText:
        "The items and lines using it switch to the chosen unit, with the quantity converted when possible.",
      replaceWith: "Replace with",
      deleted: (name: string) => `Unit “${name}” deleted`,
    },
    icon: {
      title: "Icon",
      search: "Search for an icon",
      none: "None (initials)",
      noResult: "No icon matches.",
      change: "Change the icon",
      featured: "Dishes and desserts",
      others: "All icons",
    },
    articles: {
      title: "Items",
      hint: "Names, categories, units, kinds, icons",
      search: "Search for an item",
      allCategories: "All categories",
      count: items,
      add: "New item",
      create: "Create the item",
      exists: (name: string) => `“${name}” already exists`,
      duplicates: "Likely duplicates",
      duplicatesHint:
        "Same category, same icon and similar names. Merge them, or tell the app they really are two items.",
      merge: "Merge",
      notDuplicate: "These aren't duplicates",
      notDuplicateDone: "Got it, they won't be suggested again",
      noResult: "No items found.",
    },
    article: {
      name: "Name",
      nameTaken: "Another item already has this name.",
      category: "Category",
      unit: "Default unit",
      unitHint:
        "When no unit is given, the item takes the one you buy most, after 3 purchases. A unit or quantity chosen here takes priority.",
      unitFromUsage: (amount: string) =>
        `From your purchases: ${amount} when added.`,
      unitChosen: "Chosen by hand: it takes priority over your purchases.",
      unitFollowUsage: "Follow my purchases",
      quantity: "Default quantity",
      quantityHint: "Added when you don't give one (empty: 1).",
      types: "Kinds",
      typesHint: "The varieties you can choose on a line: Gala, Golden…",
      newType: "New kind",
      addType: "Add the kind",
      removeType: (type: string) => `Remove the kind ${type}`,
      aliases: "Other names",
      aliasesHint:
        "To find it under these names too when typing: kitchen roll, spuds, coke…",
      newAlias: "Other name",
      addAlias: "Add the name",
      removeAlias: (alias: string) => `Remove the name ${alias}`,
      favorite: "Favourite",
      favoriteHint: "Always at the top of the catalogue.",
      season: "Months in season",
      seasonHint:
        "The months when it's in season where you shop (mainland France). Tap a month to add or remove it. No months or all twelve: no “in season” badge.",
      countable: "Counted by the piece",
      countableHint: `A number typed on its own counts pieces: 3${nbsp}apples. Otherwise, portions of the default quantity: 2${nbsp}butters → 500${nbsp}g.`,
      usage: (lines: number, lists: number, recipes: number) =>
        [
          lines === 0
            ? "Not in any list yet."
            : lists === 1
              ? "In one list."
              : `In ${lists} lists.`,
          recipes === 0
            ? ""
            : recipes === 1
              ? "Used in one recipe."
              : `Used in ${recipes} recipes.`,
        ]
          .filter(Boolean)
          .join(" "),
      merge: "Merge with another item",
      mergeTitle: (name: string) => `Merge into ${name}`,
      mergeSearch: "Item to merge",
      mergeText: (keep: string, other: string) =>
        `${other} disappears: its lines and history move to ${keep}, and “${other}” becomes another name for ${keep}.`,
      mergeConfirm: "Merge",
      merged: (other: string, keep: string) => `${other} merged into ${keep}`,
      keep: (name: string) => `Keep ${name}`,
      delete: "Delete the item",
      deleteTitle: (name: string) => `Delete ${name}?`,
      deleteText: (lists: number, recipes: number) => {
        const where = [
          lists > 1 ? `the ${lists} lists` : lists === 1 ? "the list" : "",
          recipes > 1
            ? `the ${recipes} recipes`
            : recipes === 1
              ? "the recipe"
              : "",
        ].filter(Boolean);
        return where.length === 0
          ? "It disappears from the catalogue. Your shopping history stays."
          : `It disappears from the catalogue and from ${where.join(" and ")} it's in. Your shopping history stays.`;
      },
      deleted: (name: string) => `${name} deleted`,
      missing: "This item no longer exists.",
      edit: "Edit the item",
    },
    stores: {
      title: "Shops & aisles",
      hint: "Aisles, their order and the categories in each",
      aisles: (count: number) => `${count} ${plural(count, "aisle")}`,
      add: "New shop",
      emptyTitle: "No shops yet",
      emptyText:
        "The first one is created the first time you tap “Let's go”, and its aisles sort themselves out while you shop. You can also set it up from here.",
      newTitle: "New shop",
      name: "Shop name",
      from: "Starting aisles",
      fromCopy: "A copy",
      fromEmpty: "No aisles",
      emptyHint:
        "Its aisles sort themselves out on your first trips: tap an item once it's in the trolley, and “Next aisle” when you change aisle.",
      copyOf: "Copy the aisles of",
      create: "Create the shop",
    },
    store: {
      name: "Name",
      learn: "Learn the order of my shopping",
      learnHint:
        "When you finish shopping, the aisles you went through take the order you passed them in.",
      aisles: "Aisles",
      aislesHint:
        "Drag the handle to change the order; tap an aisle for its categories.",
      reorder: (name: string) => `Move ${name}`,
      categories: (count: number) =>
        count === 0
          ? "No categories"
          : count === 1
            ? "1 category"
            : `${count} categories`,
      always: "always last",
      addAisle: "New aisle",
      unattached: "Categories without an aisle",
      unattachedHint:
        "Their items go in “Unsorted”. Tap one to put it in an aisle.",
      place: (category: string) => `Put ${category} in an aisle`,
      placeHint: "Which aisle? It will be its main one.",
      overrides: "Exceptions",
      overridesHint:
        "Items put somewhere other than their category's aisle, for this shop.",
      removeOverride: (name: string) => `Remove the exception for ${name}`,
      overrideRemoved: (name: string) =>
        `${name} goes back to its category's aisle`,
      delete: "Delete the shop",
      deleteTitle: (name: string) => `Delete “${name}”?`,
      deleteText:
        "Its aisles and exceptions will be deleted. Your lists and shopping history stay.",
      deleteShopping:
        "There's shopping in progress in this shop: finish it first.",
      deleted: (name: string) => `“${name}” deleted`,
      edit: "Edit this shop",
      missing: "This shop no longer exists.",
    },
    aisle: {
      title: "Aisle",
      name: "Aisle name (optional)",
      nameHint:
        "Without a name, its title comes from its categories (shown in grey).",
      description: "Landmark (optional)",
      descriptionPlaceholder: "At the back of the shop, by the tills…",
      categories: "Categories",
      categoriesHint:
        "Filled: the category's main aisle (its items go there). Outline: it's found here too.",
      primary: "main",
      secondary: "also here",
      makePrimary: (category: string) => `${category}: make main`,
      makeSecondary: (category: string) => `${category}: make secondary`,
      removeCategory: (category: string) => `Remove ${category}`,
      addCategory: "Add a category",
      chooseCategory: "Choose a category",
      unsortedHint:
        "Items whose category doesn't have an aisle in this shop yet. When shopping, tap them once they're in the trolley: they're put in the aisle you're in.",
      merge: "Merge with another aisle",
      mergeTitle: (name: string) => `Merge ${name} into…`,
      mergeText:
        "The chosen aisle receives all its categories; this one disappears.",
      merged: (from: string, into: string) => `${from} merged into ${into}`,
      delete: "Delete the aisle",
      deleteTitle: (name: string) => `Delete ${name}?`,
      deleteText:
        "The categories whose main aisle this is will go in “Unsorted”.",
      deletePromote: "Or into one of their secondary aisles when they have one",
      deleted: (label: string) => `${label} deleted`,
      done: "Done",
    },
  },
  recipes: {
    title: "Recipes",
    search: "Search for a recipe",
    create: "New recipe",
    menu: "Recipe actions",
    menuDescription: "Add a recipe",
    count: (count: number) =>
      count === 0 ? "Recipes" : `${count} ${plural(count, "recipe")}`,
    noResult: "No recipe matches.",
    emptyTitle: "No recipes",
    emptyText:
      "Write a recipe down once: its ingredients can then be added to your list, for the number of people you want.",
    newTitle: "New recipe",
    name: "Name",
    namePlaceholder: "Olive loaf",
    yield: "Serves",
    yieldQuantity: "Number",
    yieldUnit: "Unit",
    yieldHint: "People, servings, loaf…: what the recipe makes.",
    yieldUnits: ["people", "servings", "loaf", "tart", "cake", "pieces"],
    createSubmit: "Create the recipe",
    missing: "This recipe no longer exists.",
    serves: (amount: string) => `Serves ${amount}`,
    edit: "Edit",
    editDone: "OK",
    ingredients: "Ingredients",
    noIngredients: "No ingredients yet.",
    noIngredientsEdit:
      "Add the ingredients with the bar at the bottom: “200 g of flour, 3 eggs”.",
    steps: "Method",
    noSteps: "No steps written down.",
    stepsPlaceholder: "1. Preheat the oven to 180 °C…",
    optional: "optional",
    fixed: "fixed quantity",
    addPlaceholder: "Add an ingredient…",
    addLabel: "Add the ingredient",
    addToList: "Add to a list",
    duplicate: "Duplicate",
    duplicateTitle: (name: string) => `Duplicate “${name}”`,
    duplicateName: "Name of the new recipe",
    duplicateSubmit: "Create the copy",
    duplicated: (name: string) => `“${name}” created`,
    delete: "Delete the recipe",
    deleteTitle: (name: string) => `Delete “${name}”?`,
    deleteText:
      "Ingredients already added to your lists stay there. The recipe itself can't be recovered.",
    deleted: (name: string) => `“${name}” deleted`,
    dishes: {
      soupe: { label: "Soup", keywords: ["cream soup", "broth", "potage"] },
      cake: { label: "Loaf cake", keywords: ["savoury cake", "sweet loaf"] },
      tarte: { label: "Tart", keywords: ["apple tart", "pie", "quiche"] },
      gateau: {
        label: "Cake",
        keywords: ["chocolate cake", "birthday", "layer cake"],
      },
      gratin: { label: "Gratin", keywords: ["potato bake", "oven bake"] },
      "salade-composee": {
        label: "Mixed salad",
        keywords: ["salad", "crudités"],
      },
    },
    ingredient: {
      optional: "Optional",
      optionalHint: "unticked when adding the recipe to a list",
      fixed: "Fixed quantity",
      fixedHint:
        "doesn't change with the number of people: one pot of cream for the raclette",
      remove: "Remove",
      done: "OK",
    },
    add: {
      title: (name: string) => `Add “${name}”`,
      into: (list: string) => `To the list “${list}”.`,
      list: "To the list",
      amount: "Serves",
      less: "Fewer",
      more: "More",
      ingredients: "Ingredients",
      hint: "Untick what you already have.",
      isNew: "to add",
      merged: (before: string, after: string) => `already ${before} → ${after}`,
      note: (before: string) => `already ${before}, added as a note`,
      empty: "This recipe has no ingredients yet.",
      apply: (count: number) =>
        count === 0
          ? "Nothing to add"
          : `Add ${count} ${plural(count, "ingredient")}`,
      done: (count: number, list: string) =>
        `${count} ${plural(count, "ingredient")} added to “${list}”`,
    },
  },
  season: {
    badge: "In season",
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    monthNames: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
  },
  catalog: {
    title: "Catalogue",
    search: "Search for an item",
    favorites: "Favourites",
    usual: "Regulars",
    categories: "Categories",
    seasonFilter: (month: string) => `In season (${month})`,
    seasonEmpty: "Nothing in season this month.",
    noResult: "No items found.",
    emptyCategory: "No items here",
    emptyCategoryText:
      "Type the name of a new item in the list's add bar to create it, or go to Settings → Items.",
    suggestions: "Items found",
    added: (name: string) => `${name} added to the list`,
    showAll: (count: number) => `See all ${count} results`,
    categoryResult: (count: number) =>
      `Category · ${count === 1 ? "its item" : `its ${count} items`}`,
    back: "Catalogue",
    quantityTitle: (name: string) => name,
    otherType: "Add another kind",
    removeLine: (label?: string) =>
      label ? `Remove the line “${label}”` : "Remove from the list",
    remove: "Remove from the list",
    done: "Done",
    count: items,
  },
  tour: {
    open: "Forgotten anything? Run through",
    openHint: (count: number) =>
      count === 1 ? "1 item to buy again" : `${count} items to buy again`,
    title: "Run-through",
    restock: "To buy again",
    restockIntro: "You usually buy more at this rate: it may be time.",
    restockDone: "Nothing else to buy again for now.",
    rhythm: (every: number, ago: number) =>
      // Insécables : la coupure tombe après « · », jamais dans « every 7 days ».
      `${days(ago)} ago · every${nbsp}${days(every)}`,
    notThisTime: "Not this time",
    notThisTimeLabel: (name: string) => `Not this time: ${name}`,
    categoryIntro: "What you usually get. A tap adds it to the list.",
    wholeCategory: (name: string) => `See all items: ${name}`,
    step: (index: number, total: number) => `${index}/${total}`,
    previous: "Previous",
    nextTo: (name: string) => `Next: ${name}`,
    finish: "Finish",
    emptyTitle: "No habits yet",
    emptyText:
      "After a few finished shopping trips, the app will know what you often get and suggest it here.",
    backToList: "Back to the list",
  },
  settings: {
    title: "Settings",
    dataIntro:
      "The heart of the app: your items, their categories, your shops' aisles. Everything can be changed here.",
    counts: {
      articles: items,
      categories: (n: number) => (n === 1 ? "1 category" : `${n} categories`),
      stores: (n: number) =>
        n === 0 ? "No shops" : `${n} ${plural(n, "shop")}`,
      units: (n: number) => `${n} ${plural(n, "unit")}`,
    },
    preferences: {
      title: "Preferences",
      hint: "Sounds, screen on, theme, language",
    },
    sectionFeatures: "Features",
    sectionApp: "App",
    sectionDisplay: "Display",
    theme: {
      title: "Theme",
      hint: "Automatic: follows the phone's light or dark setting.",
      options: { auto: "Automatic", dark: "Dark", light: "Light" },
    },
    language: {
      title: "Language",
      hint: "The app restarts in the chosen language.",
      confirmTitle: (name: string) => `Switch to ${name}?`,
      confirmText:
        "Items, categories and units from the starter catalogue that you haven't renamed take their name in this language, as does the first list. Anything you created or renamed keeps its name.",
      confirm: "Change language",
    },
    about: "About",
    unavailable: "Not available on this phone",
    sounds: {
      title: "Sounds",
      hint: "Little sounds when you add, tick or finish an aisle.",
      stateOff: "Off",
      stateAll: "On",
      stateSome: (on: number, total: number) => `${on} of ${total} sounds`,
    },
    keepScreenOn: {
      title: "Screen on",
      hint: "Only on two screens: shopping mode and a recipe's page. Elsewhere, the phone goes to sleep as usual.",
    },
  },
  soundsPage: {
    title: "Sounds",
    master: "App sounds",
    silentIos:
      "The iPhone's silent mode always has the last word: when it's on, no sound plays, even if the app's sounds are on.",
    silentOther:
      "The sounds play at the phone's media volume: turn it down to make them quieter.",
    listen: (label: string) => `Play “${label}”`,
    events: {
      add: "Item added",
      check: "Item ticked",
      aisleDone: "Aisle finished",
      done: "Shopping finished",
      remove: "Removal",
      error: "Action not possible",
    },
  },
  about: {
    title: "About",
    tagline:
      "A shopping list that sorts itself in the order of your route through the shop.",
    version: "Version",
    build: "Built on",
    source: "Source code",
    licences: "Licences",
    licencesHint: "Libraries used by the app",
    releaseNotes: "What's new",
    releaseNotesHint: "What changed in each version",
    channels: {
      production: "",
      preprod: "pre-production",
      preview: "preview",
      dev: "development",
    },
    updates: {
      check: "Check for an update",
      checking: "Checking…",
      upToDate: "The app is up to date.",
      available:
        "A new version is ready: tap “Update” at the bottom of the screen.",
      failed: "No answer from the server. Check your connection and try again.",
      unavailable: "Updates aren't available in this development version.",
    },
  },
  devUi: {
    title: "Mock-up",
    link: "Component mock-up",
    linkHint: "Outside production: colours, icons, sounds",
    intro:
      "A preview of the app's elements with fake data, to check how they look on the phone.",
    colors: "Colours",
    typography: "Typography",
    typeTitle: "Screen title",
    typeBody: "Text of a list line",
    typeMuted: "Secondary text: notes, kinds, descriptions",
    buttons: "Buttons",
    letsGo: "Let's go",
    outline: "Secondary",
    delete: "Delete",
    listen: "Play",
    toggle: "Switch",
    list: "List sorted by category",
    shopping: "Shopping mode",
    shoppingHint:
      "Tap a line to tick it: it slides to the bottom of the aisle.",
    catalog: "Catalogue",
    sheet: "Sheet",
    openSheet: "Open the sheet",
    sheetTitle: "Milk",
    sheetText: "Already in the list: 6 litres.",
    sheetAdd: "Add 1 litre",
    sheetNothing: "Do nothing",
    sounds: "Sounds",
    soundsHint: "The app's sounds, to play one by one.",
    icons: (count: number) => `Item icons (${count})`,
    iconsHint:
      "The pack built into the app, available offline. A monogram stands in for missing icons.",
    addBar: "Add bar",
    addPlaceholder: "Add one or more items…",
    add: "Add",
    added: (text: string) => `“${text}” added (mock-up)`,
  },
  licences: {
    title: "Licences",
    intro:
      "ShoppingList is built with these open-source libraries. Tap a line to read its licence.",
    unknown: "licence not specified",
    noText: "Licence text not provided by the library.",
    unavailable: "List available in the installed version of the app.",
  },
  /**
   * Nouveautés de chaque version, en anglais : les mêmes versions que dans `fr.ts`
   * (`npm run release` vérifie les deux langues).
   */
  releaseNotes: {
    title: "What's new",
    version: (version: string) => `Version ${version}`,
    versions: [
      {
        version: "1.2.2",
        date: "2026-11-24",
        items: [
          "Bug fixes and user experience improvements.",
          "Visual improvements to the light and dark themes.",
        ],
      },
      {
        version: "1.2.1",
        date: "2026-11-23",
        items: [
          "Swiping to delete a line no longer scrolls the page once the line has gone left, and a long swipe deletes even if your finger drifts a little.",
        ],
      },
      {
        version: "1.2.0",
        date: "2026-11-23",
        items: [
          "“Forgotten anything? Run through”, above the list: first what's due to be bought again based on how often you buy it (“Not this time” sets it aside until your next shop), then your usual items, category by category.",
          "Seasons: a green leaf marks the fruit, vegetables and herbs in season this month, and the Catalogue's “In season” chip shows them all. The months can be changed on the item's page.",
          "An item added without a unit takes the one you buy most for it, after 3 purchases (“1 kg of apples” if that's your habit). A unit or quantity chosen on its page takes priority.",
          "No more scrolling: “Let's go” is at the top of the list, and the end-of-shopping summary starts with “Back to the list”. Swiping to delete a line needs a firmer gesture, so you no longer delete while scrolling.",
        ],
      },
      {
        version: "1.1.1",
        date: "2026-11-19",
        items: [
          "Recipes: new units “glass” and “decilitre”. A spoonful, a pinch or a glass isn't something you buy: when added to a list, the item comes in its usual unit (1 bottle of white wine) and the recipe's quantity goes in the note. Typed in the list, “1 glass of wine” also adds the wine in its usual unit.",
          "A bulleted list copied from Notes or another app can be pasted in one go into the add bar: one item per bullet.",
          "Recipes: “New recipe” and “Paste a recipe” move to the ⋯ menu, to leave room for the recipes.",
        ],
      },
      {
        version: "1.1.0",
        date: "2026-11-19",
        items: [
          "Sharing a list or a recipe: send it by message, and the other person pastes it into their app (⋯ → “Paste a list”, or Recipes → “Paste a recipe”).",
          "Code optimisation.",
        ],
      },
      {
        version: "1.0.1",
        date: "2026-11-16",
        items: ["Bug fixes and user experience improvements."],
      },
      {
        version: "1.0.0",
        date: "2026-11-16",
        items: [
          "Your shopping list, sorted by category at home and by aisle in the shop, in the order of your route.",
          "Lightning-fast adding: “3 tomatoes, butter and 6 eggs”, by keyboard or dictation.",
          "483 items, each with its own icon drawn for the app. Everything can be changed: items, categories, aisles, shops, units.",
          "Each shop builds itself while you shop: tick in order, and “Next aisle” when you change aisle. Next time, the list follows that route.",
          "Recipes: write a recipe down once, then add its ingredients to your list for the number of people you want. Quantities are recalculated and added to those already in the list.",
          "Several lists, backup and automatic copies on the phone, dark or light theme, and the app works offline.",
        ],
      },
    ],
  },
  install: {
    title: "Install the app",
    intro:
      "ShoppingList works like an app installed on your home screen: full screen, offline, and your data stays on your phone.",
    iosWarning:
      "On iPhone, the installed app and the browser don't share their data: install it before you start.",
    iosChromeSteps: [
      "Tap the Share button in Chrome's address bar.",
      "Choose “Add to Home Screen”.",
      "Tap “Add”, then open the app from its icon.",
    ],
    iosSafariSteps: [
      "Tap the Share button at the bottom of the screen.",
      "Choose “Add to Home Screen”.",
      "Tap “Add”, then open the app from its icon.",
    ],
    androidButton: "Install the app",
    androidManual:
      "If the button stays greyed out: Chrome's ⋮ menu → “Install app”.",
    otherText: "Use your browser's menu to install the app, if it allows it.",
    continue: "Continue in the browser",
  },
  update: {
    available: "New version available",
    availableVersion: (version: string) => `Version ${version} available`,
    action: "Update",
    applying: "Updating…",
  },
};
