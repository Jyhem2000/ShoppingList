import { useState } from "react";
import type { Article } from "@/domain/model";
import { useAddToList } from "@/features/list/useAddToList";
import type { ListData } from "@/features/list/useListData";
import { QuantitySheet } from "./QuantitySheet";

/**
 * Choisir un article du catalogue (docs/03 A5) : absent de la liste, il est ajouté avec
 * sa quantité par défaut ; déjà présent, le réglage de toutes ses lignes s'ouvre au
 * lieu d'ajouter.
 * `sheet` : le panneau de réglage, à afficher par l'appelant.
 */
export function useCatalogPick(data: ListData) {
  const adding = useAddToList(data);
  const [open, setOpen] = useState<string | null>(null);
  const openArticle = open ? data.articleById.get(open) : undefined;
  const inList = (article: Article) =>
    data.items.some((item) => item.articleId === article.id);

  const pick = (article: Article): "added" | "opened" => {
    if (inList(article)) {
      setOpen(article.id);
      return "opened";
    }
    void adding.pick(article);
    return "added";
  };

  const sheet = openArticle && inList(openArticle) && (
    <QuantitySheet
      key={openArticle.id}
      article={openArticle}
      data={data}
      onClose={() => {
        setOpen(null);
      }}
      onAddType={(type) => {
        void adding.addType(openArticle, type);
      }}
    />
  );

  return { pick, sheet };
}
