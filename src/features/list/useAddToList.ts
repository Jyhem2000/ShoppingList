import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/db/database";
import { addListItem } from "@/db/items";
import { updateItem } from "@/db/lists";
import {
  entryAmount,
  parseEntry,
  resolveEntry,
  type ParsedEntry,
} from "@/domain/entry";
import type { Article, ListItem, Unit } from "@/domain/model";
import { formatQuantity, type Amount } from "@/domain/quantity";
import { feedback } from "@/feedback";
import { fr } from "@/i18n/fr";
import { showToast } from "@/ui/toast";
import type { ListData } from "./useListData";

/** Échec d'enregistrement (rare : stockage plein ou refusé) : on le dit. */
export function reportSaveError(): void {
  feedback.error();
  showToast(fr.list.saveError, { tone: "error" });
}

/** Ajout en attente d'une réponse : article déjà présent, ou article à créer. */
export type PendingAdd =
  | {
      kind: "exists";
      item: ListItem;
      article: Article;
      amount: Amount<Unit>;
      acceptedTypes: string[];
    }
  | { kind: "create"; entry: ParsedEntry };

/**
 * Ajout à la liste courante (docs/03 A1 à A4, H8) : la saisie est découpée en
 * lignes ; les articles connus sont ajoutés tout de suite, les autres attendent une
 * réponse (« Déjà dans la liste », « Créer… »), un panneau à la fois.
 * `onAdded` : appelé pour chaque nouvelle ligne (mode courses, docs/03 C4).
 */
export function useAddToList(
  data: ListData | undefined,
  onAdded?: (item: ListItem, article: Article) => void,
) {
  const [queue, setQueue] = useState<PendingAdd[]>([]);
  const added = useRef(onAdded);
  useEffect(() => {
    added.current = onAdded;
  });

  const addArticle = useCallback(
    async (
      article: Article,
      entry: ParsedEntry = { text: article.name },
      acceptedTypes: string[] = [],
    ): Promise<PendingAdd | undefined> => {
      if (!data) return undefined;
      // Toujours simplifiée (docs/03 H8).
      const amount = entryAmount(entry, article, data.units, true);
      if (!amount) return undefined;
      const result = await addListItem(db, {
        listId: data.list.id,
        articleId: article.id,
        quantity: amount.quantity,
        unitId: amount.unit.id,
        acceptedTypes,
      });
      if (result.kind === "exists")
        return {
          kind: "exists",
          item: result.item,
          article,
          amount,
          acceptedTypes,
        };
      feedback.add();
      added.current?.(result.item, article);
      // Simplifiée (1200 g → 1,2 kg) : on le dit, avec « Annuler » (docs/03 H8).
      const raw = entryAmount(entry, article, data.units, false);
      if (raw && raw.unit.id !== amount.unit.id) {
        const item = result.item;
        showToast(
          fr.list.converted(formatQuantity(amount.quantity, amount.unit)),
          {
            tone: "info",
            action: {
              label: fr.list.undo,
              run: () => {
                void updateItem(db, item.id, {
                  quantity: raw.quantity,
                  unitId: raw.unit.id,
                });
              },
            },
          },
        );
      }
      return undefined;
    },
    [data],
  );

  /** Saisie de la barre d'ajout : une ou plusieurs lignes (« 2 baguettes, du beurre »). */
  const submit = useCallback(
    async (text: string) => {
      if (!data) return;
      const pending: PendingAdd[] = [];
      try {
        for (const entry of parseEntry(text, data.units)) {
          const { article, acceptedTypes } = resolveEntry(
            entry.text,
            data.articles,
          );
          if (!article) {
            pending.push({ kind: "create", entry });
            continue;
          }
          const waiting = await addArticle(article, entry, acceptedTypes);
          if (waiting) pending.push(waiting);
        }
      } catch {
        reportSaveError();
      }
      if (pending.length) setQueue((current) => [...current, ...pending]);
    },
    [data, addArticle],
  );

  /** Ajout d'un article choisi (suggestion, catalogue). */
  const pick = useCallback(
    async (article: Article, entry?: ParsedEntry) => {
      try {
        const waiting = await addArticle(article, entry);
        if (waiting) setQueue((current) => [...current, waiting]);
      } catch {
        reportSaveError();
      }
    },
    [addArticle],
  );

  /** « Créer … » choisi dans les suggestions. */
  const create = useCallback((entry: ParsedEntry) => {
    setQueue((current) => [...current, { kind: "create", entry }]);
  }, []);

  const next = useCallback(() => {
    setQueue((current) => current.slice(1));
  }, []);

  return { submit, pick, create, addArticle, pending: queue[0], next };
}
