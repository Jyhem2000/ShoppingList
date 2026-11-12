import { useState } from "react";
import type { Article } from "@/domain/model";
import { useAddToList } from "@/features/list/useAddToList";
import type { ListData } from "@/features/list/useListData";
import { QuantitySheet } from "./QuantitySheet";

/**
 * Choisir un article du catalogue (docs/03 A5) : absent de la liste, il est ajouté avec
 * sa quantité par défaut ; déjà présent, le réglage − / + / ✕ s'ouvre au lieu d'ajouter.
 * `sheet` : le panneau de réglage, à afficher par l'appelant.
 */
export function useCatalogPick(data: ListData) {
  const adding = useAddToList(data);
  const [open, setOpen] = useState<string | null>(null);
  const openItem = open
    ? data.items.find((item) => item.id === open)
    : undefined;

  const pick = (article: Article): "added" | "opened" => {
    const item = data.items.find((i) => i.articleId === article.id);
    if (item) {
      setOpen(item.id);
      return "opened";
    }
    void adding.pick(article);
    return "added";
  };

  const sheet = openItem && (
    <QuantitySheet
      key={openItem.id}
      item={openItem}
      data={data}
      onClose={() => {
        setOpen(null);
      }}
    />
  );

  return { pick, sheet };
}
