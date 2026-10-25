import { describe, expect, it } from "vitest";
import { collectedCents, controllaImporto, controllaPagabile, euroInCentesimi, outstandingCents } from "@/libs/domain/payments";
import { controllaMisura, ultimaMisura } from "@/libs/domain/measurements";
import { controllaNuovoCliente, idDaNome } from "@/libs/domain/clients";
import type { ClienteDati, Pagamento } from "@/libs/dati/tipi";

const pag = (p: Partial<Pagamento>): Pagamento => ({ id: "P1", clientId: "x", packageId: null, description: "Mensile", amountCents: 12000, dueOn: "2026-10-01", paidOn: null, ...p });

describe("pagamenti", () => {
  it("euroInCentesimi legge numeri, virgole e il simbolo dell'euro", () => {
    expect(euroInCentesimi(450)).toBe(45000);
    expect(euroInCentesimi("450")).toBe(45000);
    expect(euroInCentesimi("450,50")).toBe(45050);
    expect(euroInCentesimi("€ 450")).toBe(45000);
    expect(euroInCentesimi("1.200,00")).toBe(120000);
    expect(euroInCentesimi(-3)).toBe(-300);
    expect(euroInCentesimi("abc")).toBeNull();
    expect(euroInCentesimi(null)).toBeNull();
  });

  it("controllaImporto: da 1 € a 5.000 €", () => {
    expect(controllaImporto(100)).toEqual({ ok: true });
    expect(controllaImporto(500000)).toEqual({ ok: true });
    expect(controllaImporto(50)).toEqual({ ok: false, motivo: "L'importo va da 1 € a 5.000 €" });
    expect(controllaImporto(500001).ok).toBe(false);
  });

  it("controllaPagabile: esiste e non è già pagato", () => {
    expect(controllaPagabile(pag({}))).toEqual({ ok: true });
    expect(controllaPagabile(pag({ paidOn: "2026-10-02" }))).toEqual({ ok: false, motivo: "Il pagamento è già segnato" });
    expect(controllaPagabile(undefined)).toEqual({ ok: false, motivo: "Pagamento non trovato" });
  });

  it("da incassare e incassato nel mese", () => {
    const lista = [pag({ amountCents: 4000 }), pag({ amountCents: 12000, paidOn: "2026-10-03" }), pag({ amountCents: 45000, paidOn: "2026-09-07" })];
    expect(outstandingCents(lista)).toBe(4000);
    expect(collectedCents(lista, "2026-10")).toBe(12000);
  });
});

describe("misure", () => {
  const base = { clientId: "giulia-bianchi", takenOn: "2026-10-21" };
  it("accetta valori plausibili", () => {
    expect(controllaMisura({ ...base, weightKg: 68 }, "2026-10-21")).toEqual({ ok: true });
    expect(controllaMisura({ ...base, waistCm: 79, hipsCm: 99 }, "2026-10-21")).toEqual({ ok: true });
  });
  it("rifiuta valori fuori misura, vuoti o nel futuro", () => {
    const peso = controllaMisura({ ...base, weightKg: 680 }, "2026-10-21");
    expect(peso.ok).toBe(false);
    expect("motivo" in peso && peso.motivo).toContain("680");
    expect(controllaMisura({ ...base, waistCm: 400 }, "2026-10-21").ok).toBe(false);
    expect(controllaMisura(base, "2026-10-21")).toEqual({ ok: false, motivo: "Nessun valore da salvare" });
    expect(controllaMisura({ ...base, takenOn: "2026-10-22", weightKg: 68 }, "2026-10-21")).toEqual({ ok: false, motivo: "La data è nel futuro" });
  });
  it("ultimaMisura: la più recente del cliente", () => {
    const righe = [
      { id: "M1", clientId: "a", takenOn: "2026-10-14", weightKg: 70 },
      { id: "M2", clientId: "a", takenOn: "2026-10-21", weightKg: 69 },
      { id: "M3", clientId: "b", takenOn: "2026-10-21", weightKg: 80 },
    ];
    expect(ultimaMisura(righe, "a")?.id).toBe("M2");
    expect(ultimaMisura(righe, "c")).toBeUndefined();
  });
});

describe("clienti", () => {
  it("idDaNome: minuscole, senza accenti, con -2 se esiste già", () => {
    expect(idDaNome("Sara Conti", [])).toBe("sara-conti");
    expect(idDaNome("Niccolò Rè", [])).toBe("niccolo-re");
    expect(idDaNome("  Anna   D'Amico ", [])).toBe("anna-d-amico");
    expect(idDaNome("Sara Conti", ["sara-conti"])).toBe("sara-conti-2");
    expect(idDaNome("Sara Conti", ["sara-conti", "sara-conti-2"])).toBe("sara-conti-3");
  });
  it("controllaNuovoCliente: nome presente e non doppio", () => {
    const esistenti = [{ id: "sara-conti", name: "Sara Conti" }] as ClienteDati[];
    expect(controllaNuovoCliente("Marta Neri", esistenti)).toEqual({ ok: true });
    expect(controllaNuovoCliente("  ", esistenti)).toEqual({ ok: false, motivo: "Manca il nome" });
    expect(controllaNuovoCliente(" sara  CONTI", esistenti)).toEqual({ ok: false, motivo: "Esiste già un cliente con questo nome" });
  });
});
