import type { PaletteColor } from "@/ui/palette";

/**
 * Fausses données de la maquette : la liste (par catégorie) et un rayon du mode courses,
 * tels que l'app les affiche.
 */
export interface MockItem {
  label: string;
  icon?: string;
  details?: string;
  quantity: string;
  checked?: boolean;
}

export interface MockAisle {
  label: string;
  icon?: string;
  color: PaletteColor;
  items: MockItem[];
}

/** La liste, rangée par catégorie (indépendante du magasin). */
export const mockAisles: MockAisle[] = [
  {
    label: "Fruits",
    icon: "apple",
    color: "ambre",
    items: [
      {
        label: "Pommes",
        icon: "pommes",
        details: "Gala ou Golden",
        quantity: "1 kg",
      },
      { label: "Bananes", icon: "bananes", quantity: "× 6" },
    ],
  },
  {
    label: "Légumes",
    icon: "carrot",
    color: "sauge",
    items: [{ label: "Carottes", icon: "carottes", quantity: "1 kg" }],
  },
  {
    label: "Pain & Viennoiseries",
    icon: "croissant",
    color: "ble",
    items: [
      { label: "Baguette", icon: "baguette", quantity: "× 2" },
      {
        label: "Croissants",
        icon: "croissants",
        details: "pur beurre",
        quantity: "× 4",
      },
    ],
  },
  {
    label: "Autres",
    icon: "shopping-basket",
    color: "gris",
    items: [{ label: "Sauce nuoc-mâm", quantity: "× 1" }],
  },
];

/** Rayon en mode courses : lignes cochées en bas. */
export const mockShoppingAisle: MockAisle = {
  // Rayon sans nom : œufs, lait, yaourts, tous de la famille « Frais » (docs/02 § 4).
  label: "Frais",
  icon: "milk",
  color: "creme",
  items: [
    { label: "Œufs", icon: "oeufs", quantity: "× 6" },
    { label: "Beurre", icon: "beurre", details: "doux", quantity: "250 g" },
    {
      label: "Lait",
      icon: "lait",
      quantity: "6 L",
      checked: true,
    },
    { label: "Comté", icon: "comte", quantity: "200 g", checked: true },
  ],
};

export const mockCatalog: {
  label: string;
  icon?: string;
  color: PaletteColor;
  quantity?: string;
}[] = [
  { label: "Pommes", icon: "pommes", color: "sauge", quantity: "1 kg" },
  { label: "Tomates", icon: "tomates", color: "sauge" },
  { label: "Avocats", icon: "avocats", color: "sauge" },
  {
    label: "Pommes de terre",
    icon: "pommes-de-terre",
    color: "sauge",
    quantity: "2 kg",
  },
  { label: "Oignons", icon: "oignons", color: "sauge" },
  { label: "Citrons", icon: "citrons", color: "sauge" },
  { label: "Fraises", icon: "fraises", color: "sauge" },
  { label: "Ail", icon: "ail", color: "sauge" },
  { label: "Sauce nuoc-mâm", color: "terre" },
];

export const mockColors: { token: string; label: string; className: string }[] =
  [
    { token: "--bg", label: "Fond 1 · app", className: "bg-bg" },
    { token: "--surface", label: "Fond 2 · cartes", className: "bg-surface" },
    { token: "--raised", label: "Fond 3 · surélevé", className: "bg-raised" },
    {
      token: "--primary",
      label: "Principale · violet",
      className: "bg-primary",
    },
    {
      token: "--secondary-fill",
      label: "Secondaire · or",
      className: "bg-secondary-fill",
    },
    { token: "--success", label: "Succès", className: "bg-success" },
    { token: "--warning", label: "Attention", className: "bg-warning" },
    { token: "--danger", label: "Danger", className: "bg-danger" },
  ];
