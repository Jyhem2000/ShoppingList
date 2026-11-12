import { routes } from "@/app/routes";
import { fr } from "@/i18n/fr";
import { PageHeader, Section } from "@/ui/Page";

const t = fr.releaseNotes;

/**
 * Nouveautés de chaque version, écrites pour l'utilisateur (docs/07 § 9).
 * Le même contenu servira à l'écran « Quoi de neuf » après une mise à jour (H5).
 */
export function ReleaseNotesPage() {
  return (
    <>
      <PageHeader title={t.title} backTo={routes.about} />
      {t.versions.map((release) => (
        <Section
          key={release.version}
          title={`${t.version(release.version)} · ${new Date(release.date).toLocaleDateString("fr-FR", { dateStyle: "long" })}`}
          className="last:pb-6"
        >
          <ul className="space-y-2 px-4 py-3">
            {release.items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="pt-0.5 text-secondary" aria-hidden>
                  •
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      ))}
    </>
  );
}
