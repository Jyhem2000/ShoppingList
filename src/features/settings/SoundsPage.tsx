import { Play } from "lucide-react";
import {
  soundEvents,
  updatePreferences,
  usePreferences,
} from "@/app/preferences";
import { routes } from "@/app/routes";
import { canFollowSilentMode, isAudioSupported, sounds } from "@/feedback";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { PageHeader, Row, Section } from "@/ui/Page";
import { Switch } from "@/ui/switch";

const t = fr.soundsPage;

/** Réglage des sons : tous d'un coup ou un par un, chacun pouvant être écouté. */
export function SoundsPage() {
  const preferences = usePreferences();
  const audio = isAudioSupported();
  const masterOn = audio && preferences.sounds;

  return (
    <>
      <PageHeader title={t.title} backTo={routes.settings} />

      <Section>
        <Row
          label={t.master}
          hint={
            !audio
              ? fr.settings.unavailable
              : canFollowSilentMode()
                ? t.silentIos
                : t.silentOther
          }
          disabled={!audio}
        >
          <Switch
            checked={masterOn}
            disabled={!audio}
            aria-label={t.master}
            onCheckedChange={(on) => {
              updatePreferences((p) => ({ ...p, sounds: on }));
              if (on) sounds.check();
            }}
          />
        </Row>
      </Section>

      <Section title={t.eachTitle} className="pb-6">
        {soundEvents.map((name) => {
          const label = t.events[name];
          return (
            <Row key={name} label={label} disabled={!masterOn}>
              <Button
                variant="ghost"
                size="icon"
                disabled={!masterOn}
                aria-label={t.listen(label)}
                onClick={() => sounds[name]()}
              >
                <Play className="size-5" />
              </Button>
              <Switch
                checked={masterOn && preferences.soundEvents[name]}
                disabled={!masterOn}
                aria-label={label}
                onCheckedChange={(on) => {
                  updatePreferences((p) => ({
                    ...p,
                    soundEvents: { ...p.soundEvents, [name]: on },
                  }));
                  if (on) sounds[name]();
                }}
              />
            </Row>
          );
        })}
      </Section>
    </>
  );
}
