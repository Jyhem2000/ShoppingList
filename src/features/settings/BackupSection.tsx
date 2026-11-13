import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import {
  type Backup,
  backupFileName,
  type BackupSummary,
  exportBackup,
  importBackup,
  readBackup,
} from "@/db/backup";
import { db } from "@/db/database";
import { useSettings } from "@/db/hooks";
import { updateSettings } from "@/db/settings";
import { fr } from "@/i18n/fr";
import { shareOrDownload } from "@/platform/share";
import { Button } from "@/ui/button";
import { Section } from "@/ui/Page";
import { Sheet } from "@/ui/Sheet";
import { showToast } from "@/ui/toast";

const t = fr.manage.backup;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Sauvegarde (docs/03 H4) : exporter toutes les données dans un fichier (feuille de
 * partage du téléphone), et importer un fichier en remplacement, après confirmation.
 */
export function BackupSection() {
  const settings = useSettings();
  const file = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{
    backup: Backup;
    summary: BackupSummary;
  } | null>(null);
  const [now] = useState(() => Date.now());
  const last = settings?.lastBackupAt;
  const days =
    last === undefined ? undefined : Math.floor((now - last) / DAY_MS);

  const exportData = async () => {
    const backup = await exportBackup(db);
    const blob = new File(
      [JSON.stringify(backup)],
      backupFileName(backup.exportedAt),
      {
        type: "application/json",
      },
    );
    if (await shareOrDownload(blob)) {
      await updateSettings(db, { lastBackupAt: backup.exportedAt });
      showToast(t.exported, { tone: "success" });
    }
  };

  const readFile = async (chosen: File) => {
    const result = readBackup(await chosen.text(), db.verno);
    if (result.kind === "ok") setPending(result);
    else
      showToast(result.kind === "newer" ? t.newer : t.invalid, {
        tone: "warning",
      });
  };

  return (
    <Section title={t.section}>
      <div className="flex flex-col gap-3 px-4 py-4">
        <p className="text-sm text-muted-foreground">{t.exportHint}</p>
        <Button onClick={() => void exportData()}>
          <Download />
          {t.export}
        </Button>
        <p className="text-sm text-muted-foreground">{t.last(days)}</p>
        <Button
          variant="outline"
          onClick={() => {
            file.current?.click();
          }}
        >
          <Upload />
          {t.import}
        </Button>
        <p className="text-sm text-muted-foreground">{t.importHint}</p>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const chosen = event.target.files?.[0];
            event.target.value = "";
            if (chosen) void readFile(chosen);
          }}
        />
      </div>
      {pending && (
        <Sheet
          open
          autoFocus={false}
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
          title={t.importTitle}
          description={t.importText(
            new Date(pending.summary.exportedAt).toLocaleDateString("fr-FR", {
              dateStyle: "long",
            }),
            pending.summary.articles,
            pending.summary.lists,
            pending.summary.stores,
          )}
        >
          <div className="flex flex-col gap-3">
            <Button
              variant="destructive"
              onClick={() => {
                void importBackup(db, pending.backup).then(() => {
                  // Tout l'état de l'app repart des données importées.
                  window.location.reload();
                });
              }}
            >
              {t.importConfirm}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPending(null);
              }}
            >
              {fr.manage.confirmCancel}
            </Button>
          </div>
        </Sheet>
      )}
    </Section>
  );
}
