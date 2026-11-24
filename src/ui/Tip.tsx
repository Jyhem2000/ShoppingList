import { motion } from "motion/react";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { fr } from "@/i18n/fr";
import { cn } from "@/ui/utils";

/**
 * Bulle d'aide (docs/03 H12) : l'écran s'assombrit sauf
 * l'élément visé (`target`, sélecteur CSS), une bulle avec une flèche l'explique ; un
 * toucher n'importe où la ferme (`onDismiss`). Sans élément visé, la bulle est au
 * centre. Ce qui a déjà été vu est géré par l'appelant (`show`). `pad` : écart entre
 * l'élément et sa découpe (négatif : la découpe reste à l'intérieur, pour une ligne
 * d'un bloc de rayon qui ne doit pas déborder du bloc).
 */
export function Tip({
  text,
  target,
  show = true,
  pad = 6,
  onDismiss,
}: {
  text: string;
  target?: string;
  show?: boolean;
  pad?: number;
  onDismiss: () => void;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!show || !target) return;
    const measure = () => {
      const element = document.querySelector(target);
      setRect(element?.getBoundingClientRect() ?? null);
    };
    document.querySelector(target)?.scrollIntoView({ block: "nearest" });
    measure();
    // Une animation (dépliage, liste) peut encore déplacer l'élément.
    const timer = setTimeout(measure, 350);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [show, target]);

  if (!show || (target && !rect)) return null;

  const below = rect ? rect.bottom + 180 < window.innerHeight : false;
  // La bulle : 16 px de marge, 384 px au plus, centrée ; la flèche vise l'élément.
  const width = Math.min(window.innerWidth - 32, 384);
  const left = (window.innerWidth - width) / 2;
  const arrowX = rect
    ? Math.min(Math.max(rect.left + rect.width / 2 - left, 24), width - 24)
    : 0;

  return createPortal(
    <motion.div
      role="dialog"
      aria-label={text}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onDismiss}
      className="fixed inset-0 z-50"
    >
      {rect ? (
        // L'élément visé reste éclairé : une découpe dans le voile sombre.
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute ring-2 ring-primary",
            pad > 0 ? "rounded-2xl" : "rounded-lg",
          )}
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px var(--overlay)",
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-overlay" />
      )}
      <div
        className="absolute inset-x-4 mx-auto max-w-sm"
        style={
          rect
            ? below
              ? { top: rect.bottom + pad + 14 }
              : { bottom: window.innerHeight - rect.top + pad + 14 }
            : { top: "40%" }
        }
      >
        {rect && (
          <span
            aria-hidden
            className="absolute size-4 rotate-45 bg-primary"
            style={{
              left: arrowX - 8,
              ...(below ? { top: -7 } : { bottom: -7 }),
            }}
          />
        )}
        <div className="relative rounded-2xl bg-primary px-4 py-3 text-on-primary shadow-lg">
          <p className="font-semibold">{text}</p>
          <p className="mt-1 text-sm opacity-80">{fr.tips.dismiss}</p>
        </div>
      </div>
    </motion.div>,
    document.body,
  );
}
