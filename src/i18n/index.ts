import { appLanguage, type Language } from "@/domain/language";
import { fr } from "./fr";

/** Les textes d'une langue : la forme de `fr`, chaque texte libre (docs/03 I3). */
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : T extends readonly (infer U)[]
      ? readonly Widen<U>[]
      : { readonly [K in keyof T]: Widen<T[K]> };
export type Texts = Widen<typeof fr>;

/** Textes par langue. L'anglais reprend le français en attendant `en.ts`. */
const byLanguage: Record<Language, Texts> = { fr, en: fr };

/** Nom de chaque langue, écrit dans cette langue (Réglages → Langue). */
export const languageNames: Record<Language, string> = {
  fr: "Français",
  en: "English",
};

/**
 * Tous les textes de l'interface, dans la langue de l'app. Lue au chargement de ce
 * module : `src/main.tsx` pose la langue avant de charger le reste de l'app.
 */
export const texts: Texts = byLanguage[appLanguage()];
