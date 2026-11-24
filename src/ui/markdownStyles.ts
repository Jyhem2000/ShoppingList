/**
 * Mise en forme des étapes, la même à la lecture (`MarkdownText`) et dans l'éditeur
 * (`MarkdownEditor`) : ce qu'on écrit est ce qu'on lira.
 */
export const markdownClass = {
  root: "flex flex-col gap-2",
  heading: "pt-1 text-xl font-bold tracking-tight text-primary",
  bullets: "flex list-disc flex-col gap-1 pl-5 marker:text-primary",
  numbers:
    "flex list-decimal flex-col gap-1 pl-6 marker:font-bold marker:text-primary",
  bold: "font-bold",
};
