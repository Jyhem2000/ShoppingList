import { useState } from "react";
import { useNavigate } from "react-router";
import { shoppingRecapPath } from "@/app/routes";
import { db } from "@/db/database";
import { useSessionPurchases } from "@/db/hooks";
import { closeSession } from "@/db/sessions";
import type { ID, ShoppingSession } from "@/domain/model";
import { isStale } from "@/domain/shopping";
import { feedback } from "@/feedback";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { Sheet } from "@/ui/Sheet";
import { formatWhen } from "./format";

import { useNow } from "@/ui/useNow";
const t = fr.shopping.stale;
/** Une seule question par session et par ouverture de l'app. */
const answered = new Set<ID>();

/**
 * Session oubliée (docs/03 C8) : courses restées ouvertes plus de 3 heures après la
 * dernière coche → « Tu as terminé tes courses de hier 18 h ? ».
 */
export function StaleSessionPrompt({ session }: { session: ShoppingSession }) {
  const purchases = useSessionPurchases(session.id);
  const navigate = useNavigate();
  const now = useNow();
  const [, setAnswered] = useState(0);
  if (!purchases || answered.has(session.id)) return null;
  const lastActivity = purchases.at(-1)?.at ?? session.startedAt;
  if (!isStale(lastActivity, now)) return null;

  const answer = () => {
    answered.add(session.id);
    setAnswered((n) => n + 1);
  };

  return (
    <Sheet
      open
      autoFocus={false}
      onOpenChange={(open) => {
        if (!open) answer();
      }}
      title={t.title(formatWhen(lastActivity, now))}
      description={t.text}
    >
      <div className="flex flex-col gap-3">
        <Button
          variant="gold"
          onClick={() => {
            answer();
            void closeSession(db, session.id).then(() => {
              feedback.done();
              void navigate(shoppingRecapPath(session.id));
            });
          }}
        >
          {t.finish}
        </Button>
        <Button variant="outline" onClick={answer}>
          {t.resume}
        </Button>
      </div>
    </Sheet>
  );
}
