import type { LucideProps } from "lucide-react";
import { createElement } from "react";
import { groupIcon } from "@/icons/lucide";

/** Icône Lucide d'une catégorie ou d'un rayon, d'après son nom (docs/05 § 4). */
export function GroupIcon({ name, ...props }: { name?: string } & LucideProps) {
  return createElement(groupIcon(name), { "aria-hidden": true, ...props });
}
