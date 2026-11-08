import { useState } from "react";
import { checkForUpdate, type UpdateCheckResult } from "@/app/pwa/serviceWorker";
import { routes } from "@/app/routes";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { PageHeader, Row, Section } from "@/ui/Page";
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
            className="text-right font-semibold text-gold tabular-nums"
          >
            {formatVersion(buildInfo)}
          </span>
        </Row>
        <Row label={t.build}>
          <span className="text-right text-muted-foreground">{buildDate}</span>
        </Row>
        <div className="flex flex-col gap-2 px-4 py-3">
          <Button
            variant="secondary"
            disabled={update === "checking"}
            onClick={() => void runUpdateCheck()}
          >
            {update === "checking" ? t.updates.checking : t.updates.check}
          </Button>
          {update && update !== "checking" && (
            <p role="status" className="text-center text-sm text-muted-foreground">
              {t.updates[update]}
            </p>
          )}
        </div>
      </Section>
      <Section className="pb-6">
        <Row label={t.source}>
          <a href={REPOSITORY} target="_blank" rel="noreferrer" className="text-primary underline">
            GitHub
          </a>
        </Row>
        <Row label={t.licences}>
          <a
            href="/licences.txt"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            {t.licencesLink}
          </a>
        </Row>
      </Section>
    </>
  );
}
