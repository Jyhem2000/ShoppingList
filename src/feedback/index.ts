/**
 * Point d'entrée unique pour les sons et vibrations (docs/07 § 7.11) :
 * aucun autre module n'appelle directement Web Audio ou l'API Vibration.
 * Respecte les préférences de l'appareil (Réglages → Fonctionnalités).
 */
import { getPreferences, type SoundEvent } from "@/app/preferences";
import { patterns, vibrate } from "./haptics";
import { sounds } from "./sounds";

function emit(event: SoundEvent, pattern?: VibratePattern): void {
  const preferences = getPreferences();
  if (preferences.sounds && preferences.soundEvents[event]) sounds[event]();
  if (preferences.haptics && pattern !== undefined) vibrate(pattern);
}

export const feedback = {
  add: () => emit("add"),
  check: () => emit("check", patterns.check),
  aisleDone: () => emit("aisleDone", patterns.aisleDone),
  done: () => emit("done", patterns.done),
  remove: () => emit("remove"),
  error: () => emit("error", patterns.error),
};

export { hapticsKind, patterns, vibrate } from "./haptics";
export { canFollowSilentMode, isAudioSupported, sounds } from "./sounds";
