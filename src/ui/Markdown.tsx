import { lazy, type ReactNode, Suspense } from "react";
import { type Inline, parseMarkdown } from "@/domain/markdown";
import { control } from "./form";
import type { MarkdownFieldProps } from "./MarkdownEditor";
import { markdownClass } from "./markdownStyles";
import { cn } from "./utils";

function InlineText({ parts }: { parts: Inline[] }) {
  return parts.map((part, index) =>
    part.bold ? (
      <strong key={index} className={markdownClass.bold}>
        {part.text}
      </strong>
    ) : (
      <span key={index}>{part.text}</span>
    ),
  );
}

/** Texte mis en forme (src/domain/markdown.ts) : titres, listes, gras, paragraphes. */
export function MarkdownText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div className={cn(markdownClass.root, className)}>
      {parseMarkdown(text).map((block, index): ReactNode => {
        switch (block.kind) {
          case "heading":
            return (
              <h3 key={index} className={markdownClass.heading}>
                <InlineText parts={block.content} />
              </h3>
            );
          case "bullets":
            return (
              <ul key={index} className={markdownClass.bullets}>
                {block.items.map((item, i) => (
                  <li key={i}>
                    <InlineText parts={item} />
                  </li>
                ))}
              </ul>
            );
          case "numbers":
            return (
              <ol
                key={index}
                start={block.start}
                className={markdownClass.numbers}
              >
                {block.items.map((item, i) => (
                  <li key={i}>
                    <InlineText parts={item} />
                  </li>
                ))}
              </ol>
            );
          case "paragraph":
            return (
              <p key={index}>
                {block.lines.map((line, i) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    <InlineText parts={line} />
                  </span>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}

// L'éditeur (TipTap) n'est chargé qu'à la modification d'une recette.
const MarkdownEditor = lazy(() =>
  import("./MarkdownEditor").then((module) => ({
    default: module.MarkdownEditor,
  })),
);

/**
 * Champ des étapes : barre de mise en forme (gras, titre, puces, numéros) et texte
 * mis en forme pendant qu'on l'écrit, enregistré en Markdown.
 */
export function MarkdownField(props: MarkdownFieldProps) {
  return (
    <Suspense
      fallback={
        <div className={cn(control, "mt-12 h-auto", props.className)} />
      }
    >
      <MarkdownEditor {...props} />
    </Suspense>
  );
}
