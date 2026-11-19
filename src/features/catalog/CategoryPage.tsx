import { useMemo } from "react";
import { useParams } from "react-router";
import { routes } from "@/app/routes";
import { fr } from "@/i18n/fr";
import { GroupIcon } from "@/ui/GroupIcon";
import { EmptyState, PageHeader } from "@/ui/Page";
import { useListData } from "@/common/useListData";
import { ArticleGrid } from "./ArticleGrid";
import { byName } from "@/domain/slug";

/**
 * Articles d'une catégorie du catalogue (docs/03 A5) : les articles génériques
 * (« Fruits au choix ») en tête, à part, puis les autres par ordre alphabétique.
 */
export function CategoryPage() {
  const { categoryId } = useParams();
  const data = useListData();
  const category = categoryId ? data?.categoryById.get(categoryId) : undefined;
  const t = fr.catalog;
  const { generic, others } = useMemo(() => {
    const articles =
      data?.articles.filter((a) => a.categoryId === categoryId).sort(byName) ??
      [];
    return {
      generic: articles.filter((a) => a.generic),
      others: articles.filter((a) => !a.generic),
    };
  }, [data, categoryId]);

  return (
    <>
      <PageHeader title={category?.name ?? t.title} backTo={routes.catalog} />
      {data && generic.length === 0 && others.length === 0 && (
        <EmptyState
          icon={<GroupIcon name={category?.icon} />}
          title={t.emptyCategory}
        >
          {t.emptyCategoryText}
        </EmptyState>
      )}
      {data && generic.length > 0 && (
        <ArticleGrid articles={generic} data={data} />
      )}
      {generic.length > 0 && others.length > 0 && (
        <div aria-hidden className="mx-5 my-4 border-t border-border" />
      )}
      {data && others.length > 0 && (
        <ArticleGrid articles={others} data={data} />
      )}
    </>
  );
}
