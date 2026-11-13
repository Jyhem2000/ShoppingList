import { updatePreferences } from "@/app/preferences";

/** Les bulles d'aide (docs/03 H12). */
export type TipId = "shopping-place" | "shopping-next" | "shopping-stored";

/** Marquer une bulle comme vue : elle ne revient plus. */
export function dismissTip(id: TipId) {
  updatePreferences((p) => ({
    ...p,
    seenTips: p.seenTips.includes(id) ? p.seenTips : [...p.seenTips, id],
  }));
}

/** Réglages → « Revoir les conseils » : toutes les bulles reviendront. */
export function resetTips() {
  updatePreferences((p) => ({ ...p, seenTips: [] }));
}
