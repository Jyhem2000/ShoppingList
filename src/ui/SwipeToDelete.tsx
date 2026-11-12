import { Trash2 } from "lucide-react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { type ReactNode, useRef } from "react";

const THRESHOLD = 100;

/**
 * Glisser vers la gauche pour supprimer (docs/03 B4). Le défilement vertical reste
 * libre ; un glissement ne déclenche pas le tap de la ligne.
 */
export function SwipeToDelete({
  label,
  onDelete,
  children,
}: {
  label: string;
  onDelete: () => void;
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
        className="absolute inset-0 flex items-center justify-end bg-danger/15 pr-5 text-danger"
      >
        <Trash2 className="size-5" />
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
          if (info.offset.x < -THRESHOLD || info.velocity.x < -700) onDelete();
        }}
        onClickCapture={(event) => {
          if (!dragged.current) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        aria-label={label}
        className="relative bg-surface"
      >
        {children}
      </motion.div>
    </div>
  );
}
