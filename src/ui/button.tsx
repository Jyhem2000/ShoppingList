import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "@/ui/utils";

/**
 * Bouton shadcn/ui adapté au mobile (cibles ≥ 44 px), docs/05 § 5.5. Deux styles :
 * principal (violet plein) et secondaire (`outline`, contour violet). `gold` : « Terminer
 * les courses ». `destructive` est
 * le style principal en rouge ; `icon` un bouton fait d'une icône seule (en or) ;
 * `link` un lien.
 * Une icône dans un bouton avec texte prend la couleur du texte.
 * Appui bien visible : le bouton rétrécit et fonce pendant le toucher.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold outline-none transition-[transform,background-color,filter] duration-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95 active:brightness-90 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-5 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-on-primary hover:bg-primary-strong active:bg-primary-strong",
        outline:
          "border border-primary/50 bg-transparent text-primary hover:bg-primary/10 active:bg-primary/20",
        destructive: "bg-danger text-bg hover:bg-danger/90 active:bg-danger/80",
        // « Terminer les courses » (docs/04 § 2.3) : le seul bouton plein en or.
        gold: "bg-secondary-fill text-on-secondary hover:bg-secondary-fill-strong active:bg-secondary-fill-strong",
        link: "text-primary underline-offset-4 hover:underline",
        icon: "text-secondary hover:bg-secondary/10 active:bg-secondary/20",
        // Bouton fait d'une icône seule, dans un formulaire (+ et −, ajout d'un type) : or (docs/05 § 2).
        iconOutline:
          "border border-secondary/50 bg-transparent text-secondary hover:bg-secondary/10 active:bg-secondary/20",
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

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button };
