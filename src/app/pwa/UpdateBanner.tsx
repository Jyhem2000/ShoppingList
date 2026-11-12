import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import {
  checkForUpdate,
  fetchPublishedVersion,
  setRegistration,
} from "./serviceWorker";

const HOURLY = 60 * 60 * 1000;
/** Délai après lequel l'app se recharge elle-même si le navigateur ne l'a pas fait. */
const RELOAD_FALLBACK_MS = 3000;

/**
 * Mise à jour de l'app (docs/07 § 6) : la nouvelle version est téléchargée en
 * arrière-plan et n'est activée qu'à la demande.
 * - `UpdateWatcher`, toujours monté (App), enregistre le service worker et guette les versions ;
 * - `UpdateBanner`, dans la coquille (Layout), affiche le bandeau en bas, au-dessus des onglets.
 */
interface UpdateState {
  phase: "none" | "available" | "updating";
  version: string | null;
  /** Active la nouvelle version (absent tant qu'aucune n'est prête). */
  apply?: () => void;
}

let state: UpdateState = { phase: "none", version: null };
const listeners = new Set<() => void>();

function setState(next: Partial<UpdateState>): void {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let reloading = false;
function reloadOnce(): void {
  if (reloading) return;
  reloading = true;
  window.location.reload();
}

export function UpdateWatcher() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      setRegistration(registration);
    },
  });

  // Vérifications : toutes les heures et au retour au premier plan.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void checkForUpdate();
    };
    const timer = window.setInterval(() => void checkForUpdate(), HOURLY);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (!needRefresh || state.phase === "updating") return;
    setState({
      phase: "available",
      apply: () => {
        setState({ phase: "updating" });
        // Le navigateur recharge normalement l'app quand la nouvelle version prend la
        // main ; sur iPhone ce rechargement manque parfois : l'app le fait elle-même.
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          reloadOnce,
        );
        void updateServiceWorker(true);
        window.setTimeout(reloadOnce, RELOAD_FALLBACK_MS);
      },
    });
    void fetchPublishedVersion().then((version) => {
      setState({ version });
    });
  }, [needRefresh, updateServiceWorker]);

  return null;
}

export function UpdateBanner() {
  const { phase, version, apply } = useSyncExternalStore(
    subscribe,
    () => state,
  );
  if (phase === "none") return null;
  const updating = phase === "updating";

  return (
    <div
      role="status"
      className="absolute inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-border bg-raised p-3 shadow-lg shadow-black/40"
    >
      <RefreshCw
        className={
          updating
            ? "size-5 shrink-0 text-secondary motion-safe:animate-spin"
            : "size-5 shrink-0 text-secondary"
        }
        aria-hidden
      />
      <p className="flex-1 text-sm font-semibold">
        {version ? fr.update.availableVersion(version) : fr.update.available}
      </p>
      <Button size="sm" disabled={updating} onClick={apply}>
        {updating ? fr.update.applying : fr.update.action}
      </Button>
    </div>
  );
}
