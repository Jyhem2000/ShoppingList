import { routes } from "@/app/routes";
import { fr } from "@/i18n/fr";
import { PageHeader, Row, Section } from "@/ui/Page";
import { buildInfo, formatVersion } from "@/version";

const REPOSITORY = "https://github.com/Jyhem2000/ShoppingList";

/** Écran « À propos » : version, licences (docs/03 H5). */
export function AboutPage() {
  const buildDate = new Date(buildInfo.buildDate).toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <>
      <PageHeader title={fr.about.title} backTo={routes.settings} />
      <div className="flex flex-col items-center px-8 pt-4 pb-2 text-center">
        <img src="/logo.svg" alt="" className="mb-4 size-20 rounded-3xl" />
        <p className="text-xl font-extrabold">{fr.appName}</p>
        <p className="mt-1 max-w-xs text-muted-foreground">{fr.about.tagline}</p>
      </div>
      <Section>
        <Row label={fr.about.version}>
          <span
            data-testid="app-version"
            className="text-right font-semibold text-gold tabular-nums"
          >
            {formatVersion(buildInfo)}
          </span>
        </Row>
        <Row label={fr.about.build}>
          <span className="text-right text-muted-foreground">{buildDate}</span>
        </Row>
        <Row label={fr.about.source}>
          <a href={REPOSITORY} target="_blank" rel="noreferrer" className="text-primary underline">
            GitHub
          </a>
        </Row>
      </Section>
      <Section title={fr.about.licences}>
        <p className="px-4 py-3 text-sm text-muted-foreground">{fr.about.licencesText}</p>
      </Section>
    </>
  );
}
