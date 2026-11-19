import { describe, expect, it } from "vitest";
import type { Aisle, Article, ListItem } from "@/domain/model";
import {
  buildShoppingView,
  checkAction,
  currentAisle,
  isStale,
  learnAislePositions,
  learnArticleOrder,
  passedAisles,
  pickUpItems,
  STALE_AFTER_MS,
  canReopen,
} from "@/domain/shopping";

const aisles = [
  { id: "fruits", position: 0, isUnsorted: false },
  { id: "pain", position: 0.25, isUnsorted: false },
  { id: "epicerie", position: 0.5, isUnsorted: false },
  { id: "cremerie", position: 0.75, isUnsorted: false },
  { id: "non-classe", position: 1, isUnsorted: true },
];

/** Achats cochés dans cet ordre, une minute d'écart (l'heure n'importe pas). */
function trip(aisleIds: string[], start = 0, gap = 60_000) {
  return aisleIds.map((aisleId, index) => ({
    id: `p${index}`,
    aisleId,
    articleId: `a-${aisleId}-${index}`,
    at: start + index * gap,
  }));
}

function order(positions: Record<string, number>) {
  return [...aisles]
    .map((a) => ({ id: a.id, position: positions[a.id] ?? a.position }))
    .sort((a, b) => a.position - b.position)
    .map((a) => a.id);
}

describe("apprentissage de l'ordre des rayons (docs/03 C7)", () => {
  it("range les rayons visités dans l'ordre du parcours", () => {
    const changes = learnAislePositions(
      aisles,
      trip(["cremerie", "fruits", "epicerie"]),
    );
    expect(order(changes)).toEqual([
      "cremerie",
      "pain",
      "fruits",
      "epicerie",
      "non-classe",
    ]);
  });

  it("ne déplace ni les rayons non visités, ni « À placer »", () => {
    const changes = learnAislePositions(
      aisles,
      trip(["epicerie", "fruits", "non-classe"]),
    );
    expect(changes).toEqual({ epicerie: 0, fruits: 0.5 });
  });

  it("se fie au rang des coches, pas à leur heure (une pause ne change rien)", () => {
    const steady = trip(["cremerie", "fruits", "epicerie"]);
    const paused = steady.map((p, i) => ({
      ...p,
      at: i === 2 ? 10 * 60 * 60_000 : p.at,
    }));
    expect(learnAislePositions(aisles, paused)).toEqual(
      learnAislePositions(aisles, steady),
    );
  });

  it("résiste à un aller-retour : un oubli repris à la fin ne fait pas passer le rayon en dernier", () => {
    const changes = learnAislePositions(
      aisles,
      trip(["fruits", "fruits", "fruits", "pain", "epicerie", "fruits"]),
    );
    expect(order(changes).slice(0, 3)).toEqual(["fruits", "pain", "epicerie"]);
  });

  it("ne change rien quand le parcours suit déjà l'ordre", () => {
    expect(
      learnAislePositions(aisles, trip(["fruits", "pain", "cremerie"])),
    ).toEqual({});
  });
});

describe("apprentissage de l'ordre des articles dans un rayon (docs/03 C7)", () => {
  it("suit l'ordre des coches, rayon par rayon", () => {
    const purchases = [
      { aisleId: "fruits", articleId: "pommes", at: 1 },
      { aisleId: "pain", articleId: "baguette", at: 2 },
      { aisleId: "fruits", articleId: "bananes", at: 3 },
    ];
    const learned = learnArticleOrder({ bananes: 0, pommes: 5 }, purchases);
    expect(learned.pommes).toBeLessThan(learned.bananes ?? 0);
    expect(learned.baguette).toBeDefined();
  });

  it("place un article nouveau après les articles connus de son rayon", () => {
    const learned = learnArticleOrder({ lait: 2, beurre: 3 }, [
      { aisleId: "cremerie", articleId: "comte", at: 1 },
    ]);
    expect(learned.comte).toBeGreaterThan(3);
    expect(learned.lait).toBe(2);
  });
});

describe("pendant les courses (docs/03 C2, C4, C8)", () => {
  it("un rayon est passé quand on a coché ailleurs depuis", () => {
    expect([...passedAisles(trip(["fruits", "pain"]))]).toEqual(["fruits"]);
    expect([...passedAisles(trip(["fruits", "pain", "fruits"]))]).toEqual([
      "pain",
    ]);
  });

  it("« À récupérer » : seulement les lignes ajoutées pendant les courses, dans un rayon passé", () => {
    const items = [
      { id: "ajoutee", status: "todo" as const, createdAt: 100 },
      { id: "prevue", status: "todo" as const, createdAt: 0 },
      { id: "prise", status: "checked" as const, createdAt: 100 },
      { id: "ailleurs", status: "todo" as const, createdAt: 100 },
    ];
    const aisleOf = (item: { id: string }) =>
      item.id === "ailleurs" ? "epicerie" : "fruits";
    const result = pickUpItems(items, aisleOf, new Set(["fruits"]), {
      startedAt: 50,
    });
    expect([...result]).toEqual(["ajoutee"]);
  });

  it("le rayon en cours suit la dernière coche, puis revient au premier rayon non fini", () => {
    const groups = [
      { id: "fruits", hasTodo: true },
      { id: "pain", hasTodo: false },
      { id: "epicerie", hasTodo: true },
    ];
    expect(currentAisle(groups, undefined)).toBe("fruits");
    expect(currentAisle(groups, "pain")).toBe("epicerie");
    expect(
      currentAisle(
        [
          { id: "fruits", hasTodo: true },
          { id: "pain", hasTodo: false },
        ],
        "pain",
      ),
    ).toBe("fruits");
  });

  it("une session est oubliée après 3 heures sans coche", () => {
    expect(isStale(0, STALE_AFTER_MS - 1)).toBe(false);
    expect(isStale(0, STALE_AFTER_MS)).toBe(true);
  });
});

describe("vue des courses : rangement en cochant (docs/03 C4)", () => {
  const base = { createdAt: 0, updatedAt: 0 };
  const aisle = (id: string, position: number, categoryId?: string): Aisle => ({
    ...base,
    id,
    storeId: "magasin",
    name: id,
    color: "gris",
    position,
    categories: categoryId ? [{ categoryId, primary: true }] : [],
    isUnsorted: id === "non-classe",
  });
  const article = (id: string, categoryId: string) =>
    ({ id, categoryId, name: id }) as Article;
  const item = (id: string, createdAt: number): ListItem => ({
    ...base,
    createdAt,
    id,
    listId: "liste",
    articleId: id,
    quantity: 1,
    unitId: "piece",
    acceptedTypes: [],
    status: "todo",
    fromRecipes: [],
  });
  const data = (aisles: Aisle[], items: ListItem[]) => ({
    items,
    articleById: new Map([
      ["lait", article("lait", "cremerie")],
      ["beurre", article("beurre", "cremerie")],
      ["pommes", article("pommes", "fruits")],
    ]),
    store: { ...base, id: "magasin", name: "Magasin", orderLocked: false },
    aisles,
    overrides: [],
  });

  it("une catégorie rangée pendant les courses : ses lignes déjà là restent dans « À placer », le rayon en cours s'affiche même vide", () => {
    const beurre = item("beurre", 0);
    const lait = item("lait", 200);
    const items = [beurre, item("pommes", 0), lait];
    const view = buildShoppingView(
      data(
        [
          aisle("rayon-1", 0, "cremerie"),
          aisle("rayon-2", 0.5),
          aisle("non-classe", 1),
        ],
        items,
      ),
      {
        storeId: "magasin",
        startedAt: 0,
        openedAisle: { aisleId: "rayon-2", at: 300 },
        placedCategories: [{ categoryId: "cremerie", at: 100 }],
      },
      [],
    );
    expect(view.unplaced.map((i) => i.id).sort()).toEqual(["beurre", "pommes"]);
    expect(
      view.groups.map((g) => [g.aisle.id, g.items.map((i) => i.id)]),
    ).toEqual([
      ["rayon-1", ["lait"]],
      ["rayon-2", []],
    ]);
    expect(view.placing?.id).toBe("rayon-2");
    expect(checkAction(view, beurre)).toEqual({ kind: "place" });
    expect(checkAction(view, lait)).toEqual({
      kind: "check",
      aisleId: "rayon-1",
      lastOfAisle: true,
    });
  });

  it("un rayon n'est pas terminé tant qu'une de ses lignes attend dans « À récupérer »", () => {
    const fruits = aisle("fruits", 0, "fruits");
    const cerises = item("cerises", 0);
    const pommes = item("pommes", 200);
    const view = {
      aisleOf: new Map([
        [cerises.id, fruits],
        [pommes.id, fruits],
      ]),
      unplaced: [],
      groups: [{ aisle: fruits, items: [cerises], done: false }],
      pickUp: [pommes],
    };
    expect(checkAction(view, cerises)).toEqual({
      kind: "check",
      aisleId: "fruits",
      lastOfAisle: false,
    });
  });
});

describe("rouvrir les courses (docs/03 C8)", () => {
  const closedAt = new Date(2026, 10, 13, 18, 30).getTime();
  const session = { id: "s", status: "closed" as const, closedAt };

  it("le jour même, pour la dernière course, dans un magasin qui existe encore", () => {
    const evening = new Date(2026, 10, 13, 22, 0).getTime();
    expect(canReopen(session, "s", true, evening)).toBe(true);
    expect(canReopen(session, "autre", true, evening)).toBe(false);
    expect(canReopen(session, "s", false, evening)).toBe(false);
  });

  it("plus le lendemain", () => {
    const tomorrow = new Date(2026, 10, 14, 8, 0).getTime();
    expect(canReopen(session, "s", true, tomorrow)).toBe(false);
  });
});
