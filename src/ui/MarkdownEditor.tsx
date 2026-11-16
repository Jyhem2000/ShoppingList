import Bold from "@tiptap/extension-bold";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import { BulletList, ListItem, OrderedList } from "@tiptap/extension-list";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { Placeholder, UndoRedo } from "@tiptap/extensions";
import {
  type Editor,
  EditorContent,
  useEditor,
  useEditorState,
} from "@tiptap/react";
import {
  Bold as BoldIcon,
  Heading as HeadingIcon,
  List,
  ListOrdered,
} from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { docToMarkdown, markdownToDoc } from "@/domain/markdown";
import { fr } from "@/i18n/fr";
import { control } from "./form";
import { markdownClass } from "./markdownStyles";
import { cn } from "./utils";

const t = fr.markdown;

export interface MarkdownFieldProps {
  /** Markdown de départ ; l'éditeur garde ensuite son propre état. */
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  "aria-label": string;
  className?: string;
}

/** Boutons de la barre, dans l'ordre : action et état (actif ou non). */
const tools: {
  label: string;
  icon: ReactNode;
  name: string;
  run: (editor: Editor) => void;
}[] = [
  {
    label: t.bold,
    icon: <BoldIcon />,
    name: "bold",
    run: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    label: t.heading,
    icon: <HeadingIcon />,
    name: "heading",
    run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: t.bullets,
    icon: <List />,
    name: "bulletList",
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    label: t.numbers,
    icon: <ListOrdered />,
    name: "orderedList",
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
];

/**
 * Éditeur des étapes (TipTap) : on voit le texte mis en forme pendant qu'on l'écrit
 * (gras, titres, puces, numéros), enregistré en Markdown (src/domain/markdown.ts).
 * Seules ces mises en forme existent : un texte collé perd les autres.
 */
export function MarkdownEditor({
  value,
  onValueChange,
  onBlur,
  placeholder,
  "aria-label": label,
  className,
}: MarkdownFieldProps) {
  // Les fonctions changent à chaque rendu : l'éditeur, créé une fois, lit les dernières.
  const callbacks = useRef({ onValueChange, onBlur });
  useEffect(() => {
    callbacks.current = { onValueChange, onBlur };
  });

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold.configure({ HTMLAttributes: { class: markdownClass.bold } }),
      Heading.configure({
        levels: [3],
        HTMLAttributes: { class: markdownClass.heading },
      }),
      BulletList.configure({
        HTMLAttributes: { class: markdownClass.bullets },
      }),
      OrderedList.configure({
        HTMLAttributes: { class: markdownClass.numbers },
      }),
      ListItem,
      HardBreak,
      UndoRedo,
      Placeholder.configure({ placeholder }),
    ],
    content: markdownToDoc(value),
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        class: cn(control, "h-auto py-2", markdownClass.root, className),
      },
    },
    onUpdate: ({ editor: current }) => {
      callbacks.current.onValueChange(docToMarkdown(current.getJSON()));
    },
    onBlur: () => {
      callbacks.current.onBlur?.();
    },
  });

  const active = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      tools.map((tool) => current.isActive(tool.name)),
  });

  return (
    <div className="flex flex-col gap-1">
      <div role="toolbar" aria-label={t.toolbar} className="flex gap-1">
        {tools.map((tool, index) => (
          <button
            key={tool.label}
            type="button"
            aria-label={tool.label}
            aria-pressed={active[index] ?? false}
            title={tool.label}
            // Garde le curseur dans le champ (sur ordinateur, le clic le ferait sortir).
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => {
              tool.run(editor);
            }}
            className="flex size-11 items-center justify-center rounded-xl text-text active:bg-raised aria-pressed:bg-raised aria-pressed:text-primary [&_svg]:size-5"
          >
            {tool.icon}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
