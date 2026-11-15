import { Lightbulb } from "lucide-react";
import { routes } from "@/app/routes";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { PageHeader, Row, Section } from "@/ui/Page";
import { resetTips } from "@/ui/tips";
import { showToast } from "@/ui/toast";

const t = fr.help;

/**
 * Aide (docs/03 H10) : un mode d'emploi court, ce que l'app règle toute seule, le
 * conseil de suivre le même parcours au début, et « Revoir les conseils » (H12).
 */
export function HelpPage() {
  return (
    <>
      <PageHeader title={t.title} backTo={routes.settings} />

      <div className="px-4 pt-2">
        <p className="flex gap-3 rounded-2xl bg-raised p-4 text-sm">
          <Lightbulb className="size-5 shrink-0 text-secondary" aria-hidden />
          <span>
            <span className="block font-bold">{t.advice.title}</span>
            {t.advice.text}
          </span>
        </p>
      </div>

      {t.sections.map((section) => (
        <Section key={section.title} title={section.title}>
          <ul className="divide-y divide-border">
            {section.points.map((point) => (
              <li key={point} className="px-4 py-3 text-sm">
                {point}
              </li>
            ))}
          </ul>
        </Section>
      ))}

      <Section className="pb-6">
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
      </Section>
    </>
  );
}
