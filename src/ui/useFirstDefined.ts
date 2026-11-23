import { useState } from "react";

/**
 * La première valeur définie reçue, figée ensuite : une liste montrée à l'ouverture
 * d'un écran ne bouge plus sous le doigt (suggestions « À racheter »).
 */
export function useFirstDefined<T>(value: T | undefined): T | undefined {
  const [first, setFirst] = useState<T | undefined>(value);
  if (first === undefined && value !== undefined) setFirst(value);
  return first ?? value;
}
