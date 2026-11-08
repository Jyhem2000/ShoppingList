import { Outlet } from "react-router";
import { TabBar } from "./TabBar";

/** Coquille de l'app : contenu + barre d'onglets, en respectant les zones de sécurité. */
export function Layout() {
  return (
    <div className="min-h-dvh bg-bg">
      <main className="mx-auto max-w-xl pt-[env(safe-area-inset-top)] pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
