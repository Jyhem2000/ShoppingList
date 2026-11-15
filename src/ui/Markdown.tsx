import { Bold, Heading, List, ListOrdered } from "lucide-react";
import { type ComponentProps, type ReactNode, useRef } from "react";
import {
  continueList,
  type Inline,
  type LineStyle,
  parseMarkdown,
  type TextEdit,
  toggleBold,
  toggleLineStyle,
} from "@/domain/markdown";
import { fr } from "@/i18n/fr";
import { TextArea } from "./form";
import { cn } from "./utils";

const t = fr.markdown;

function InlineText({ parts }: { parts: Inline[] }) {
  return parts.map((part, index) =>
    part.bold ? (
      <strong key={index} className="font-bold">
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
    <div className={cn("flex flex-col gap-2", className)}>
      {parseMarkdown(text).map((block, index): ReactNode => {
        switch (block.kind) {
          case "heading":
            return (
              <h3
                key={index}
                className="pt-1 text-lg font-bold tracking-tight text-text"
              >
                <InlineText parts={block.content} />
              </h3>
            );
          case "bullets":
            return (
              <ul
                key={index}
                className="flex list-disc flex-col gap-1 pl-5 marker:text-secondary"
              >
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
                className="flex list-decimal flex-col gap-1 pl-6 marker:font-bold marker:text-secondary"
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

const lineStyle = (style: LineStyle) => (current: TextEdit) =>
  toggleLineStyle(current, style);

/** Boutons de la barre, dans l'ordre. */
const tools: {
  label: string;
  icon: ReactNode;
  edit: (current: TextEdit) => TextEdit;
}[] = [
  { label: t.bold, icon: <Bold />, edit: toggleBold },
  { label: t.heading, icon: <Heading />, edit: lineStyle("heading") },
  { label: t.bullets, icon: <List />, edit: lineStyle("bullet") },
  { label: t.numbers, icon: <ListOrdered />, edit: lineStyle("number") },
];

/**
 * Champ de texte avec une barre de mise en forme (gras, titre, puces, numéros), qui
 * écrit le Markdown à la place de l'utilisateur ; un retour à la ligne dans une liste
 * ajoute la puce ou le numéro suivant.
 */
export function MarkdownField({
  value,
  onValueChange,
  className,
  ...props
}: Omit<ComponentProps<"textarea">, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const apply = (edit: (current: TextEdit) => TextEdit | null) => {
    const field = ref.current;
    if (!field) return false;
    const next = edit({
      text: value,
      start: field.selectionStart,
      end: field.selectionEnd,
    });
    if (!next) return false;
    onValueChange(next.text);
    // Le texte change au prochain rendu : la sélection se replace ensuite.
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(next.start, next.end);
    });
    return true;
  };

  return (
    <div className="flex flex-col gap-1">
      <div role="toolbar" aria-label={t.toolbar} className="flex gap-1">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            aria-label={tool.label}
            title={tool.label}
            // Garde le curseur dans le champ (sur ordinateur, le clic le ferait sortir).
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => {
              apply(tool.edit);
            }}
            className="flex size-11 items-center justify-center rounded-xl text-text active:bg-raised [&_svg]:size-5"
          >
            {tool.icon}
          </button>
        ))}
      </div>
      <TextArea
        {...props}
        ref={ref}
        value={value}
        className={className}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing &&
            apply(continueList)
          )
            event.preventDefault();
        }}
      />
    </div>
  );
}
