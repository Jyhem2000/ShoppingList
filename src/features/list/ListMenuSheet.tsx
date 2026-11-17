import {
  CircleCheckBig,
  ClipboardPaste,
  Copy,
  Eraser,
  ListPlus,
  Pencil,
  Share,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { db } from "@/db/database";
import { deleteList, duplicateList, updateList } from "@/db/lists";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { ConfirmActions, Field, MenuItem, TextInput } from "@/ui/form";
import { Sheet } from "@/ui/Sheet";
import type { ListData } from "./useListData";
import { feedback } from "@/feedback";
import { canShare, listMessage, sendMessage } from "@/features/share/message";
import { PasteForm } from "@/features/share/PasteForm";
import { pasteText } from "@/platform/clipboard";

const t = fr.list.menuSheet;

type View = "menu" | "rename" | "paste" | "clear" | "delete";

/**
 * Menu `⋯` de la liste (docs/04 § 2.1, docs/03 B2, B6, F1, F2) : seulement des actions sur
 * la liste courante — renommer, dupliquer, y ajouter le contenu d'une autre liste, la
 * partager, y coller une liste, retirer les cochés, vider, supprimer. Les autres listes :
 * toucher le nom de la liste. « Coller une liste » lit le presse-papiers ; s'il est
 * refusé, un champ où coller à la main.
 */
export function ListMenuSheet({
  data,
  onClose,
  onAddLists,
  onRemoveItems,
  onPaste,
}: {
  data: ListData;
  onClose: () => void;
  onAddLists: () => void;
  onRemoveItems: (ids: string[]) => void;
  /** Texte collé (message reçu, liste) : aperçu de l'import. */
  onPaste: (text: string) => void;
}) {
  const [view, setView] = useState<View>("menu");
  const [name, setName] = useState(data.list.name);
  const checked = data.items.filter((item) => item.status === "checked");

  const title =
    view === "rename"
      ? t.renameTitle
      : view === "paste"
        ? fr.share.pasteTitle
        : view === "clear"
          ? t.confirmClear
          : view === "delete"
            ? t.confirmDelete(data.list.name)
            : data.list.name;

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={title}
      description={
        view === "clear"
          ? t.confirmClearText
          : view === "delete"
            ? t.confirmDeleteText
            : view === "paste"
              ? fr.share.pasteText
              : view === "menu"
                ? t.description
                : undefined
      }
    >
      {view === "menu" && (
        <div className="flex flex-col">
          <MenuItem
            icon={<Pencil />}
            onClick={() => {
              setView("rename");
            }}
          >
            {t.rename}
          </MenuItem>
          <MenuItem
            icon={<Copy />}
            onClick={() => {
              void duplicateList(db, data.list.id, t.copyName(data.list.name));
              onClose();
            }}
          >
            {t.duplicate}
          </MenuItem>
          <MenuItem
            icon={<ListPlus />}
            disabled={data.lists.length < 2}
            onClick={onAddLists}
          >
            {t.addLists}
          </MenuItem>
          <MenuItem
            icon={<Share />}
            disabled={!canShare(data)}
            onClick={() => {
              void sendMessage(listMessage(data), fr.share.copied);
              onClose();
            }}
          >
            {fr.share.send}
          </MenuItem>
          <MenuItem
            icon={<ClipboardPaste />}
            onClick={() => {
              // Lu pendant le toucher (iPhone : bulle « Coller » à confirmer).
              void pasteText().then((text) => {
                if (text?.trim()) onPaste(text);
                else setView("paste");
              });
            }}
          >
            {fr.share.paste}
          </MenuItem>
          <MenuItem
            icon={<CircleCheckBig />}
            disabled={checked.length === 0}
            onClick={() => {
              onRemoveItems(checked.map((item) => item.id));
              onClose();
            }}
          >
            {t.removeChecked}
          </MenuItem>
          <MenuItem
            icon={<Eraser />}
            disabled={data.items.length === 0}
            onClick={() => {
              setView("clear");
            }}
          >
            {t.clear}
          </MenuItem>
          <MenuItem
            icon={<Trash2 />}
            danger
            disabled={data.lists.length < 2}
            onClick={() => {
              setView("delete");
            }}
          >
            {t.delete}
          </MenuItem>
        </div>
      )}

      {view === "rename" && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            void updateList(db, data.list.id, { name: name.trim() });
            onClose();
          }}
        >
          <Field label={fr.list.lists.name}>
            <TextInput
              value={name}
              autoFocus
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
          </Field>
          <Button type="submit">{t.save}</Button>
        </form>
      )}

      {view === "paste" && (
        <PasteForm
          label={fr.share.pasteTitle}
          placeholder={fr.share.pastePlaceholder}
          onPaste={onPaste}
        />
      )}

      {(view === "clear" || view === "delete") && (
        <ConfirmActions
          label={view === "clear" ? t.clear : t.delete}
          onConfirm={() => {
            if (view === "clear")
              onRemoveItems(data.items.map((item) => item.id));
            else
              void deleteList(db, data.list.id).then(() => {
                feedback.remove();
              });
            onClose();
          }}
          onCancel={onClose}
        />
      )}
    </Sheet>
  );
}
