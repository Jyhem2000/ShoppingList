/**
 * Point d'entrée unique pour les sons (docs/07 § 7.11) : aucun autre module
 * n'appelle directement Web Audio. Respecte les préférences de l'appareil
 * (Réglages → Fonctionnalités → Sons). Les vibrations ont été retirées (docs/05 § 7).
 */
import { getPreferences, type SoundEvent } from "@/app/preferences";
import { playSound, type SoundStyle } from "./sounds";

function emit(event: SoundEvent): void {
  const preferences = getPreferences();
  if (preferences.sounds && preferences.soundEvents[event])
    playSound(event, preferences.soundStyle);
}

export const feedback = {
  add: () => emit("add"),
  check: () => emit("check"),
  aisleDone: () => emit("aisleDone"),
  done: () => emit("done"),
  remove: () => emit("remove"),
  error: () => emit("error"),
};

/** Fait écouter un son (réglages, maquette), même désactivé, dans le style choisi. */
export function previewSound(event: SoundEvent, style?: SoundStyle): void {
  playSound(event, style ?? getPreferences().soundStyle);
}

export { canFollowSilentMode, isAudioSupported } from "./sounds";
export type { SoundStyle } from "./sounds";
