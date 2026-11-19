import { CloudOff, List, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { EmptyState } from "@/ui/Page";
import { routes } from "./routes";

const t = fr.screenError;

/**
 * Affiché à la place d'un écran qui n'a pas pu s'ouvrir, par exemple un écran chargé à
 * la demande alors que l'app n'est pas en cache et le réseau absent, ou un onglet resté
 * ouvert pendant une mise à jour. La barre d'onglets reste là.
 */
export function ScreenError() {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon={<CloudOff />}
      title={t.title}
      action={
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              window.location.reload();
            }}
          >
            <RotateCcw />
            {t.reload}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void navigate(routes.list);
            }}
          >
            <List />
            {t.home}
          </Button>
        </div>
      }
    >
      {t.text}
    </EmptyState>
  );
}
