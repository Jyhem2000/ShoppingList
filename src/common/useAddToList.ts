import { useCallback, useEffect, useRef } from "react";
import { db } from "@/db/database";
import { addListItem } from "@/db/items";
import { updateItem } from "@/db/lists";
import { entryAmount, type ParsedEntry } from "@/domain/entry";
import type { Article, ListItem, Unit } from "@/domain/model";
import { formatQuantity, type Amount } from "@/domain/quantity";
import { feedback } from "@/feedback";
import { texts } from "@/i18n";
import { reportSaveError, showToast } from "@/ui/toast";
import { useEntryAdder } from "./useEntryAdder";
import type { ListData } from "./useListData";

/** Ajout en attente d'une réponse : article déjà présent, ou article à créer. */
export type PendingAdd =
  | {
      kind: "exists";
      item: ListItem;
      article: Article;
      entry: ParsedEntry;
      amount: Amount<Unit>;
      acceptedTypes: string[];
    }
  | { kind: "create"; entry: ParsedEntry };

const toCreate = (entry: ParsedEntry): PendingAdd => ({
  kind: "create",
  entry,
});

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
      // Sans unité précisée : celle qu'on achète le plus (unité selon l'usage). Un
      // article tout juste créé n'a pas encore d'achats : tel quel.
      const usual = data.addableById.get(article.id) ?? article;
      // Toujours simplifiée (docs/03 H8).
      const amount = entryAmount(entry, usual, data.units, true);
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
          entry,
          amount,
          acceptedTypes,
        };
      feedback.add();
      added.current?.(result.item, article);
      // Simplifiée (1200 g → 1,2 kg) : on le dit, avec « Annuler » (docs/03 H8).
      const raw = entryAmount(entry, usual, data.units, false);
      if (raw && raw.unit.id !== amount.unit.id) {
        const item = result.item;
        showToast(
          texts.list.converted(formatQuantity(amount.quantity, amount.unit)),
          {
            tone: "info",
            action: {
              label: texts.list.undo,
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
  const { submit, enqueue, pending, next } = useEntryAdder(
    data,
    addArticle,
    toCreate,
  );

  /** Ajout d'un article choisi (suggestion, catalogue). */
  const pick = useCallback(
    async (
      article: Article,
      entry?: ParsedEntry,
      acceptedTypes: string[] = [],
    ) => {
      try {
        const waiting = await addArticle(article, entry, acceptedTypes);
        if (waiting) enqueue(waiting);
      } catch {
        reportSaveError();
      }
    },
    [addArticle, enqueue],
  );

  /**
   * « Une autre sorte » (docs/02 § 6) : ligne à part pour ce type, avec la quantité
   * demandée (ou celle de l'article).
   */
  const addType = useCallback(
    async (article: Article, type: string, entry?: ParsedEntry) => {
      try {
        const waiting = await addArticle(article, entry, [type]);
        if (waiting) enqueue(waiting);
      } catch {
        reportSaveError();
      }
    },
    [addArticle, enqueue],
  );

  /** « Créer … » choisi dans les suggestions. */
  const create = useCallback(
    (entry: ParsedEntry) => {
      enqueue(toCreate(entry));
    },
    [enqueue],
  );

  return {
    submit,
    pick,
    create,
    addArticle,
    addType,
    pending,
    next,
  };
}
