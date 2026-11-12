import { ChevronDown, Ellipsis, Store } from "lucide-react";
import { fr } from "@/i18n/fr";

const t = fr.list;

/**
 * En-tête de la liste (docs/04 § 2.1) : nom de la liste courante (changer de
 * liste), magasin d'affichage, menu. Reste visible en haut, comme les autres en-têtes.
 */
export function ListHeader({
  listName,
  storeName,
  onChooseList,
  onChooseStore,
  onMenu,
}: {
  listName: string;
  storeName?: string;
  onChooseList: () => void;
  onChooseStore: () => void;
  onMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 mb-2 border-b border-transparent bg-bg px-4 pt-7 pb-2 group-data-[scrollable]/main:border-border">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onChooseList}
          aria-label={`${listName} — ${t.chooseList}`}
          className="-my-1.5 flex min-h-11 min-w-0 flex-1 items-center gap-1 text-left"
        >
          <h1 className="truncate text-2xl font-extrabold tracking-tight text-primary">
            {listName}
          </h1>
          <ChevronDown className="size-5 shrink-0 text-primary" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onMenu}
          aria-label={t.menu}
          className="-my-1.5 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-xl text-secondary active:bg-raised"
        >
          <Ellipsis className="size-6" aria-hidden />
        </button>
      </div>
      <button
        type="button"
        onClick={onChooseStore}
        aria-label={`${storeName ?? ""} — ${t.chooseStore}`}
        className="mt-1 -ml-1 flex min-h-11 items-center gap-1.5 rounded-xl px-1 text-sm font-semibold text-muted-foreground active:bg-raised"
      >
        <Store className="size-4 text-secondary" aria-hidden />
        <span className="truncate">{storeName}</span>
        <ChevronDown className="size-4" aria-hidden />
      </button>
    </header>
  );
}
