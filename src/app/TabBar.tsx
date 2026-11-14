import { LayoutGrid, ListChecks, Settings } from "lucide-react";
import { NavLink } from "react-router";
import { fr } from "@/i18n/fr";
import { cn } from "@/ui/utils";
import { routes } from "./routes";

const tabs = [
  { to: routes.list, label: fr.tabs.list, icon: ListChecks, end: true },
  { to: routes.catalog, label: fr.tabs.catalog, icon: LayoutGrid, end: false },
  { to: routes.settings, label: fr.tabs.settings, icon: Settings, end: false },
];

/**
 * Barre d'onglets du bas (docs/04 § 1). L'onglet Recettes arrivera en v1.1.
 * Sur iPhone, les deux tiers de la zone de la barre d'accueil sont ajoutés à la
 * hauteur des onglets : icônes et libellés restent centrés sans toucher la barre.
 */
export function TabBar() {
  return (
    <nav
      aria-label={fr.tabs.navigation}
      className="shrink-0 border-t border-border bg-surface pb-[calc(env(safe-area-inset-bottom)_/_3)]"
    >
      <ul className="mx-auto flex max-w-xl">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "-mt-px flex h-[calc(3.25rem_+_env(safe-area-inset-bottom)_*_2_/_3)] flex-col items-center justify-center gap-1 border-t-2 text-[11px] font-bold transition-colors",
                  isActive
                    ? "border-secondary-fill text-secondary"
                    : "border-transparent text-muted-foreground",
                )
              }
            >
              <Icon className="size-6" aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
