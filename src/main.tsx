import { db } from "@/db/database";
import {
  DEFAULT_LANGUAGE,
  isLanguage,
  languageOfPhone,
  setAppLanguage,
  type Language,
} from "@/domain/language";
import "@/styles/index.css";

/**
 * La langue d'abord (docs/03 I3) : les textes de l'interface se lisent au chargement
 * des modules, donc rien ici n'importe de texte, et le reste de l'app n'est chargé
 * qu'une fois la langue posée. Celle des réglages ; au premier lancement (pas encore
 * de réglages), celle du téléphone ; une installation d'avant le choix de la langue
 * reste en français.
 */
const phone = () =>
  languageOfPhone(
    navigator.languages.length > 0 ? navigator.languages : [navigator.language],
  );

void db.meta
  .get("settings")
  .then(
    (entry): Language =>
      !entry
        ? phone()
        : isLanguage(entry.value.language)
          ? entry.value.language
          : DEFAULT_LANGUAGE,
    // Base inaccessible : le démarrage affichera l'écran d'erreur, dans cette langue.
    phone,
  )
  .then((language) => {
    setAppLanguage(language);
    document.documentElement.lang = language;
    return import("@/app/start");
  });
