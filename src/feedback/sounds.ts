/**
 * Petits sons d'interface synthétisés avec la Web Audio API (docs/05 § 7) :
 * aucun fichier, aucune licence, disponibles hors ligne.
 * Sur iPhone, l'audio ne démarre qu'après un premier geste de l'utilisateur.
 */
type AudioContextCtor = typeof AudioContext;

/** Audio Session API (WebKit, iOS 17+) : absente des types DOM standard. */
type NavigatorWithAudioSession = Navigator & {
  audioSession?: { type: string };
};

let context: AudioContext | null = null;

/**
 * Vrai si le navigateur permet de suivre le mode silencieux du téléphone.
 * Sur iPhone, la session audio « ambient » coupe les sons quand le bouton
 * silencieux est activé et ne coupe pas la musique en cours. Rien d'équivalent
 * sur Android : les sons suivent le volume multimédia.
 */
export function canFollowSilentMode(): boolean {
  return typeof navigator !== "undefined" && "audioSession" in navigator;
}

function audio(): AudioContext | null {
  if (!context) {
    const session = (navigator as NavigatorWithAudioSession).audioSession;
    if (session) {
      try {
        session.type = "ambient";
      } catch {
        // Sans effet si refusé.
      }
    }
    // Les types DOM supposent AudioContext toujours présent : on vérifie quand même.
    const Ctor: AudioContextCtor | undefined =
      "AudioContext" in window
        ? window.AudioContext
        : (window as { webkitAudioContext?: AudioContextCtor })
            .webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

export function isAudioSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    ("AudioContext" in window || "webkitAudioContext" in window)
  );
}

interface Tone {
  frequency: number;
  /** Fréquence d'arrivée pour un glissement. */
  slideTo?: number;
  start?: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
}

function play(tones: Tone[]): void {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const tone of tones) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + (tone.start ?? 0);
    const end = start + tone.duration;
    oscillator.type = tone.type ?? "sine";
    oscillator.frequency.setValueAtTime(tone.frequency, start);
    if (tone.slideTo)
      oscillator.frequency.exponentialRampToValueAtTime(tone.slideTo, end);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(tone.volume ?? 0.12, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }
}

export const sounds = {
  /** Ajout d'un article : « pop » léger. */
  add: () =>
    play([{ frequency: 520, slideTo: 880, duration: 0.09, volume: 0.1 }]),
  /** Cocher : « tic » court. */
  check: () =>
    play([{ frequency: 1250, duration: 0.05, type: "triangle", volume: 0.08 }]),
  /** Rayon terminé : petit carillon de deux notes. */
  aisleDone: () =>
    play([
      { frequency: 784, duration: 0.18, type: "triangle", volume: 0.1 },
      {
        frequency: 1175,
        start: 0.1,
        duration: 0.28,
        type: "triangle",
        volume: 0.1,
      },
    ]),
  /** Courses terminées : carillon montant. */
  done: () =>
    play([
      { frequency: 659, duration: 0.2, type: "triangle", volume: 0.1 },
      {
        frequency: 880,
        start: 0.12,
        duration: 0.2,
        type: "triangle",
        volume: 0.1,
      },
      {
        frequency: 1319,
        start: 0.24,
        duration: 0.4,
        type: "triangle",
        volume: 0.11,
      },
    ]),
  /** Suppression : glissement descendant discret. */
  remove: () =>
    play([{ frequency: 700, slideTo: 220, duration: 0.16, volume: 0.07 }]),
  /** Action impossible : son sourd bref. */
  error: () =>
    play([
      { frequency: 180, duration: 0.09, type: "square", volume: 0.05 },
      {
        frequency: 150,
        start: 0.1,
        duration: 0.12,
        type: "square",
        volume: 0.05,
      },
    ]),
};

export type SoundName = keyof typeof sounds;
