import { useCallback, useState } from "react";
import { parseEntry, resolveEntry, type ParsedEntry } from "@/domain/entry";
import type { Article, Unit } from "@/domain/model";
import { reportSaveError } from "@/ui/toast";

/**
 * Saisie naturelle d'articles (liste, ingrédients d'une recette) : le texte est découpé
 * en lignes (« 2 baguettes, du beurre ») ; chaque article reconnu passe par `add`,
 * qui peut demander une réponse (renvoie ce qui attend) ; un article inconnu attend
 * d'être créé (`toCreate`). Les attentes forment une file, montrée une à la fois
 * (`pending`, puis `next`) ; `enqueue` y ajoute une attente venue d'ailleurs.
 */
export function useEntryAdder<Pending>(
  data: { units: readonly Unit[]; articles: readonly Article[] } | undefined,
  add: (
    article: Article,
    entry: ParsedEntry,
    acceptedTypes: string[],
  ) => Promise<Pending | undefined>,
  toCreate: (entry: ParsedEntry) => Pending,
) {
  const [queue, setQueue] = useState<Pending[]>([]);

  const enqueue = useCallback((...waiting: Pending[]) => {
    if (waiting.length) setQueue((current) => [...current, ...waiting]);
  }, []);

  const submit = useCallback(
    async (text: string) => {
      if (!data) return;
      const waiting: Pending[] = [];
      try {
        for (const entry of parseEntry(text, data.units)) {
          const { article, acceptedTypes } = resolveEntry(
            entry.text,
            data.articles,
          );
          const wait = article
            ? await add(article, entry, acceptedTypes)
            : toCreate(entry);
          if (wait !== undefined) waiting.push(wait);
        }
      } catch {
        reportSaveError();
      }
      enqueue(...waiting);
    },
    [data, add, toCreate, enqueue],
  );

  const next = useCallback(() => {
    setQueue((current) => current.slice(1));
  }, []);

  return { submit, enqueue, pending: queue.at(0), next };
}
