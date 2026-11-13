import { useState } from "react";
import type { Aisle, Article } from "@/domain/model";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { Sheet } from "@/ui/Sheet";

const t = fr.shopping;

/**
 * Article ajouté pendant les courses (docs/03 C4) : à prendre (dans son rayon, ou dans
 * « À récupérer » si son rayon est passé), déjà dans le caddie, ou rangé dans un autre
 * rayon pour les prochaines fois.
 *
 * « Je l'ai déjà dans le caddie » : s'il n'est pas rangé dans le rayon où l'on est (celui
 * de la dernière coche), l'app demande où il a été pris — ici (retenu pour ce magasin),
 * dans son rayon, ou ailleurs — pour que l'achat compte dans le bon rayon.
 */
export function AddedInStoreSheet({
  article,
  aisle,
  here,
  passed,
  onTakenIn,
  onOtherAisle,
  onClose,
}: {
  article: Article;
  /** Rayon actuel de l'article. */
  aisle: Aisle | undefined;
  /** Rayon où l'on est (dernière coche), s'il y en a un. */
  here: Aisle | undefined;
  passed: boolean;
  /** Coché dans ce rayon ; `remember` : l'article y sera rangé dans ce magasin. */
  onTakenIn: (aisle: Aisle | undefined, remember: boolean) => void;
  /** Choisir un autre rayon ; `taken` : il est déjà dans le caddie. */
  onOtherAisle: (taken: boolean) => void;
  onClose: () => void;
}) {
  const [asking, setAsking] = useState(false);

  return (
    <Sheet
      open
      autoFocus={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onBack={
        asking
          ? () => {
              setAsking(false);
            }
          : undefined
      }
      title={asking ? t.where.title(article.name) : t.added.title(article.name)}
      description={
        asking
          ? t.where.text
          : aisle
            ? passed
              ? t.aislePassed(aisle.name)
              : t.added.inAisle(aisle.name)
            : undefined
      }
    >
      {asking && here ? (
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => {
              onTakenIn(here, true);
            }}
          >
            {t.where.here(here.name)}
          </Button>
          <p className="-mt-1 text-center text-sm text-muted-foreground">
            {t.where.hereHint}
          </p>
          {aisle && (
            <Button
              variant="outline"
              onClick={() => {
                onTakenIn(aisle, false);
              }}
            >
              {t.where.usual(aisle.name)}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              onOtherAisle(true);
            }}
          >
            {t.where.other}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Button onClick={onClose}>{t.added.ok}</Button>
          <Button
            variant="outline"
            onClick={() => {
              // Pas encore de rayon en cours, ou déjà le bon : coché dans son rayon.
              if (here && here.id !== aisle?.id) setAsking(true);
              else onTakenIn(aisle, false);
            }}
          >
            {t.added.alreadyTaken}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onOtherAisle(false);
            }}
          >
            {t.added.otherAisle}
          </Button>
        </div>
      )}
    </Sheet>
  );
}
