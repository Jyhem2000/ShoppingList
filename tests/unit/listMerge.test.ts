import { describe, expect, it } from "vitest";
import { planListMerge } from "@/domain/listMerge";
import { unit, units } from "./fixtures";

const line = (
  articleId: string,
  quantity: number,
  unitSlug: string,
  extra: { acceptedTypes?: string[]; note?: string } = {},
) => ({
  articleId,
  quantity,
  unitId: unit(unitSlug).id,
  acceptedTypes: extra.acceptedTypes ?? [],
  note: extra.note,
});

describe("ajouter une liste dans une autre (docs/02 § 6)", () => {
  it("ajoute les articles absents, fusionne les autres", () => {
    const target = [{ id: "t1", ...line("farine", 300, "g") }];
    const plan = planListMerge(
      target,
      [line("farine", 1, "kg"), line("lait", 6, "l")],
      units,
    );
    expect(plan).toEqual([
      expect.objectContaining({
        articleId: "farine",
        existingId: "t1",
        quantity: 1.3,
        unitId: unit("kg").id,
        kind: "merged",
      }),
      expect.objectContaining({ articleId: "lait", quantity: 6, kind: "new" }),
    ]);
  });

  it("additionne un même article venant de deux listes", () => {
    const plan = planListMerge(
      [],
      [line("oeufs", 6, "piece"), line("oeufs", 6, "piece")],
      units,
    );
    expect(plan).toEqual([
      expect.objectContaining({
        articleId: "oeufs",
        quantity: 12,
        kind: "new",
      }),
    ]);
  });

  it("unités non convertibles : garde l'existant et met l'autre quantité en note", () => {
    const target = [{ id: "t1", ...line("pommes", 3, "piece") }];
    const [merged] = planListMerge(target, [line("pommes", 1, "kg")], units);
    expect(merged).toEqual(
      expect.objectContaining({ quantity: 3, note: "+ 1 kg", kind: "note" }),
    );
  });

  it("« peu importe » l'emporte sur un type précis ; les notes se cumulent", () => {
    const target = [
      {
        id: "t1",
        ...line("pommes", 1, "kg", { acceptedTypes: ["Gala"], note: "bio" }),
      },
    ];
    const [merged] = planListMerge(
      target,
      [line("pommes", 1, "kg", { note: "pour la tarte" })],
      units,
    );
    expect(merged?.acceptedTypes).toEqual([]);
    expect(merged?.note).toBe("bio · pour la tarte");
  });

  it("ne renvoie pas les lignes de la cible qui ne changent pas", () => {
    const target = [{ id: "t1", ...line("sel", 1, "paquet") }];
    expect(planListMerge(target, [line("lait", 1, "l")], units)).toHaveLength(
      1,
    );
  });
});
