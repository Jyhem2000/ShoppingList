import { Languages, Palette, Sun, Volume2 } from "lucide-react";
import {
  soundEvents,
  themePreferences,
  updatePreferences,
  usePreferences,
} from "@/app/preferences";
import { routes } from "@/app/routes";
import { db } from "@/db/database";
import { updateSettings } from "@/db/settings";
import { appLanguage, languages } from "@/domain/language";
import { isAudioSupported } from "@/feedback";
import { languageNames, texts } from "@/i18n";
import { isWakeLockSupported } from "@/platform/wakeLock";
import { ChipRadios } from "@/ui/form";
import { LinkRow, PageHeader, Row, Section } from "@/ui/Page";
import { Switch } from "@/ui/switch";

const t = texts.settings;

/**
 * Préférences de l'app (docs/04 § 2.7), réglées une fois pour toutes : section
 * « Fonctionnalités » (grisées si le téléphone ne les permet pas) et « Affichage ».
 */
export function PreferencesPage() {
  const preferences = usePreferences();
  const wakeLock = isWakeLockSupported();
  const audio = isAudioSupported();

  const soundsOn = soundEvents.filter(
    (name) => preferences.soundEvents[name],
  ).length;
  const soundsState = !audio
    ? t.unavailable
    : !preferences.sounds || soundsOn === 0
      ? t.sounds.stateOff
      : soundsOn === soundEvents.length
        ? t.sounds.stateAll
        : t.sounds.stateSome(soundsOn, soundEvents.length);

  return (
    <>
      <PageHeader title={t.preferences.title} backTo={routes.settings} />

      <Section title={t.sectionFeatures}>
        <LinkRow
          to={routes.sounds}
          icon={<Volume2 />}
          label={t.sounds.title}
          hint={
            <>
              {t.sounds.hint}
              <span className="block font-semibold text-text">
                {soundsState}
              </span>
            </>
          }
        />
        <Row
          icon={<Sun />}
          label={t.keepScreenOn.title}
          hint={wakeLock ? t.keepScreenOn.hint : t.unavailable}
          disabled={!wakeLock}
        >
          <Switch
            checked={wakeLock && preferences.keepScreenOn}
            disabled={!wakeLock}
            aria-label={t.keepScreenOn.title}
            onCheckedChange={(on) =>
              updatePreferences((p) => ({ ...p, keepScreenOn: on }))
            }
          />
        </Row>
      </Section>

      <Section title={t.sectionDisplay} className="pb-6">
        <Row
          icon={<Palette />}
          label={t.theme.title}
          hint={
            <>
              {t.theme.hint}
              <ChipRadios
                label={t.theme.title}
                options={themePreferences.map((theme) => ({
                  value: theme,
                  label: t.theme.options[theme],
                }))}
                value={preferences.theme}
                onChange={(theme) => {
                  updatePreferences((p) => ({ ...p, theme }));
                }}
              />
            </>
          }
        />
        <Row
          icon={<Languages />}
          label={t.language.title}
          hint={
            <>
              {t.language.hint}
              <ChipRadios
                label={t.language.title}
                options={languages.map((language) => ({
                  value: language,
                  label: languageNames[language],
                }))}
                value={appLanguage()}
                onChange={(language) => {
                  if (language === appLanguage()) return;
                  void updateSettings(db, { language }).then(() => {
                    window.location.reload();
                  });
                }}
              />
            </>
          }
        />
      </Section>
    </>
  );
}
