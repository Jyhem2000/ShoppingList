import { useCallback, useEffect, useRef } from "react";

/**
 * Champ enregistré quand on le quitte. `blur` ne suffit pas : sur iPhone, un champ qui
 * disparaît encore actif (« Terminé », retour, autre onglet) n'en émet aucun. `edited`
 * se pose à chaque frappe, `commit` sur `onBlur` (ou à la fermeture) ; une saisie
 * encore en attente est aussi enregistrée au démontage, une seule fois.
 */
export function usePendingSave(save: () => void | Promise<void>): {
  edited: () => void;
  commit: () => void | Promise<void>;
} {
  const pending = useRef(false);
  const latest = useRef(save);
  useEffect(() => {
    latest.current = save;
  });
  const commit = useCallback(() => {
    if (!pending.current) return;
    pending.current = false;
    return latest.current();
  }, []);
  const edited = useCallback(() => {
    pending.current = true;
  }, []);
  useEffect(
    () => () => {
      void commit();
    },
    [commit],
  );
  return { edited, commit };
}
