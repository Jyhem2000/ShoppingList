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

/** Texte et sélection d'un champ, avant ou après une mise en forme. */
export interface TextEdit {
  text: string;
  start: number;
  end: number;
}

/** Met en gras la sélection, ou l'enlève ; sans sélection, prépare `****` et place le curseur au milieu. */
export function toggleBold({ text, start, end }: TextEdit): TextEdit {
  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const after = text.slice(end);
  if (before.endsWith("**") && after.startsWith("**"))
    return {
      text: before.slice(0, -2) + selected + after.slice(2),
      start: start - 2,
      end: end - 2,
    };
  return {
    text: `${before}**${selected}**${after}`,
    start: start + 2,
    end: end + 2,
  };
}

export type LineStyle = "heading" | "bullet" | "number";

const PREFIX = /^\s*(#{1,6}\s+|[-*•]\s+|\d+[.)]\s+)/;
const STYLE: Record<LineStyle, RegExp> = {
  heading: HEADING,
  bullet: BULLET,
  number: NUMBER,
};
const prefix = (style: LineStyle, rank: number) =>
  style === "heading" ? "## " : style === "bullet" ? "- " : `${rank}. `;

/**
 * Applique un style aux lignes de la sélection (titre, puce, numéro), ou l'enlève si
 * toutes l'ont déjà ; un autre style déjà présent est remplacé.
 */
export function toggleLineStyle(
  { text, start, end }: TextEdit,
  style: LineStyle,
): TextEdit {
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const found = text.indexOf("\n", end);
  const lineEnd = found === -1 ? text.length : found;
  const lines = text.slice(lineStart, lineEnd).split("\n");
  const filled = lines.filter((line) => line.trim());
  const remove =
    filled.length > 0 && filled.every((line) => STYLE[style].test(line));
  let rank = 0;
  const next = lines.map((line) => {
    const bare = line.replace(PREFIX, "");
    if (remove) return bare;
    if (!line.trim() && lines.length > 1) return line;
    rank += 1;
    return prefix(style, rank) + bare;
  });
  const block = next.join("\n");
  const cursor = lineStart + block.length;
  return {
    text: text.slice(0, lineStart) + block + text.slice(lineEnd),
    start: start === end ? cursor : lineStart,
    end: cursor,
  };
}

/**
 * Retour à la ligne dans une liste : la ligne suivante reçoit la même puce (ou le numéro
 * suivant) ; sur un élément vide, la puce s'en va et la liste s'arrête. `null` hors liste.
 */
export function continueList({ text, start, end }: TextEdit): TextEdit | null {
  if (start !== end) return null;
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const line = text.slice(lineStart, start);
  const bullet = /^(\s*[-*•]\s+)(.*)$/.exec(line);
  const number = /^(\s*)(\d+)([.)]\s+)(.*)$/.exec(line);
  if (!bullet && !number) return null;
  const content = bullet ? bullet[2] : number?.[4];
  if (!content?.trim()) {
    const cleared = text.slice(0, lineStart) + text.slice(start);
    return { text: cleared, start: lineStart, end: lineStart };
  }
  const nextPrefix = bullet
    ? (bullet[1] ?? "- ")
    : `${number?.[1] ?? ""}${Number(number?.[2]) + 1}${number?.[3] ?? ". "}`;
  const insert = `\n${nextPrefix}`;
  const cursor = start + insert.length;
  return {
    text: text.slice(0, start) + insert + text.slice(start),
    start: cursor,
    end: cursor,
  };
}
