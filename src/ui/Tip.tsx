import { motion } from "motion/react";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePreferences } from "@/app/preferences";
import { fr } from "@/i18n/fr";
import { dismissTip, type TipId } from "./tips";

/**
 * Bulle d'aide montrée une seule fois (docs/03 H12) : l'écran s'assombrit sauf
 * l'élément visé (`target`, sélecteur CSS), une bulle avec une flèche l'explique ; un
 * toucher n'importe où la ferme. Sans élément visé, la bulle est au centre.
 */
export function Tip({
  id,
  text,
  target,
  show = true,
}: {
  id: TipId;
  text: string;
  target?: string;
  show?: boolean;
}) {
  const { seenTips } = usePreferences();
  const visible = show && !seenTips.includes(id);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!visible || !target) return;
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
  }, [visible, target]);

  if (!visible || (target && !rect)) return null;

  const pad = 6;
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
      onClick={() => {
        dismissTip(id);
      }}
      className="fixed inset-0 z-50"
    >
      {rect ? (
        // L'élément visé reste éclairé : une découpe dans le voile sombre.
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-2xl ring-2 ring-primary"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.6)",
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-black/60" />
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
