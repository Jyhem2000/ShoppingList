import type { SoundEvent } from "@/app/preferences";

/**
 * Sons d'interface (docs/05 § 7), joués avec la Web Audio API : fichiers de Kenney
 * Interface Sounds (CC0) dans public/sounds/.
 * Volume volontairement bas : un son léger, jamais plus fort que le reste du téléphone.
 * Sur iPhone, l'audio ne démarre qu'après un geste de l'utilisateur.
 */
type AudioContextCtor = typeof AudioContext;

/** Audio Session API (WebKit, iOS 17+) : absente des types DOM standard. */
type NavigatorWithAudioSession = Navigator & {
  audioSession?: { type: string };
};

/** Volume des sons (0 à 1). */
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

/** Joue le son d'une action. */
export function playSound(event: SoundEvent): void {
  playRecorded(event);
}
