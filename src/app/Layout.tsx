import { MotionConfig } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  NavigationType,
  Outlet,
  useLocation,
  useNavigationType,
} from "react-router";
import { Toaster } from "@/ui/Toaster";
import { UpdateBanner } from "./pwa/UpdateBanner";
import { routes } from "./routes";
import { TabBar } from "./TabBar";

/**
 * Coquille de l'app (docs/04 § 1), dans le cadre fixe posé par App : le contenu qui
 * défile à l'intérieur et la barre d'onglets en bas, dans le flux.
 * La page elle-même ne défile jamais : dans l'app installée sur iPhone, le défilement
 * de la page déplace la zone visible au lancement et laissait une bande sous les onglets.
 * La barre de défilement du contenu est masquée : iOS la dessinait au-dessus du
 * titre, sous la barre d'état.
 * En mode courses, la barre d'onglets est masquée (docs/04 § 1).
 *
 * Défilement : chaque écran s'ouvre en haut, sauf au retour (bouton « Retour » de
 * l'en-tête, retour d'Android) où il retrouve la position qu'il avait. Le contenu se
 * charge après coup (base locale) : la position est reprise dès qu'il est assez haut,
 * sauf si l'utilisateur touche l'écran entre-temps.
 */
export function Layout() {
  const main = useRef<HTMLElement>(null);
  const location = useLocation();
  const navigationType = useNavigationType();
  const { pathname } = location;
  const shopping = pathname.startsWith(routes.shopping);

  // Position de chaque écran, et position à reprendre quand le contenu sera chargé.
  const positions = useRef(new Map<string, number>());
  const shown = useRef(pathname);
  const pending = useRef<number | undefined>(undefined);
  const resume = () => {
    const area = main.current;
    const target = pending.current;
    if (!area || target === undefined) return;
    area.scrollTo(0, target);
    if (Math.abs(area.scrollTop - target) <= 1) pending.current = undefined;
  };

  useLayoutEffect(() => {
    shown.current = location.pathname;
    const state = location.state as { back?: boolean } | null;
    const back = navigationType === NavigationType.Pop || state?.back === true;
    pending.current = back
      ? positions.current.get(location.pathname)
      : undefined;
    main.current?.scrollTo(0, 0);
    resume();
    // Au-delà d'une seconde, le contenu ne viendra plus : on n'insiste pas.
    const timer = setTimeout(() => {
      pending.current = undefined;
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [location, navigationType]);

  useEffect(() => {
    const area = main.current;
    if (!area) return;
    const save = () => {
      positions.current.set(shown.current, area.scrollTop);
    };
    const cancel = () => {
      pending.current = undefined;
    };
    area.addEventListener("scroll", save, { passive: true });
    area.addEventListener("touchstart", cancel, { passive: true });
    area.addEventListener("wheel", cancel, { passive: true });
    return () => {
      area.removeEventListener("scroll", save);
      area.removeEventListener("touchstart", cancel);
      area.removeEventListener("wheel", cancel);
    };
  }, []);

  // Le contenu dépasse-t-il de la zone ? (bordure sous l'en-tête, voir PageHeader)
  const content = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    const area = main.current;
    const inner = content.current;
    if (!area || !inner) return;
    const update = () => {
      setScrollable(area.scrollHeight > area.clientHeight + 1);
      resume();
    };
    const observer = new ResizeObserver(update);
    observer.observe(area);
    observer.observe(inner);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    // Animations toujours, sauf si le téléphone demande de les réduire (docs/03 H1).
    <MotionConfig reducedMotion="user">
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
        {!shopping && <TabBar />}
      </div>
    </MotionConfig>
  );
}
