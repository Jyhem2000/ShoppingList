import { Info, Scale, Sun, Volume2 } from "lucide-react";
import {
  soundEvents,
  updatePreferences,
  usePreferences,
} from "@/app/preferences";
import { routes } from "@/app/routes";
import { db } from "@/db/database";
import { useSettings } from "@/db/hooks";
import { updateSettings } from "@/db/settings";
import { isAudioSupported } from "@/feedback";
import { fr } from "@/i18n/fr";
import { isWakeLockSupported } from "@/platform/wakeLock";
import { LinkRow, PageHeader, Row, Section } from "@/ui/Page";
import { Switch } from "@/ui/switch";

const t = fr.settings;

/**
 * Écran Réglages (docs/04 § 2.7). Section « Fonctionnalités » : seules celles qui
 * concernent l'app ; grisées si le téléphone ne les permet pas. Section « Liste » :
 * réglages enregistrés avec les données (docs/03 H8).
 */
export function SettingsPage() {
  const preferences = usePreferences();
  const settings = useSettings();
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
      <PageHeader title={t.title} />

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

      <Section title={t.sectionList}>
        <Row icon={<Scale />} label={t.simplify.title} hint={t.simplify.hint}>
          <Switch
            checked={settings?.simplifyQuantities ?? true}
            disabled={!settings}
            aria-label={t.simplify.title}
            onCheckedChange={(on) =>
              void updateSettings(db, { simplifyQuantities: on })
            }
          />
        </Row>
      </Section>

      <Section title={t.sectionApp} className="pb-6">
        <LinkRow to={routes.about} icon={<Info />} label={t.about} />
      </Section>
    </>
  );
}
