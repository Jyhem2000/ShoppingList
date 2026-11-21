import { useEffect, useState } from "react";
import { monthOf } from "@/domain/season";

/**
 * Valeur lue à l'heure du téléphone, tenue à jour : chaque minute et au retour dans
 * l'app (écran rallumé, app rouverte). Une valeur inchangée ne rend pas à nouveau.
 */
function useTicking<T>(read: () => T, intervalMs: number): T {
  const [value, setValue] = useState(read);
  useEffect(() => {
    const tick = () => {
      setValue(read);
    };
    const timer = window.setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [read, intervalMs]);
  return value;
}

/**
 * Heure actuelle, tenue à jour. Pour ce qui dépend du jour ou de l'heure (« Rouvrir
 * les courses » le jour même, « il y a 3 jours ») sur un écran resté affiché longtemps.
 */
export function useNow(intervalMs = 60_000): number {
  return useTicking(Date.now, intervalMs);
}

const currentMonth = () => monthOf(Date.now());

/** Mois en cours (1 à 12), pour la saison : l'écran ne rend à nouveau qu'au changement. */
export function useMonth(): number {
  return useTicking(currentMonth, 60_000);
}
