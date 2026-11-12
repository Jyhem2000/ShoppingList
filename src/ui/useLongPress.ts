import { type MouseEvent, type PointerEvent, useRef } from "react";

const LONG_PRESS_MS = 500;
/** Au-delà de ce déplacement du doigt, ce n'est plus un appui long (défilement, glissement). */
const LONG_PRESS_SLOP = 10;

/**
 * Appui long sur un bouton (changer de rayon, ouvrir une fiche) : rend les gestionnaires
 * à poser sur l'élément, et `wrapClick` qui ignore le tap qui suit un appui long.
 * Sans `onLongPress`, rien n'est posé.
 */
export function useLongPress(onLongPress: (() => void) | undefined) {
  const press = useRef<{
    timer: ReturnType<typeof setTimeout>;
    x: number;
    y: number;
  } | null>(null);
  const fired = useRef(false);
  const cancel = () => {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  };

  const handlers = onLongPress
    ? {
        onPointerDown: (event: PointerEvent) => {
          fired.current = false;
          cancel();
          press.current = {
            x: event.clientX,
            y: event.clientY,
            timer: setTimeout(() => {
              press.current = null;
              fired.current = true;
              onLongPress();
            }, LONG_PRESS_MS),
          };
        },
        onPointerMove: (event: PointerEvent) => {
          const start = press.current;
          if (
            start &&
            Math.hypot(event.clientX - start.x, event.clientY - start.y) >
              LONG_PRESS_SLOP
          )
            cancel();
        },
        onPointerUp: cancel,
        onPointerCancel: cancel,
        onPointerLeave: cancel,
        onContextMenu: (event: MouseEvent) => {
          event.preventDefault();
        },
      }
    : {};

  const wrapClick = (onClick: (() => void) | undefined) => () => {
    if (fired.current) {
      fired.current = false;
      return;
    }
    onClick?.();
  };

  return { handlers, wrapClick };
}
