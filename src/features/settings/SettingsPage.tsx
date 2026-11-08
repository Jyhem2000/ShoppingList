import { ChevronRight, Info, Stethoscope } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { routes } from "@/app/routes";
import { fr } from "@/i18n/fr";
import { PageHeader, Section } from "@/ui/Page";

function LinkRow({
  to,
  icon,
  label,
  hint,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <Link to={to} className="flex min-h-14 items-center gap-3 px-4 py-2 active:bg-surface-2">
      <span className="text-primary">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
      </span>
      <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
    </Link>
  );
}

/** Écran Réglages. Les réglages réels arrivent en phase 7. */
export function SettingsPage() {
  return (
    <>
      <PageHeader title={fr.settings.title} />
      <Section title={fr.settings.sectionApp}>
        <LinkRow to={routes.about} icon={<Info className="size-5" />} label={fr.settings.about} />
      </Section>
      <Section title={fr.settings.sectionDev}>
        <LinkRow
          to={routes.diagnostic}
          icon={<Stethoscope className="size-5" />}
          label={fr.settings.diagnostic}
          hint={fr.settings.diagnosticHint}
        />
      </Section>
    </>
  );
}
