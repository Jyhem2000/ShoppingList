import { routes } from "@/app/routes";
import { fr } from "@/i18n/fr";
import { PageHeader, Section } from "@/ui/Page";
import { buildInfo, compareVersions } from "@/version";

const t = fr.releaseNotes;

/**
 * Nouveautés de chaque version, écrites pour l'utilisateur (docs/07 § 9).
 * Le même contenu servira à l'écran « Quoi de neuf » après une mise à jour (H5).
 * Les nouveautés déjà écrites d'une version pas encore publiée restent cachées.
 */
export function ReleaseNotesPage() {
  return (
    <>
      <PageHeader title={t.title} backTo={routes.about} />
      {t.versions
        .filter(
          (release) => compareVersions(release.version, buildInfo.version) <= 0,
        )
        .map((release) => (
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
