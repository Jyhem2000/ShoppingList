import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import {
  checkForUpdate,
  fetchPublishedVersion,
  setRegistration,
} from "./serviceWorker";

const HOURLY = 60 * 60 * 1000;

/**
 * Bandeau « Version X disponible — Mettre à jour » (docs/07 § 6) :
 * la nouvelle version est téléchargée en arrière-plan et n'est activée qu'à la demande.
 */
export function UpdateBanner() {
  const [newVersion, setNewVersion] = useState<string | null>(null);
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
    if (needRefresh) void fetchPublishedVersion().then(setNewVersion);
  }, [needRefresh]);

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)]"
    >
      <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-border bg-raised p-3 shadow-lg">
        <RefreshCw className="size-5 shrink-0 text-secondary" aria-hidden />
        <p className="flex-1 text-sm font-semibold">
          {newVersion
            ? fr.update.availableVersion(newVersion)
            : fr.update.available}
        </p>
        <Button
          size="sm"
          variant="default"
          onClick={() => void updateServiceWorker(true)}
        >
          {fr.update.action}
        </Button>
      </div>
    </div>
  );
}
