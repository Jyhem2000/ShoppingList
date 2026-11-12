import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { routes } from "@/app/routes";
import { fr } from "@/i18n/fr";
import { PageHeader, Section } from "@/ui/Page";

interface Licence {
  name: string;
  version: string;
  license?: string;
  text: string;
}

const t = fr.licences;

/**
 * Bibliothèques incluses dans l'app et texte de leur licence (`licences.json`,
 * généré au build, disponible hors ligne).
 */
export function LicencesPage() {
  const [licences, setLicences] = useState<Licence[] | null | "error">(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}licences.json`)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<Licence[]>;
      })
      .then(setLicences)
      .catch(() => {
        setLicences("error");
      });
  }, []);

  return (
    <>
      <PageHeader title={t.title} backTo={routes.about} />
      <p className="px-5 text-sm text-muted-foreground">{t.intro}</p>
      {licences === "error" && (
        <p className="px-5 pt-4 text-sm text-muted-foreground">
          {t.unavailable}
        </p>
      )}
      {Array.isArray(licences) && (
        <Section className="pb-6">
          {licences.map((licence) => (
            <details key={licence.name} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 active:bg-raised [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold break-words">
                    {licence.name}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {licence.version} · {licence.license ?? t.unknown}
                  </span>
                </span>
                <ChevronDown
                  className="size-5 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <pre className="mx-4 mb-4 overflow-x-auto rounded-xl bg-bg p-3 text-xs whitespace-pre-wrap text-muted-foreground">
                {licence.text || t.noText}
              </pre>
            </details>
          ))}
        </Section>
      )}
    </>
  );
}
