import { useAnimate, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useRef } from "react";
import { usePulse } from "@/ui/pulse";

/**
 * Enveloppe une ligne de liste : quand `pulse(id)` la désigne, elle défile jusqu'à
 * l'écran et grossit un instant (docs/05 § 6).
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
  const count = usePulse(id);
  // Un signal déjà passé quand la ligne apparaît (retour sur l'écran) ne compte pas.
  const seen = useRef(count);

  useEffect(() => {
    if (count === 0 || count === seen.current) return;
    seen.current = count;
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
  }, [count, animate, scope, reduced]);

  return <div ref={scope}>{children}</div>;
}
