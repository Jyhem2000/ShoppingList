import { Info, Play } from "lucide-react";
import {
  soundEvents,
  updatePreferences,
  usePreferences,
} from "@/app/preferences";
import { routes } from "@/app/routes";
import {
  canFollowSilentMode,
  isAudioSupported,
  previewSound,
} from "@/feedback";
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
          hint={audio ? undefined : fr.settings.unavailable}
          disabled={!audio}
        >
          <Switch
            checked={masterOn}
            disabled={!audio}
            aria-label={t.master}
            onCheckedChange={(on) => {
              updatePreferences((p) => ({ ...p, sounds: on }));
              if (on) previewSound("check");
            }}
          />
        </Row>
      </Section>
      {audio && (
        <p className="flex gap-2 px-5 pt-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
          {canFollowSilentMode() ? t.silentIos : t.silentOther}
        </p>
      )}

      <Section className="pb-6">
        {soundEvents.map((name) => {
          const label = t.events[name];
          return (
            <Row key={name} label={label} disabled={!masterOn}>
              <Button
                variant="icon"
                size="icon"
                disabled={!masterOn}
                aria-label={t.listen(label)}
                onClick={() => previewSound(name)}
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
                  if (on) previewSound(name);
                }}
              />
            </Row>
          );
        })}
      </Section>
    </>
  );
}
