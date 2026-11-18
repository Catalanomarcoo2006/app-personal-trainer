import { describe, expect, it } from "vitest";
import { giaAllOra, raggruppaPerOra } from "@/libs/prototipo/sovrapposte";

const s = (time: string, id: string) => ({ time, id });

describe("sedute nella stessa ora", () => {
  it("una seduta sola resta sola; quelle che iniziano nella stessa ora stanno insieme", () => {
    expect(raggruppaPerOra([s("09:00", "a")])).toEqual([[s("09:00", "a")]]);
    expect(raggruppaPerOra([s("17:00", "a"), s("17:00", "b"), s("17:30", "c"), s("18:00", "d")])).toEqual([
      [s("17:00", "a"), s("17:00", "b"), s("17:30", "c")],
      [s("18:00", "d")],
    ]);
  });

  it("quattro nello stesso orario: un solo gruppo, nessuna persa", () => {
    const g = raggruppaPerOra([s("17:00", "a"), s("17:00", "b"), s("17:00", "c"), s("17:00", "d")]);
    expect(g).toHaveLength(1);
    expect(g[0].map((x) => x.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("nessuna seduta: nessun gruppo", () => {
    expect(raggruppaPerOra([])).toEqual([]);
  });

  it("chi c'è già nell'ora scelta, escludendo la seduta che si sta spostando", () => {
    const tutte = [s("17:00", "a"), s("17:30", "b"), s("18:00", "c")];
    expect(giaAllOra(tutte, "17:15").map((x) => x.id)).toEqual(["a", "b"]);
    expect(giaAllOra(tutte, "17:15", tutte[0]).map((x) => x.id)).toEqual(["b"]);
    expect(giaAllOra(tutte, "09:00")).toEqual([]);
  });
});
