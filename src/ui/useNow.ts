import { useEffect, useState } from "react";

/**
 * Heure actuelle, tenue à jour : chaque minute et au retour dans l'app (écran rallumé,
 * app rouverte). Pour ce qui dépend du jour ou de l'heure (« Rouvrir les courses » le
 * jour même, « il y a 3 jours ») sur un écran resté affiché longtemps.
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
    };
    const timer = window.setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [intervalMs]);
  return now;
}
