import { describe, expect, it } from "vitest";
import { seduteDelGiorno, settimanaDelCliente } from "@/libs/prototipo/calendario";
import type { Seduta } from "@/libs/prototipo/leo-azioni";

const s = (id: string, date: string, time: string, clientId = "davide-greco"): Seduta => ({ id, date, time, minutes: 60, clientId, type: "Workout", place: "Fit Lab, Meolo" });
const sedute = [s("A1", "2026-10-22", "18:30"), s("A2", "2026-10-20", "19:00"), s("A3", "2026-10-21", "10:00", "sara-conti"), s("A4", "2026-10-27", "18:30"), s("A5", "2026-10-21", "08:00")];

describe("calendario dallo store", () => {
  it("le sedute di un giorno, in ordine di ora", () => {
    expect(seduteDelGiorno(sedute, "2026-10-21").map((x) => x.id)).toEqual(["A5", "A3"]);
  });

  it("le sedute di questa settimana di un cliente, con l'indice del giorno", () => {
    expect(settimanaDelCliente(sedute, "davide-greco").map((x) => [x.id, x.d])).toEqual([
      ["A2", 1],
      ["A5", 2],
      ["A1", 3],
    ]);
  });
});
