/**
 * Langue de l'app (docs/03 I3) : celle de l'interface, des dates, des nombres et du
 * tri alphabétique. Enregistrée dans les réglages (`Settings.language`).
 */
export const languages = ["fr", "en"] as const;
export type Language = (typeof languages)[number];

/** Langue des installations d'avant le choix de la langue : elles restent en français. */
export const DEFAULT_LANGUAGE: Language = "fr";

/** Pour `Intl` : français de France, anglais britannique. */
const locales: Record<Language, string> = { fr: "fr-FR", en: "en-GB" };

export function isLanguage(value: unknown): value is Language {
  return languages.includes(value as Language);
}

/**
 * Langue du premier lancement : l'anglais si le téléphone est en anglais (sa première
 * langue), sinon le français.
 */
export function languageOfPhone(tags: readonly string[]): Language {
  return tags[0]?.toLowerCase().startsWith("en") ? "en" : "fr";
}

let current: Language = DEFAULT_LANGUAGE;

/**
 * Pose la langue de l'app, une seule fois, au démarrage (`src/main.tsx`), avant de
 * charger le reste : les textes se lisent au chargement des modules. Changer de
 * langue recharge donc l'app.
 */
export function setAppLanguage(language: Language): void {
  current = language;
}

export function appLanguage(): Language {
  return current;
}

/** Étiquette `Intl` de la langue de l'app (`fr-FR`, `en-GB`). */
export function appLocale(): string {
  return locales[current];
}
