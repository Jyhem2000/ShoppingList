/**
 * Point d'entrée unique pour les sons et vibrations (docs/07 § 7.11) :
 * aucun autre module n'appelle directement Web Audio ou l'API Vibration.
 */
import { patterns, vibrate } from "./haptics";
import { sounds } from "./sounds";

const options = { sounds: true, haptics: true };

/** Branché sur les réglages H6 / H7 à partir de la phase 7. */
export function setFeedbackOptions(next: Partial<typeof options>): void {
  Object.assign(options, next);
}

function emit(sound?: () => void, pattern?: VibratePattern): void {
  if (options.sounds && sound) sound();
  if (options.haptics && pattern !== undefined) vibrate(pattern);
}

export const feedback = {
  add: () => emit(sounds.add),
  check: () => emit(sounds.check, patterns.check),
  aisleDone: () => emit(sounds.aisleDone, patterns.aisleDone),
  done: () => emit(sounds.done, patterns.done),
  remove: () => emit(sounds.remove),
  error: () => emit(sounds.error, patterns.error),
};
