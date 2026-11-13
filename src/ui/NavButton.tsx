import type { ComponentProps } from "react";
import { useNavigate } from "react-router";
import { backState } from "./navigation";

/**
 * Bouton qui mène à un autre écran. Ce n'est pas un vrai lien : sur iPhone, un appui
 * long sur un lien le fait glisser ou ouvre l'aperçu (« Ajouter à la liste de lecture »),
 * sans intérêt dans l'app. Il garde le rôle de lien pour les lecteurs d'écran.
 * `back` : retour vers l'écran précédent, qui retrouve sa position de défilement.
 */
export function NavButton({
  to,
  back = false,
  onClick,
  ...props
}: Omit<ComponentProps<"button">, "type"> & { to: string; back?: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      role="link"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented)
          void navigate(to, back ? { state: backState } : undefined);
      }}
    />
  );
}
