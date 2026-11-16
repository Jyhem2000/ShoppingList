/**
 * Étapes d'une recette mises en forme (docs/03 E1) : un petit sous-ensemble de Markdown,
 * gardé tel quel dans `Recipe.steps`. Titres (`## `), listes à puces (`- `), listes
 * numérotées (`1. `), gras (`**…**`) ; tout le reste est du texte simple, si bien que les
 * étapes écrites avant restent lisibles telles quelles.
 */

/** Morceau de texte, en gras ou non. */
export interface Inline {
  text: string;
  bold: boolean;
}

export type MarkdownBlock =
  | { kind: "heading"; content: Inline[] }
  | { kind: "bullets"; items: Inline[][] }
  | { kind: "numbers"; start: number; items: Inline[][] }
  | { kind: "paragraph"; lines: Inline[][] };

const HEADING = /^\s*#{1,6}\s+(.*)$/;
const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBER = /^\s*(\d+)[.)]\s+(.*)$/;

/** Le gras entre `**` ; un `**` sans son pendant reste écrit tel quel. */
export function parseInline(text: string): Inline[] {
  let parts = text.split("**");
  if (parts.length % 2 === 0) {
    const last = parts.pop() ?? "";
    const before = parts.pop() ?? "";
    parts = [...parts, `${before}**${last}`];
  }
  return parts
    .map((part, index) => ({ text: part, bold: index % 2 === 1 }))
    .filter((part) => part.text !== "");
}

/** Découpe le texte en blocs : titres, listes et paragraphes (une ligne vide les sépare). */
export function parseMarkdown(text: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  for (const line of text.split(/\r?\n/)) {
    const last = blocks.at(-1);
    if (!line.trim()) {
      // Une ligne vide clôt le bloc en cours.
      if (last && last.kind !== "heading")
        blocks.push({ kind: "paragraph", lines: [] });
      continue;
    }
    const heading = HEADING.exec(line);
    const bullet = BULLET.exec(line);
    const number = NUMBER.exec(line);
    if (heading) {
      blocks.push({ kind: "heading", content: parseInline(heading[1] ?? "") });
    } else if (bullet) {
      const item = parseInline(bullet[1] ?? "");
      if (last?.kind === "bullets") last.items.push(item);
      else blocks.push({ kind: "bullets", items: [item] });
    } else if (number) {
      const item = parseInline(number[2] ?? "");
      if (last?.kind === "numbers") last.items.push(item);
      else
        blocks.push({
          kind: "numbers",
          start: Number(number[1]),
          items: [item],
        });
    } else if (last?.kind === "paragraph") {
      last.lines.push(parseInline(line.trim()));
    } else {
      blocks.push({ kind: "paragraph", lines: [parseInline(line.trim())] });
    }
  }
  return blocks.filter(
    (block) => block.kind !== "paragraph" || block.lines.length,
  );
}

/**
 * Nœud du document de l'éditeur (format JSON de ProseMirror, celui de TipTap) : les
 * étapes s'éditent mises en forme et restent enregistrées en Markdown.
 */
export interface DocNode {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  text?: string;
  marks?: { type: string }[];
}

const textNodes = (parts: Inline[]): DocNode[] =>
  parts.map((part) =>
    part.bold
      ? { type: "text", text: part.text, marks: [{ type: "bold" }] }
      : { type: "text", text: part.text },
  );

const paragraphNode = (parts: Inline[]): DocNode =>
  parts.length
    ? { type: "paragraph", content: textNodes(parts) }
    : { type: "paragraph" };

const itemNodes = (items: Inline[][]): DocNode[] =>
  items.map((item) => ({ type: "listItem", content: [paragraphNode(item)] }));

/** Markdown enregistré → document de l'éditeur. */
export function markdownToDoc(text: string): DocNode {
  const content = parseMarkdown(text).map((block): DocNode => {
    switch (block.kind) {
      case "heading": {
        const node: DocNode = { type: "heading", attrs: { level: 3 } };
        return block.content.length
          ? { ...node, content: textNodes(block.content) }
          : node;
      }
      case "bullets":
        return { type: "bulletList", content: itemNodes(block.items) };
      case "numbers":
        return {
          type: "orderedList",
          attrs: { start: block.start },
          content: itemNodes(block.items),
        };
      case "paragraph": {
        const lines = block.lines.flatMap((line, index) => [
          ...(index > 0 ? [{ type: "hardBreak" }] : []),
          ...textNodes(line),
        ]);
        return lines.length
          ? { type: "paragraph", content: lines }
          : { type: "paragraph" };
      }
    }
  });
  return {
    type: "doc",
    content: content.length ? content : [paragraphNode([])],
  };
}

/** Texte d'un bloc, gras entre `**` ; un retour à la ligne devient `lineBreak`. */
function inlineMarkdown(node: DocNode, lineBreak: string): string {
  return (node.content ?? [])
    .map((child) => {
      if (child.type === "hardBreak") return lineBreak;
      const text = child.text ?? "";
      return child.marks?.some((mark) => mark.type === "bold") && text.trim()
        ? `**${text}**`
        : text;
    })
    .join("");
}

/** Éléments d'une liste, à plat : le format n'a pas de liste dans une liste. */
function listItems(list: DocNode): string[] {
  return (list.content ?? []).flatMap((item) => {
    const own = (item.content ?? [])
      .filter((child) => !isList(child))
      .map((child) => inlineMarkdown(child, " ").trim())
      .filter(Boolean)
      .join(" ");
    const nested = (item.content ?? []).filter(isList).flatMap(listItems);
    return own ? [own, ...nested] : nested;
  });
}

const isList = (node: DocNode) =>
  node.type === "bulletList" || node.type === "orderedList";

/** Document de l'éditeur → Markdown enregistré (blocs séparés par une ligne vide). */
export function docToMarkdown(doc: DocNode): string {
  return (doc.content ?? [])
    .map((block) => {
      switch (block.type) {
        case "heading": {
          const text = inlineMarkdown(block, " ").trim();
          return text && `## ${text}`;
        }
        case "bulletList":
          return listItems(block)
            .map((item) => `- ${item}`)
            .join("\n");
        case "orderedList": {
          const start = Number(block.attrs?.start ?? 1) || 1;
          return listItems(block)
            .map((item, index) => `${start + index}. ${item}`)
            .join("\n");
        }
        default:
          return inlineMarkdown(block, "\n")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .join("\n");
      }
    })
    .filter(Boolean)
    .join("\n\n");
}
