import { LayoutGrid } from "lucide-react";
import { fr } from "@/i18n/fr";
import { EmptyState, PageHeader } from "@/ui/Page";

/** Écran Catalogue. Contenu réel en phase 4. */
export function CatalogPage() {
  return (
    <>
      <PageHeader title={fr.catalog.title} />
      <EmptyState
        icon={<LayoutGrid className="size-10" />}
        title={fr.catalog.emptyTitle}
      >
        {fr.catalog.emptyText}
      </EmptyState>
    </>
  );
}
