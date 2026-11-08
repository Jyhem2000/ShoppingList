import { ShoppingCart } from "lucide-react";
import { fr } from "@/i18n/fr";
import { EmptyState, PageHeader } from "@/ui/Page";

/** Écran Liste (accueil). Contenu réel en phase 4. */
export function ListPage() {
  return (
    <>
      <PageHeader title={fr.list.title} />
      <EmptyState
        icon={<ShoppingCart className="size-10" />}
        title={fr.list.emptyTitle}
      >
        {fr.list.emptyText}
      </EmptyState>
    </>
  );
}
