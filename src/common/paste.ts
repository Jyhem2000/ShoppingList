import { pasteText } from "@/platform/clipboard";

/**
 * Sans réponse du presse-papiers après ce délai, le champ où coller s'ouvre. Sur iPhone,
 * la lecture attend qu'on touche la bulle « Coller » : sans ce délai, rien ne se passerait
 * tant qu'on ne touche pas l'écran. Assez long pour qu'une lecture immédiate (Android)
 * n'ouvre pas le champ pour rien.
 */
const ASK_DELAY = 400;

/**
 * « Coller » : le texte du presse-papiers s'il en a un (`onText`), sinon `onAsk` pour
 * montrer un champ où coller à la main. À appeler pendant le toucher (iPhone : bulle
 * « Coller » à confirmer). Si la lecture tarde, le champ s'ouvre sans l'attendre ; le
 * texte, s'il arrive ensuite (bulle touchée), est quand même utilisé.
 */
export function pasteOrAsk(onText: (text: string) => void, onAsk: () => void) {
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
