import { Palette, Sun, Volume2 } from "lucide-react";
import {
  soundEvents,
  themePreferences,
  updatePreferences,
  usePreferences,
} from "@/app/preferences";
import { routes } from "@/app/routes";
import { isAudioSupported } from "@/feedback";
import { fr } from "@/i18n/fr";
import { isWakeLockSupported } from "@/platform/wakeLock";
import { Chip } from "@/ui/form";
import { LinkRow, PageHeader, Row, Section } from "@/ui/Page";
import { Switch } from "@/ui/switch";

const t = fr.settings;

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
              <span
                role="radiogroup"
                aria-label={t.theme.title}
                className="mt-2.5 flex flex-wrap gap-2"
              >
                {themePreferences.map((theme) => (
                  <Chip
                    key={theme}
                    role="radio"
                    aria-pressed={undefined}
                    aria-checked={preferences.theme === theme}
                    selected={preferences.theme === theme}
                    onClick={() => {
                      updatePreferences((p) => ({ ...p, theme }));
                    }}
                  >
                    {t.theme.options[theme]}
                  </Chip>
                ))}
              </span>
            </>
          }
        />
      </Section>
    </>
  );
}
