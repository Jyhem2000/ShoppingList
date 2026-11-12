import type { SoundEvent } from "@/app/preferences";

/**
 * Sons d'interface (docs/05 § 7), joués avec la Web Audio API, en deux styles :
 * - « enregistrés » : fichiers de Kenney Interface Sounds (CC0) dans public/sounds/ ;
 * - « générés » : petits sons synthétisés par le code, sans fichier.
 * Volume volontairement bas : un son léger, jamais plus fort que le reste du téléphone.
 * Sur iPhone, l'audio ne démarre qu'après un geste de l'utilisateur.
 */
export type SoundStyle = "recorded" | "generated";

type AudioContextCtor = typeof AudioContext;

/** Audio Session API (WebKit, iOS 17+) : absente des types DOM standard. */
type NavigatorWithAudioSession = Navigator & {
  audioSession?: { type: string };
};

/** Volume des sons enregistrés (0 à 1). */
const RECORDED_VOLUME = 0.3;

let context: AudioContext | null = null;
let buffers = new Map<SoundEvent, Promise<AudioBuffer | null>>();

/**
 * Vrai si le navigateur permet de suivre le mode silencieux du téléphone.
 * Sur iPhone, la session audio « ambient » coupe les sons quand le bouton
 * silencieux est activé et ne coupe pas la musique en cours. Rien d'équivalent
 * sur Android : les sons suivent le volume multimédia.
 */
export function canFollowSilentMode(): boolean {
  return typeof navigator !== "undefined" && "audioSession" in navigator;
}

export function isAudioSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    ("AudioContext" in window || "webkitAudioContext" in window)
  );
}

function createContext(): AudioContext | null {
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
  return Ctor ? new Ctor() : null;
}

/**
 * Sur iPhone, le moteur audio peut rester bloqué (« interrupted ») après un passage
 * en arrière-plan : les sons ne jouaient plus jusqu'au redémarrage de l'app. On le
 * ferme quand l'app est masquée ; il est recréé au son suivant.
 */
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && context) {
      void context.close().catch(() => undefined);
      context = null;
      buffers = new Map();
    }
  });
}

/** Exécute `play` avec un moteur audio en marche (relancé si besoin). */
function withAudio(play: (ctx: AudioContext) => void): void {
  if (!isAudioSupported()) return;
  if (!context || context.state === "closed") context = createContext();
  const ctx = context;
  if (!ctx) return;
  if (ctx.state === "running") {
    play(ctx);
    return;
  }
  ctx
    .resume()
    .then(() => {
      play(ctx);
    })
    .catch(() => {
      // Moteur inutilisable : il sera recréé au prochain son.
      context = null;
    });
}

// --- Sons enregistrés --------------------------------------------------------

function loadBuffer(
  ctx: AudioContext,
  event: SoundEvent,
): Promise<AudioBuffer | null> {
  let buffer = buffers.get(event);
  if (!buffer) {
    buffer = fetch(`${import.meta.env.BASE_URL}sounds/${event}.wav`)
      .then((response) => response.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .catch(() => null);
    buffers.set(event, buffer);
  }
  return buffer;
}

function playRecorded(event: SoundEvent): void {
  withAudio((ctx) => {
    void loadBuffer(ctx, event).then((decoded) => {
      if (!decoded) return;
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = RECORDED_VOLUME;
      source.buffer = decoded;
      source.connect(gain).connect(ctx.destination);
      source.start();
    });
  });
}

// --- Sons générés --------------------------------------------------------------

interface Tone {
  frequency: number;
  /** Fréquence d'arrivée pour un glissement. */
  slideTo?: number;
  start?: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
}

function playTones(tones: Tone[]): void {
  withAudio((ctx) => {
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
      gain.gain.exponentialRampToValueAtTime(
        tone.volume ?? 0.08,
        start + 0.012,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(end + 0.02);
    }
  });
}

const generated: Record<SoundEvent, Tone[]> = {
  /** « pop » léger. */
  add: [{ frequency: 520, slideTo: 880, duration: 0.09, volume: 0.07 }],
  /** « tic » court. */
  check: [{ frequency: 1250, duration: 0.05, type: "triangle", volume: 0.06 }],
  /** Petit carillon de deux notes. */
  aisleDone: [
    { frequency: 784, duration: 0.18, type: "triangle", volume: 0.07 },
    {
      frequency: 1175,
      start: 0.1,
      duration: 0.28,
      type: "triangle",
      volume: 0.07,
    },
  ],
  /** Carillon montant. */
  done: [
    { frequency: 659, duration: 0.2, type: "triangle", volume: 0.07 },
    {
      frequency: 880,
      start: 0.12,
      duration: 0.2,
      type: "triangle",
      volume: 0.07,
    },
    {
      frequency: 1319,
      start: 0.24,
      duration: 0.4,
      type: "triangle",
      volume: 0.08,
    },
  ],
  /** Glissement descendant discret. */
  remove: [{ frequency: 700, slideTo: 220, duration: 0.16, volume: 0.05 }],
  /** Son sourd bref. */
  error: [
    { frequency: 180, duration: 0.09, type: "square", volume: 0.035 },
    {
      frequency: 150,
      start: 0.1,
      duration: 0.12,
      type: "square",
      volume: 0.035,
    },
  ],
};

/** Joue le son d'une action dans le style demandé. */
export function playSound(event: SoundEvent, style: SoundStyle): void {
  if (style === "recorded") playRecorded(event);
  else playTones(generated[event]);
}
