import { currentInstallEnvironment, isAppleMobile } from "./install";

/**
 * Hauteur du cadre de l'app (docs/07 § 4).
 *
 * Bug connu d'iOS : au lancement d'une app installée, la zone d'affichage mesure la
 * hauteur de l'écran moins celle de la barre d'état (797 au lieu de 844 sur un
 * iPhone de 844), jusqu'au premier défilement de la page. La page est bien peinte
 * sur tout l'écran, mais un élément en position fixe est coupé au bas de cette zone.
 *
 * Tant que la zone est trop courte (iPhone, app installée, portrait), le cadre est
 * posé dans la page (position absolue, non coupée) à la hauteur de l'écran. Dès
 * qu'iOS a corrigé la zone, il redevient fixe : le rebond de la page ne le déplace
 * plus.
 */
export function trackAppHeight(): void {
  const root = document.documentElement;
  const environment = currentInstallEnvironment();
  const iosInstalled = environment.standalone && isAppleMobile(environment);
  let current = "";

  const apply = () => {
    const portrait = window.innerHeight >= window.innerWidth;
    const tooShort =
      iosInstalled && portrait && window.innerHeight < window.screen.height;
    const height = tooShort ? `${window.screen.height}px` : "100%";
    if (height === current) return;
    current = height;
    if (tooShort) root.dataset.frameMode = "page";
    else delete root.dataset.frameMode;
    root.style.setProperty("--app-height", height);
  };

  apply();
  window.addEventListener("resize", apply);
  window.addEventListener("orientationchange", apply);
  window.addEventListener("pageshow", apply);
  // Filet de sécurité : iOS corrige la zone au premier défilement de la page.
  window.addEventListener("scroll", apply, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") apply();
  });
}
