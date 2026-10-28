import { describe, expect, it } from "vitest";
import { oggiOProssimo, prossimaDelGiorno, seduteConGiorno } from "@/libs/prototipo/allenamenti";
import type { Seduta } from "@/libs/prototipo/leo-azioni";

const s = (id: string, date: string, time = "18:00", clientId = "giulia"): Seduta => ({ id, date, time, minutes: 60, clientId, type: "Workout", place: "" });
const sedute = [s("lun", "2026-10-19", "09:00"), s("mer", "2026-10-21"), s("ven", "2026-10-23"), s("lun2", "2026-10-26"), s("altro", "2026-10-21", "10:00", "luca")];
const OGGI = "2026-10-21";

describe("giorni della scheda per le sedute", () => {
  it("dalla prima seduta da oggi in poi: A, B, C, A; quella passata torna indietro (C)", () => {
    const g = seduteConGiorno(sedute, "giulia", OGGI, 3).map((x) => [x.seduta.id, x.giorno]);
    expect(g).toEqual([["lun", 2], ["mer", 0], ["ven", 1], ["lun2", 2]]);
  });

  it("oggi c'è la seduta: l'allenamento è quello di oggi", () => {
    expect(oggiOProssimo(sedute, "giulia", OGGI, 3)).toMatchObject({ oggi: true, giorno: 0, seduta: { id: "mer" } });
  });

  it("se la seduta di oggi non c'è più, si mostra la prossima, che diventa il Giorno A", () => {
    const senza = sedute.filter((x) => x.id !== "mer");
    expect(oggiOProssimo(senza, "giulia", OGGI, 3)).toMatchObject({ oggi: false, giorno: 0, seduta: { id: "ven" } });
  });

  it("nessuna seduta da oggi in poi, o scheda vuota: niente", () => {
    expect(oggiOProssimo([s("lun", "2026-10-19")], "giulia", OGGI, 3)).toBeNull();
    expect(oggiOProssimo(sedute, "giulia", OGGI, 0)).toBeNull();
  });

  it("la prossima seduta di ogni giorno della scheda", () => {
    expect(prossimaDelGiorno(sedute, "giulia", OGGI, 3, 1)?.id).toBe("ven");
    expect(prossimaDelGiorno(sedute, "giulia", OGGI, 3, 2)?.id).toBe("lun2");
    expect(prossimaDelGiorno(sedute, "giulia", OGGI, 4, 3)).toBeNull();
  });
});
