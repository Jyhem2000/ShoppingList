import { useLiveQuery } from "dexie-react-hooks";
import {
  Apple,
  DatabaseBackup,
  Info,
  LayoutGrid,
  Lightbulb,
  Ruler,
  SlidersHorizontal,
  Store,
} from "lucide-react";
import type { ReactNode } from "react";
import { routes } from "@/app/routes";
import { db } from "@/db/database";
import { useSettings } from "@/db/hooks";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { NavButton } from "@/ui/NavButton";
import { LinkRow, PageHeader, Row, Section, SectionTitle } from "@/ui/Page";
import { resetTips } from "@/ui/tips";
import { showToast } from "@/ui/toast";
import { daysSince } from "./backupAge";

import { useNow } from "@/ui/useNow";
const t = fr.settings;

/**
 * Écran Réglages (docs/04 § 2.7), organisé en accueil : « Mes données » en tête (le
 * cœur du paramétrage, en grandes tuiles, avec la sauvegarde), puis l'application —
 * les préférences, réglées une fois pour toutes, derrière une seule ligne.
 */
export function SettingsPage() {
  const settings = useSettings();
  const counts = useLiveQuery(async () => {
    const [articles, categories, stores, units] = await Promise.all([
      db.articles.count(),
      db.categories.count(),
      db.stores.count(),
      db.units.count(),
    ]);
    return { articles, categories, stores, units };
  });
  const now = useNow();

  return (
    <>
      <PageHeader title={t.title} />

      <section className="px-4 pt-2">
        <SectionTitle>{fr.manage.section}</SectionTitle>
        <p className="-mt-1 px-1 pb-3 text-sm text-muted-foreground">
          {t.dataIntro}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Tile
            to={routes.manageArticles}
            icon={<Apple />}
            label={fr.manage.articles.title}
            count={counts && t.counts.articles(counts.articles)}
          />
          <Tile
            to={routes.manageCategories}
            icon={<LayoutGrid />}
            label={fr.manage.categories.title}
            count={counts && t.counts.categories(counts.categories)}
          />
          <Tile
            to={routes.manageStores}
            icon={<Store />}
            label={fr.manage.stores.title}
            count={counts && t.counts.stores(counts.stores)}
          />
          <Tile
            to={routes.manageUnits}
            icon={<Ruler />}
            label={fr.manage.units.title}
            count={counts && t.counts.units(counts.units)}
          />
        </div>
        <div className="mt-3 overflow-hidden rounded-2xl bg-surface">
          <LinkRow
            to={routes.backup}
            icon={<DatabaseBackup />}
            label={fr.manage.backup.section}
            hint={
              settings &&
              fr.manage.backup.last(daysSince(settings.lastBackupAt, now))
            }
          />
        </div>
      </section>

      <Section title={t.sectionApp} className="pt-8 pb-6">
        <LinkRow
          to={routes.preferences}
          icon={<SlidersHorizontal />}
          label={t.preferences.title}
          hint={t.preferences.hint}
        />
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
        <LinkRow to={routes.about} icon={<Info />} label={t.about} />
      </Section>
    </>
  );
}

/** Grande tuile de « Mes données » : icône, nom, et combien il y en a. */
function Tile({
  to,
  icon,
  label,
  count,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  count: string | undefined;
}) {
  return (
    <NavButton
      to={to}
      className="flex min-h-28 flex-col items-start justify-between gap-3 rounded-2xl bg-surface p-4 text-left active:bg-raised"
    >
      <span className="text-secondary [&_svg]:size-7">{icon}</span>
      <span>
        <span className="block leading-tight font-bold">{label}</span>
        <span className="block text-sm text-muted-foreground">
          {count ?? " "}
        </span>
      </span>
    </NavButton>
  );
}
