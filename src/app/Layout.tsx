import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { Toaster } from "@/ui/Toaster";
import { UpdateBanner } from "./pwa/UpdateBanner";
import { TabBar } from "./TabBar";

/**
 * Coquille de l'app (docs/04 § 1), dans le cadre fixe posé par App : le contenu qui
 * défile à l'intérieur et la barre d'onglets en bas, dans le flux.
 * La page elle-même ne défile jamais : dans l'app installée sur iPhone, le défilement
 * de la page déplace la zone visible au lancement et laissait une bande sous les onglets.
 * La barre de défilement du contenu est masquée : iOS la dessinait au-dessus du
 * titre, sous la barre d'état.
 */
export function Layout() {
  const main = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  // Chaque écran s'ouvre en haut.
  useEffect(() => {
    main.current?.scrollTo(0, 0);
  }, [pathname]);

  // Le contenu dépasse-t-il de la zone ? (bordure sous l'en-tête, voir PageHeader)
  const content = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    const area = main.current;
    const inner = content.current;
    if (!area || !inner) return;
    const update = () => {
      setScrollable(area.scrollHeight > area.clientHeight + 1);
    };
    const observer = new ResizeObserver(update);
    observer.observe(area);
    observer.observe(inner);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        <main
          ref={main}
          data-scrollable={scrollable || undefined}
          className="group/main scrollbar-none h-full overflow-y-auto overscroll-contain"
        >
          <div ref={content} className="mx-auto max-w-xl pb-4">
            <Outlet />
          </div>
        </main>
        <Toaster />
        <UpdateBanner />
      </div>
      <TabBar />
    </div>
  );
}
