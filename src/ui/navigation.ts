import { useCallback } from "react";
import { useNavigate } from "react-router";

/** État posé sur une navigation de retour : l'écran retrouve sa position (Layout). */
export const backState = { back: true } as const;

/**
 * Retour à l'écran d'où l'on vient (catalogue, liste, réglages…), comme le bouton
 * retour du téléphone ; sans écran précédent dans l'app (lien direct, app rouverte
 * sur cet écran), l'écran `fallback`. React Router numérote les entrées de
 * l'historique (`idx`) : 0 = premier écran ouvert.
 */
export function useGoBack(fallback: string): () => void {
  const navigate = useNavigate();
  return useCallback(() => {
    const state = window.history.state as { idx?: unknown } | null;
    const index = typeof state?.idx === "number" ? state.idx : 0;
    if (index > 0) void navigate(-1);
    else void navigate(fallback, { state: backState });
  }, [navigate, fallback]);
}
