import { Trash2 } from "lucide-react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { type ReactNode, useRef } from "react";
import { cn } from "@/ui/utils";

/**
 * Distance du doigt (px) au-delà de laquelle le geste agit : 40 % d'une ligne de 390 px.
 * Un geste rapide suffit, mais pas en dessous de la moitié de cette distance.
 */
const DISTANCE = 150;
const FLICK_SPEED = 900;
/** Le geste doit être nettement horizontal : un défilement en diagonale n'agit pas. */
const MAX_SLOPE = 0.5;
/** Retenue de la ligne : elle avance moins vite que le doigt. */
const ELASTIC = 0.7;

/**
 * Glisser une ligne vers la gauche pour une action (retirer, introuvable). Le
 * défilement vertical reste libre ; un glissement ne déclenche pas le tap de la ligne.
 * Le geste doit être long (ou rapide) et horizontal : le pouce qui fait défiler la
 * liste en partant d'une ligne, un peu en diagonale, ne la retire pas.
 */
export function SwipeAction({
  label,
  icon,
  className,
  onSwipe,
  children,
}: {
  label: string;
  icon: ReactNode;
  /** Fond et couleur révélés sous la ligne. */
  className: string;
  onSwipe: () => void;
  children: ReactNode;
}) {
  const x = useMotionValue(0);
  // L'icône est pleine quand le geste agirait.
  const opacity = useTransform(x, [-DISTANCE * ELASTIC, -24], [1, 0]);
  const dragged = useRef(false);

  return (
    <div className="relative overflow-hidden">
      <motion.div
        aria-hidden
        style={{ opacity }}
        className={cn(
          "absolute inset-0 flex items-center justify-end pr-5 [&_svg]:size-5",
          className,
        )}
      >
        {icon}
      </motion.div>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: ELASTIC, right: 0 }}
        dragSnapToOrigin
        style={{ x, touchAction: "pan-y" }}
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={(_, info) => {
          setTimeout(() => {
            dragged.current = false;
          }, 50);
          const { offset, velocity } = info;
          const horizontal = Math.abs(offset.y) <= -offset.x * MAX_SLOPE;
          const far = offset.x < -DISTANCE;
          const flick = velocity.x < -FLICK_SPEED && offset.x < -DISTANCE / 2;
          if (horizontal && (far || flick)) onSwipe();
        }}
        onClickCapture={(event) => {
          if (!dragged.current) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        // Un `div` n'a pas de nom pour VoiceOver : groupe nommé (le geste a son
        // équivalent en bouton dans le panneau de la ligne).
        role="group"
        aria-label={label}
        // Fond opaque qui cache l'action ; celui du bloc parent (`--row-bg`), sinon --surface.
        className="relative bg-(--row-bg,var(--surface))"
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Glisser vers la gauche pour supprimer (docs/03 B4). */
export function SwipeToDelete({
  label,
  onDelete,
  children,
}: {
  label: string;
  onDelete: () => void;
  children: ReactNode;
}) {
  return (
    <SwipeAction
      label={label}
      icon={<Trash2 />}
      className="bg-danger/15 text-danger"
      onSwipe={onDelete}
    >
      {children}
    </SwipeAction>
  );
}
