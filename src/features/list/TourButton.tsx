import { Lightbulb } from "lucide-react";
import { useNavigate } from "react-router";
import { routes } from "@/app/routes";
import { texts } from "@/i18n";
import { Button } from "@/ui/button";
import { CountBadge } from "@/ui/CountBadge";

const t = texts.tour;

/**
 * « Rien oublié ? Faire le tour » (docs/03 D1, D2), au-dessus des lignes : un seul
 * bouton compact, avec le nombre d'articles qu'il est temps de racheter.
 */
export function TourButton({ count }: { count: number }) {
  const navigate = useNavigate();
  return (
    <div className="px-3 pb-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          void navigate(routes.tour);
        }}
      >
        <Lightbulb />
        <span className="truncate">{t.open}</span>
        {count > 0 && (
          <>
            <CountBadge>
              <span aria-hidden>{count}</span>
            </CountBadge>
            <span className="sr-only">{t.openHint(count)}</span>
          </>
        )}
      </Button>
    </div>
  );
}
