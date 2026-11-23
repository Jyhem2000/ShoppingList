import { pasteText } from "@/platform/clipboard";
import { currentInstallEnvironment, isAppleMobile } from "@/platform/install";

/**
 * Sans réponse du presse-papiers après ce délai, le champ où coller s'ouvre. Assez long
 * pour qu'une lecture immédiate (Android) n'ouvre pas le champ pour rien.
 */
const ASK_DELAY = 400;

/**
 * « Coller » : le texte du presse-papiers s'il en a un (`onText`), sinon `onAsk` pour
 * montrer un champ où coller à la main. À appeler pendant le toucher.
 *
 * Sur iPhone, le champ s'ouvre tout de suite, sans lire le presse-papiers : la lecture y
 * montre une bulle « Coller » qui bloque l'écran tant qu'on ne touche pas ailleurs, et le
 * champ ouvert ensuite, hors du toucher, gardait un curseur décalé. Ouvert pendant le
 * toucher, il a le clavier ; un toucher dans le champ propose « Coller ».
 */
export function pasteOrAsk(onText: (text: string) => void, onAsk: () => void) {
  if (isAppleMobile(currentInstallEnvironment())) {
    onAsk();
    return;
  }
  let asked = false;
  const timer = setTimeout(() => {
    asked = true;
    onAsk();
  }, ASK_DELAY);
  void pasteText().then((text) => {
    clearTimeout(timer);
    if (text?.trim()) onText(text);
    else if (!asked) onAsk();
  });
}
