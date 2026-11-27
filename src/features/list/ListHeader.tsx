import { ChevronDown } from "lucide-react";
import { texts } from "@/i18n";
import { MenuButton } from "@/ui/MenuButton";
import { PageHeader, PageTitle } from "@/ui/Page";

const t = texts.list;

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
    <PageHeader
      title={
        <button
          type="button"
          onClick={onChooseList}
          aria-label={`${listName} — ${t.chooseList}`}
          className="-my-1.5 flex min-h-11 w-full items-center gap-2 text-left"
        >
          <PageTitle>{listName}</PageTitle>
          {/* Centré sur les majuscules du nom (de leur sommet à la ligne de base, mesurés),
              pas sur la hauteur de ligne : 1 px plus bas. */}
          <ChevronDown
            className="size-5 shrink-0 translate-y-px text-primary"
            aria-hidden
          />
        </button>
      }
      action={<MenuButton label={t.menu} onClick={onMenu} />}
    />
  );
}
