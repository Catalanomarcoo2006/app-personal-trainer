import { describe, expect, it } from "vitest";
import { testoSollecito, urgentiDa } from "@/libs/dati/testi";
import { datiIniziali } from "@/libs/dati/iniziali";
import type { Pagamento } from "@/libs/dati/tipi";

describe("testoSollecito", () => {
  it("chiama il cliente per nome e dice importo e descrizione", () => {
    const p = { id: "P2", clientId: "antonella-russo", packageId: null, description: "Valutazione posturale", amountCents: 4000, dueOn: "2026-10-03", paidOn: null } as Pagamento;
    expect(testoSollecito(p, "Antonella Russo")).toBe("Ciao Antonella, ti ricordo il pagamento di € 40 per valutazione posturale. Grazie!");
  });
  it("con i centesimi li scrive", () => {
    const p = { id: "P9", clientId: "x", packageId: null, description: "Mensile", amountCents: 12050, dueOn: "2026-10-03", paidOn: null } as Pagamento;
    expect(testoSollecito(p, "Luca Ferri")).toContain("€ 120,50");
  });
});

describe("urgentiDa", () => {
  it("pagamenti aperti e pacchetti in scadenza dai dati, gli altri avvisi come nella demo", () => {
    const d = datiIniziali();
    const u = urgentiDa(d);
    expect(u.filter((x) => x.kind === "pagamento").map((x) => [x.clientId, x.title])).toEqual([
      ["antonella-russo", "Pagamento mancante · € 40"],
      ["luca-ferri", "Pagamento mancante · € 120"],
    ]);
    expect(u.filter((x) => x.kind === "pacchetto").map((x) => [x.clientId, x.detail])).toEqual([
      ["giulia-bianchi", "Giulia Bianchi · restano 2 lezioni"],
      ["sara-conti", "Sara Conti · resta 1 lezione"],
    ]);
    expect(u.some((x) => x.kind === "imminente")).toBe(true);
    expect(u.some((x) => x.kind === "dolore")).toBe(true);
  });
  it("un pagamento segnato sparisce dagli urgenti", () => {
    const d = datiIniziali();
    const pagati = { ...d, pagamenti: d.pagamenti.map((p) => ({ ...p, paidOn: p.paidOn ?? "2026-10-21" })) };
    expect(urgentiDa(pagati).filter((x) => x.kind === "pagamento")).toEqual([]);
  });
});
