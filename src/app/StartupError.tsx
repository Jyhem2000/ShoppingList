import { DatabaseZap, RotateCcw } from "lucide-react";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { EmptyState } from "@/ui/Page";

const t = fr.startup;

/**
 * Affiché à la place de l'app quand la base ne s'ouvre pas au démarrage (navigation
 * privée, stockage plein) : sinon « Chargement… » resterait affiché sans fin.
 */
export function StartupError() {
  return (
    <div className="min-h-dvh bg-bg pt-[env(safe-area-inset-top)]">
      <EmptyState
        icon={<DatabaseZap />}
        title={t.title}
        action={
          <Button
            onClick={() => {
              window.location.reload();
            }}
          >
            <RotateCcw />
            {t.reload}
          </Button>
        }
      >
        {t.text}
      </EmptyState>
    </div>
  );
}
