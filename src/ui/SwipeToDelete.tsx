import { Trash2 } from "lucide-react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { type ReactNode, useRef } from "react";
import { cn } from "@/ui/utils";

const THRESHOLD = 100;

/**
 * Glisser une ligne vers la gauche pour une action (retirer, introuvable). Le
 * défilement vertical reste libre ; un glissement ne déclenche pas le tap de la ligne.
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
  const opacity = useTransform(x, [-THRESHOLD, -24], [1, 0]);
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
        dragElastic={{ left: 0.7, right: 0 }}
        dragSnapToOrigin
        style={{ x, touchAction: "pan-y" }}
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={(_, info) => {
          setTimeout(() => {
            dragged.current = false;
          }, 50);
          if (info.offset.x < -THRESHOLD || info.velocity.x < -700) onSwipe();
        }}
        onClickCapture={(event) => {
          if (!dragged.current) return;
          event.preventDefault();
          event.stopPropagation();
        }}
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
