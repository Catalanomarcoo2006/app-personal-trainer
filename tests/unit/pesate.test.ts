import { describe, expect, it } from "vitest";
import { pesataDovuta, prossimaPesata } from "@/libs/domain/pesate";

describe("ogni quanto pesarsi", () => {
  it("la prossima pesata: domani, tra una settimana, tra un mese (l'ultimo del mese resta l'ultimo)", () => {
    expect(prossimaPesata("2026-10-21", "giorno")).toBe("2026-10-22");
    expect(prossimaPesata("2026-10-28", "settimana")).toBe("2026-11-04");
    expect(prossimaPesata("2026-10-31", "mese")).toBe("2026-11-30");
    expect(prossimaPesata("2026-12-31", "giorno")).toBe("2027-01-01");
  });

  it("tocca quando è passato il tempo giusto, o se non c'è ancora nessuna pesata", () => {
    expect(pesataDovuta("2026-10-14", "2026-10-21", "settimana")).toBe(true);
    expect(pesataDovuta("2026-10-15", "2026-10-21", "settimana")).toBe(false);
    expect(pesataDovuta("2026-10-21", "2026-10-21", "giorno")).toBe(false);
    expect(pesataDovuta("2026-10-20", "2026-10-21", "giorno")).toBe(true);
    expect(pesataDovuta("2026-10-14", "2026-10-21", "mese")).toBe(false);
    expect(pesataDovuta(undefined, "2026-10-21", "mese")).toBe(true);
  });
});
