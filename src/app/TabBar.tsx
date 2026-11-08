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

/** Barre d'onglets du bas (docs/04 § 1). L'onglet Recettes arrivera en v1.1. */
export function TabBar() {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-xl">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-xs font-bold transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
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
