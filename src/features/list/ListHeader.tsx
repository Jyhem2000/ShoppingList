import { ChevronDown, Ellipsis } from "lucide-react";
import { fr } from "@/i18n/fr";

const t = fr.list;

/**
 * En-tête de la liste (docs/04 § 2.1) : nom de la liste courante (changer de liste)
 * et menu. Pas de magasin : il se choisit au départ des courses. Reste visible en haut, comme les autres en-têtes.
 */
export function ListHeader({
  listName,
  onChooseList,
  onMenu,
}: {
  listName: string;
  onChooseList: () => void;
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
          {/* Centré sur les majuscules du nom, pas sur la hauteur de ligne : 2 px plus haut. */}
          <ChevronDown
            className="size-5 shrink-0 -translate-y-0.5 text-primary"
            aria-hidden
          />
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
    </header>
  );
}
