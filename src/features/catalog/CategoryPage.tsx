import { useMemo } from "react";
import { useParams } from "react-router";
import { routes } from "@/app/routes";
import { fr } from "@/i18n/fr";
import { PageHeader } from "@/ui/Page";
import { useListData } from "@/features/list/useListData";
import { ArticleGrid } from "./ArticleGrid";

const collator = new Intl.Collator("fr");

/**
 * Articles d'une catégorie du catalogue (docs/03 A5) : les articles génériques
 * (« Fruits au choix ») en tête, à part, puis les autres par ordre alphabétique.
 */
export function CategoryPage() {
  const { categoryId } = useParams();
  const data = useListData();
  const category = categoryId ? data?.categoryById.get(categoryId) : undefined;
  const { generic, others } = useMemo(() => {
    const articles =
      data?.articles
        .filter((a) => a.categoryId === categoryId)
        .sort((a, b) => collator.compare(a.name, b.name)) ?? [];
    return {
      generic: articles.filter((a) => a.generic),
      others: articles.filter((a) => !a.generic),
    };
  }, [data, categoryId]);

  return (
    <>
      <PageHeader
        title={category?.name ?? fr.catalog.title}
        backTo={routes.catalog}
      />
      {data && generic.length > 0 && (
        <>
          <ArticleGrid articles={generic} data={data} />
          <div aria-hidden className="mx-5 my-4 border-t border-border" />
        </>
      )}
      {data && <ArticleGrid articles={others} data={data} />}
    </>
  );
}
