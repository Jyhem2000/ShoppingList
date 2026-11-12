import { fr } from "@/i18n/fr";

const t = fr.shopping;
const DAY_MS = 24 * 60 * 60 * 1000;

/** « 18 h 02 », « 18 h » à l'heure pile. */
export function formatClock(at: number): string {
  const date = new Date(at);
  const minutes = date.getMinutes();
  return `${date.getHours()} h${minutes ? ` ${String(minutes).padStart(2, "0")}` : ""}`;
}

function startOfDay(at: number): number {
  const date = new Date(at);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** « aujourd'hui 18 h 02 », « hier 18 h », « lundi 9 h 30 », « 3 novembre 18 h ». */
export function formatWhen(at: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS);
  const day =
    days <= 0
      ? t.when.today
      : days === 1
        ? t.when.yesterday
        : new Date(at).toLocaleDateString(
            "fr-FR",
            days < 7 ? { weekday: "long" } : { day: "numeric", month: "long" },
          );
  return `${day} ${formatClock(at)}`;
}

/** « 42 min », « 1 h 05 ». */
export function formatDuration(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}
