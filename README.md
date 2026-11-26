# ShoppingList

**English** · [Français](README.fr.md)

**A shopping list that sorts itself in the order you walk through the store.**

No more walking back to the dairy aisle because you forgot the butter: the app sorts your list aisle by aisle, in the order of **your** store, and learns that route as you shop.

## What it does

- ⚡ **Quick add**: type `3 tom`, press Enter, done. Understands "500 g of flour", "half a dozen eggs", "apples gala" (and the same in French).
- 🗺️ **Sorted by aisle** for the store you pick: its aisles are created during your first trips, the way they really are.
- 🧠 **Learns the aisle order** from the order in which you tick your items.
- 🛒 **Shopping mode**: big rows, aisles that fold up once done, screen that stays on, a warning when you add an item from an aisle you already passed, end of shopping (and reopening if you forgot something at the checkout).
- ✏️ **Everything can be edited**: items, categories, aisles, stores, units.
- 🍲 **Recipes**: add a recipe for 6 people or 2 cakes, the ingredients are scaled and added to your list.
- 📤 **Sharing**: send a list or a recipe to someone who imports it into their app (iPhone ↔ Android). You can also paste a list written by hand.
- 💡 **Don't forget** _(v1.2)_: the app reminds you of what you usually buy, and shows which fruit and vegetables are in season.
- 🌍 **English or French**: the interface and the starter catalogue, in British English (American words such as eggplant or zucchini work too). The app starts in your phone's language; Settings → Preferences → Language switches it.
- 🔒 **No account, no server, no ads, free.** Your data stays on your phone and the app works offline.

## How to use it

1. **Fill your list** with the bar at the bottom (`2 baguettes, butter`) or the catalogue. It sorts itself by category; in the store, it sorts by aisle, in the order of your route.
2. **In the store**, tap **Let's go** and pick the shop (or name it, the first time). The first time, everything is in "Unsorted": tap each item when it is in the trolley, and **Next aisle** when you move to another aisle; the shop is saved the way you walked through it. Tap a row when the item is in the trolley; swipe it left if you don't take it (not found, no longer needed…): it stays on the list; long-press to say it is in another aisle.
3. **Something comes to mind on the way**: add it with the bar. If you already took it, choose "It's already in my trolley"; if it is not in the expected aisle, "It's in another aisle…". If its aisle is already behind you, it waits at the top in "To pick up".
4. **At the checkout**, tap **Finish**. Forgot something? "Reopen shopping" on the list, as long as you haven't started a new trip.
5. **Share**: `⋯` → "Share the list" (or, on a recipe, "Share the recipe") sends a message through Messages, WhatsApp… The other person copies the message, then in their app `⋯` → "Paste a list" (or Recipes → `⋯` → "Paste a recipe"); on Android, tapping the link is often enough.

### Your data

Everything stays on your phone. Remember to use **Settings → Backup → Export a file** now and then: the file goes to Files or Drive, and "Import a file" puts everything back (new phone, reinstall). The app also keeps one automatic copy per day (7 days), to undo a mistake. New catalogue items arrive with updates, without reinstalling.

### What the app sets up on its own

Nothing to configure beforehand: your store is built during your first trips, then the app adapts each time you finish shopping.

- **Aisle order**: the aisles where you ticked something are arranged in the order you walked through them. Only the **order of the ticks** counts, not the time: a break or waiting at the deli counter changes nothing. Going back (an item forgotten and picked up at the end) doesn't send an aisle to the end. Aisles you didn't visit keep their place.
- **Item order within each aisle**: same idea, based on the order in which you pick them up.
- **An item's aisle**: when you move it (long press), the app remembers your choice for that store, for that item only or for its whole category.
- **Your habits**: the items you buy often come first when you type in the bar.

**Tip**: in a new store, follow your usual route during the first trips and tick each item when you pick it up, not at the checkout: the app learns faster and better.

Each store has its own order: learning one doesn't change the others. A trip reopened and finished again is never counted twice.

## Installation

Optimised for **Chrome** on iPhone and Android. Address: **https://shoppinglist.jyhem.cloud**.

**iPhone (Chrome)**

1. Open the address in Chrome.
2. **Share** button (in the address bar) → **Add to Home Screen** → **Add**.
3. Launch the app from its home screen icon.

> Important: install the app **before** you start using it. On iPhone, the installed app and the browser don't share their data.

**Android (Chrome)**

1. Open the address in Chrome.
2. Tap **Install the app** (button offered by the app, or menu ⋮ → _Install app_).

## Project status

Available today: list, catalogue, shopping mode, stores built while shopping, recipes, sharing, don't forget, seasonal produce, English and French. Coming next: seasons by region ([roadmap](docs/09-feuille-de-route.md)). Specification in [`docs/`](docs/README.md) (in French).

## For developers

All the technical documentation (features, architecture, tests, roadmap) is in [`docs/`](docs/README.md), in French.
