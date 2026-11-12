import type { Aisle, Article } from "@/domain/model";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { Sheet } from "@/ui/Sheet";

const t = fr.shopping;

/**
 * Article ajouté pendant les courses (docs/03 C4) : à prendre (dans son rayon, ou dans
 * « À récupérer » si son rayon est passé), déjà dans le caddie (pris en passant), ou
 * rangé dans un autre rayon pour les prochaines fois.
 */
export function AddedInStoreSheet({
  article,
  aisle,
  passed,
  onTaken,
  onOtherAisle,
  onClose,
}: {
  article: Article;
  aisle: Aisle | undefined;
  passed: boolean;
  onTaken: () => void;
  onOtherAisle: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet
      open
      autoFocus={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t.added.title(article.name)}
      description={
        aisle
          ? passed
            ? t.aislePassed(aisle.name)
            : t.added.inAisle(aisle.name)
          : undefined
      }
    >
      <div className="flex flex-col gap-3">
        <Button onClick={onClose}>{t.added.ok}</Button>
        <Button variant="outline" onClick={onTaken}>
          {t.added.alreadyTaken}
        </Button>
        <Button variant="outline" onClick={onOtherAisle}>
          {t.added.otherAisle}
        </Button>
      </div>
    </Sheet>
  );
}
