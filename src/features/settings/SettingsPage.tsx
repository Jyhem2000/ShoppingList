import {
  Apple,
  Info,
  LayoutGrid,
  Lightbulb,
  Palette,
  Ruler,
  Store,
  Sun,
  Volume2,
} from "lucide-react";
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
import { resetTips } from "@/ui/tips";
import { showToast } from "@/ui/toast";
import { Button } from "@/ui/button";
import { BackupSection } from "./BackupSection";

const t = fr.settings;

/**
 * Écran Réglages (docs/04 § 2.7). Section « Fonctionnalités » : seules celles qui
 * concernent l'app ; grisées si le téléphone ne les permet pas.
 */
export function SettingsPage() {
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

      <Section title={t.sectionDisplay}>
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

      <Section title={fr.manage.section}>
        <LinkRow
          to={routes.manageArticles}
          icon={<Apple />}
          label={fr.manage.articles.title}
          hint={fr.manage.articles.hint}
        />
        <LinkRow
          to={routes.manageCategories}
          icon={<LayoutGrid />}
          label={fr.manage.categories.title}
          hint={fr.manage.categories.hint}
        />
        <LinkRow
          to={routes.manageStores}
          icon={<Store />}
          label={fr.manage.stores.title}
          hint={fr.manage.stores.hint}
        />
        <LinkRow
          to={routes.manageUnits}
          icon={<Ruler />}
          label={fr.manage.units.title}
          hint={fr.manage.units.hint}
        />
      </Section>

      <BackupSection />

      <Section title={t.sectionApp} className="pb-6">
        <Row
          icon={<Lightbulb />}
          label={fr.tips.reset}
          hint={fr.tips.resetHint}
        >
          <Button
            variant="outline"
            onClick={() => {
              resetTips();
              showToast(fr.tips.resetDone, { tone: "success" });
            }}
          >
            {fr.tips.resetAction}
          </Button>
        </Row>
        <LinkRow to={routes.about} icon={<Info />} label={t.about} />
      </Section>
    </>
  );
}
