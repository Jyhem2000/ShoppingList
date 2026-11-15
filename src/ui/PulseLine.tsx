import { useAnimate, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect } from "react";
import { takePulse, usePulse } from "@/ui/pulse";

/**
 * Enveloppe une ligne de liste : quand `pulse(id)` la désigne, elle défile jusqu'à
 * l'écran et grossit un instant (docs/05 § 6) — tout de suite si elle est affichée,
 * sinon dès que l'écran a déplié son groupe.
 */
export function PulseLine({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduced = useReducedMotion();
  const signal = usePulse();

  useEffect(() => {
    if (!takePulse(signal, id)) return;
    const element = scope.current;
    element.scrollIntoView({
      block: "nearest",
      behavior: reduced ? "auto" : "smooth",
    });
    if (reduced) return;
    // Après la fermeture du panneau qui la cachait.
    void animate(
      element,
      { scale: [1, 1.04, 1] },
      { duration: 0.45, delay: 0.25, ease: "easeInOut" },
    );
  }, [signal, id, animate, scope, reduced]);

  return <div ref={scope}>{children}</div>;
}
