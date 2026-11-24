import { cva } from "class-variance-authority";

/**
 * Bouton shadcn/ui adapté au mobile (cibles ≥ 44 px), docs/05 § 5.5. Deux styles :
 * principal (violet plein) et secondaire (`outline`, contour violet, aussi pour une
 * icône seule dans un formulaire : + et −). `gold` : « Terminer les courses ».
 * `destructive` est le style principal en rouge ; `icon` un bouton fait d'une icône
 * seule (en violet : ⋯, retour, ▶), `iconMuted` (fermer, retirer) et `iconDanger`
 * (supprimer une ligne) ses variantes ; `link` un lien.
 * Une icône dans un bouton avec texte prend la couleur du texte.
 * Appui bien visible : le bouton rétrécit et fonce pendant le toucher. Désactivé : gris
 * (`--disabled`, texte secondaire), pas la couleur pâlie.
 */
export const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold outline-none transition-[transform,background-color,filter] duration-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95 active:brightness-90 disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-5 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-on-primary hover:bg-primary-strong active:bg-primary-strong disabled:bg-disabled disabled:text-muted-foreground",
        outline:
          "border border-primary/50 bg-transparent text-primary hover:bg-primary/10 active:bg-primary/20 disabled:border-border disabled:text-muted-foreground",
        destructive:
          "bg-danger text-bg hover:bg-danger/90 active:bg-danger/80 disabled:bg-disabled disabled:text-muted-foreground",
        // Action destructrice qui ouvre sa confirmation (Supprimer, Retirer) : rouge en contour.
        dangerOutline:
          "border border-danger/50 bg-transparent text-danger hover:bg-danger/10 active:bg-danger/20 disabled:border-border disabled:text-muted-foreground",
        // « Terminer les courses » (docs/04 § 2.3) : le seul bouton plein en or.
        gold: "bg-gold text-on-gold hover:bg-gold-strong active:bg-gold-strong disabled:bg-disabled disabled:text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline disabled:text-muted-foreground",
        icon: "text-primary hover:bg-primary/10 active:bg-primary/20 disabled:text-muted-foreground",
        iconMuted:
          "text-muted-foreground hover:bg-raised active:bg-raised disabled:opacity-50",
        iconDanger:
          "text-danger hover:bg-danger/10 active:bg-danger/20 disabled:text-muted-foreground",
      },
      size: {
        default: "h-11 px-5 text-base",
        sm: "h-9 px-3 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
