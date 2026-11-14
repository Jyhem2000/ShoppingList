import {
  ClipboardCopy,
  ClipboardPaste,
  Download,
  History,
  Upload,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useRef, useState } from "react";
import { routes } from "@/app/routes";
import {
  type Backup,
  backupFileName,
  type BackupSummary,
  exportBackup,
  importBackup,
  readBackup,
} from "@/db/backup";
import { type AutoCopy, listCopies, restoreCopy } from "@/db/copies";
import { db } from "@/db/database";
import { useSettings } from "@/db/hooks";
import { updateSettings } from "@/db/settings";
import { fr } from "@/i18n/fr";
import { canCopyText, copyText, pasteText } from "@/platform/clipboard";
import { shareOrDownload } from "@/platform/share";
import { Button } from "@/ui/button";
import { ConfirmActions, Field, TextArea } from "@/ui/form";
import { PageHeader, Section } from "@/ui/Page";
import { Sheet } from "@/ui/Sheet";
import { showToast } from "@/ui/toast";
import { RowButton } from "@/ui/RowButton";
import { useNow } from "@/ui/useNow";
import { daysSince } from "./backupAge";

const t = fr.manage.backup;

/**
 * Sauvegarde (docs/03 H4, docs/04 § 2.7), dans « Mes données » : garder une copie (fichier
 * par la feuille de partage du téléphone, ou texte dans le presse-papiers) et récupérer
 * une copie (fichier ou texte collé), en remplacement, après confirmation. Les quatre
 * actions ont le même poids : aucune n'est l'action principale de l'écran. En dessous,
 * les copies automatiques des 7 derniers jours, à restaurer après confirmation.
 */
export function BackupPage() {
  const settings = useSettings();
  const file = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{
    backup: Backup;
    summary: BackupSummary;
  } | null>(null);
  const now = useNow();
  const copies = useLiveQuery(() => listCopies(db));
  const [restoring, setRestoring] = useState<AutoCopy | null>(null);
  const longDate = (at: number) =>
    new Date(at).toLocaleDateString("fr-FR", { dateStyle: "long" });
  const days = daysSince(settings?.lastBackupAt, now);

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

  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState("");

  const readText = (text: string, invalid: string) => {
    const result = readBackup(text, db.verno);
    if (result.kind === "ok") {
      setPasting(false);
      setPending(result);
    } else
      showToast(result.kind === "newer" ? t.newer : invalid, {
        tone: "warning",
      });
  };

  const readFile = async (chosen: File) => {
    readText(await chosen.text(), t.invalid);
  };

  // La copie part du toucher : le texte est fabriqué pendant qu'elle a lieu.
  const copyData = () => {
    let exportedAt = 0;
    const text = exportBackup(db).then((backup) => {
      exportedAt = backup.exportedAt;
      return JSON.stringify(backup);
    });
    void copyText(text).then(async (copied) => {
      if (!copied) {
        showToast(t.copyFailed, { tone: "warning" });
        return;
      }
      await updateSettings(db, { lastBackupAt: exportedAt });
      showToast(t.copied, { tone: "success" });
    });
  };

  // Coller : directement si le téléphone le permet, sinon dans un champ.
  const pasteData = async () => {
    const text = await pasteText();
    if (text?.trim()) readText(text, t.invalidText);
    else {
      setPasted("");
      setPasting(true);
    }
  };

  return (
    <>
      <PageHeader title={t.section} backTo={routes.settings} />
      <p className="px-5 text-sm text-muted-foreground">
        {/* Rien tant que les réglages ne sont pas lus : sinon « Aucune sauvegarde » s'affiche un instant. */}
        {settings ? t.last(days) : "\u00a0"}
      </p>

      <Section title={t.keep}>
        <div className="flex flex-col gap-3 px-4 py-4">
          <p className="text-sm text-muted-foreground">{t.exportHint}</p>
          <Button variant="outline" onClick={() => void exportData()}>
            <Download />
            {t.export}
          </Button>
          {canCopyText() && (
            <>
              <Button variant="outline" onClick={copyData}>
                <ClipboardCopy />
                {t.copy}
              </Button>
              <p className="text-sm text-muted-foreground">{t.copyHint}</p>
            </>
          )}
        </div>
      </Section>

      <Section title={t.restore}>
        <div className="flex flex-col gap-3 px-4 py-4">
          <p className="text-sm text-muted-foreground">{t.importHint}</p>
          <Button
            variant="outline"
            onClick={() => {
              file.current?.click();
            }}
          >
            <Upload />
            {t.import}
          </Button>
          <Button variant="outline" onClick={() => void pasteData()}>
            <ClipboardPaste />
            {t.paste}
          </Button>
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
      </Section>

      <Section title={t.copies.section} className="pb-6">
        <p className="px-4 pt-4 pb-2 text-sm text-muted-foreground">
          {t.copies.hint}
        </p>
        {copies?.length === 0 && (
          <p className="px-4 pb-4 text-sm text-muted-foreground">
            {t.copies.none}
          </p>
        )}
        {copies?.map((copy) => (
          <RowButton
            key={copy.id}
            icon={<History className="size-5 shrink-0 text-secondary" />}
            title={t.copies.title(
              new Date(copy.at).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              }),
            )}
            detail={t.copies.summary(
              copy.summary.articles,
              copy.summary.lists,
              copy.summary.stores,
            )}
            chevron
            onClick={() => {
              setRestoring(copy);
            }}
          />
        ))}
      </Section>
      {restoring && (
        <Sheet
          open
          autoFocus={false}
          onOpenChange={(open) => {
            if (!open) setRestoring(null);
          }}
          title={t.copies.restoreTitle(longDate(restoring.at))}
          description={t.copies.restoreText}
        >
          <ConfirmActions
            label={t.copies.restoreConfirm}
            onConfirm={() => {
              void restoreCopy(db, restoring.id).then(() => {
                // Tout l'état de l'app repart des données restaurées.
                window.location.reload();
              });
            }}
            onCancel={() => {
              setRestoring(null);
            }}
          />
        </Sheet>
      )}
      {pasting && (
        <Sheet
          open
          onOpenChange={(open) => {
            if (!open) setPasting(false);
          }}
          title={t.pasteTitle}
          description={t.pasteText}
        >
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              readText(pasted, t.invalidText);
            }}
          >
            <Field label={t.pasteTitle}>
              <TextArea
                value={pasted}
                placeholder={t.pastePlaceholder}
                onChange={(event) => {
                  setPasted(event.target.value);
                }}
              />
            </Field>
            <Button type="submit" disabled={!pasted.trim()}>
              {t.pasteCheck}
            </Button>
          </form>
        </Sheet>
      )}
      {pending && (
        <Sheet
          open
          autoFocus={false}
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
          title={t.importTitle}
          description={t.importText(
            longDate(pending.summary.exportedAt),
            pending.summary.articles,
            pending.summary.lists,
            pending.summary.stores,
          )}
        >
          <ConfirmActions
            label={t.importConfirm}
            onConfirm={() => {
              void importBackup(db, pending.backup).then(() => {
                // Tout l'état de l'app repart des données importées.
                window.location.reload();
              });
            }}
            onCancel={() => {
              setPending(null);
            }}
          />
        </Sheet>
      )}
    </>
  );
}
