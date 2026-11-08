import { Code, ExternalLink, Scale, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  checkForUpdate,
  type UpdateCheckResult,
} from "@/app/pwa/serviceWorker";
import { routes } from "@/app/routes";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { LinkRow, PageHeader, Row, Section } from "@/ui/Page";
import { buildInfo, formatVersion } from "@/version";

const REPOSITORY = "https://github.com/Jyhem2000/ShoppingList";
const t = fr.about;

/** Écran « À propos » : version, mises à jour, licences (docs/03 H5). */
export function AboutPage() {
  const [update, setUpdate] = useState<UpdateCheckResult | "checking">();
  const buildDate = new Date(buildInfo.buildDate).toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const runUpdateCheck = async () => {
    setUpdate("checking");
    setUpdate(await checkForUpdate());
  };

  return (
    <>
      <PageHeader title={t.title} backTo={routes.settings} />
      <div className="flex flex-col items-center px-8 pt-4 pb-2 text-center">
        <img src="/logo.svg" alt="" className="mb-4 size-20 rounded-3xl" />
        <p className="text-xl font-extrabold">{fr.appName}</p>
        <p className="mt-1 max-w-xs text-muted-foreground">{t.tagline}</p>
      </div>
      <Section>
        <Row label={t.version}>
          <span
            data-testid="app-version"
            className="text-right font-semibold text-secondary tabular-nums"
          >
            {formatVersion(buildInfo)}
          </span>
        </Row>
        <Row label={t.build}>
          <span className="text-right text-muted-foreground">{buildDate}</span>
        </Row>
        <div className="flex flex-col gap-2 px-4 py-3">
          <Button
            disabled={update === "checking"}
            onClick={() => void runUpdateCheck()}
          >
            {update === "checking" ? t.updates.checking : t.updates.check}
          </Button>
          {update && update !== "checking" && (
            <p
              role="status"
              className="text-center text-sm text-muted-foreground"
            >
              {t.updates[update]}
            </p>
          )}
        </div>
      </Section>
      <Section className="pb-6">
        <LinkRow
          to={routes.releaseNotes}
          icon={<Sparkles />}
          label={t.releaseNotes}
          hint={t.releaseNotesHint}
        />
        <LinkRow
          to={routes.licences}
          icon={<Scale />}
          label={t.licences}
          hint={t.licencesHint}
        />
        <a
          href={REPOSITORY}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-14 items-center gap-3 px-4 py-3 active:bg-raised"
        >
          <Code className="size-5 shrink-0 text-secondary" aria-hidden />
          <span className="flex-1 font-semibold">{t.source}</span>
          <ExternalLink className="size-5 text-muted-foreground" aria-hidden />
        </a>
      </Section>
    </>
  );
}
