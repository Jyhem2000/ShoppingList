import { Info, Smartphone, Sun, Volume2 } from "lucide-react";
import { soundEvents, updatePreferences, usePreferences } from "@/app/preferences";
import { routes } from "@/app/routes";
import { hapticsKind, isAudioSupported, patterns, vibrate } from "@/feedback";
import { fr } from "@/i18n/fr";
import { isWakeLockSupported } from "@/platform/wakeLock";
import { LinkRow, PageHeader, Row, Section } from "@/ui/Page";
import { Switch } from "@/ui/switch";

const t = fr.settings;

/**
 * Écran Réglages (docs/04 § 2.7). Section « Fonctionnalités » : seules celles qui
 * concernent l'app ; grisées si le téléphone ne les permet pas.
 */
export function SettingsPage() {
  const preferences = usePreferences();
  const haptics = hapticsKind();
  const wakeLock = isWakeLockSupported();
  const audio = isAudioSupported();

  const soundsOn = soundEvents.filter((name) => preferences.soundEvents[name]).length;
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
              <span className="block font-semibold text-primary">{soundsState}</span>
            </>
          }
        />
        <Row
          icon={<Smartphone />}
          label={t.haptics.title}
          hint={
            haptics === "none"
              ? t.unavailable
              : haptics === "ios-tick"
                ? t.haptics.hintIos
                : t.haptics.hint
          }
          disabled={haptics === "none"}
        >
          <Switch
            checked={haptics !== "none" && preferences.haptics}
            disabled={haptics === "none"}
            aria-label={t.haptics.title}
            onCheckedChange={(on) => {
              updatePreferences((p) => ({ ...p, haptics: on }));
              if (on) vibrate(patterns.check);
            }}
          />
        </Row>
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
            onCheckedChange={(on) => updatePreferences((p) => ({ ...p, keepScreenOn: on }))}
          />
        </Row>
      </Section>

      <Section title={t.sectionApp} className="pb-6">
        <LinkRow to={routes.about} icon={<Info />} label={t.about} />
      </Section>
    </>
  );
}
