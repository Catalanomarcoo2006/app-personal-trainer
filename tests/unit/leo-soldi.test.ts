import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AzioneLeo } from "@/libs/prototipo/leo-azioni";

// Ogni test riparte dallo stato iniziale della demo: i moduli si ricaricano da capo.
async function carica() {
  vi.resetModules();
  const { stato } = await import("@/libs/prototipo/stato");
  const az = await import("@/libs/prototipo/leo-azioni");
  const { eseguiAzione, datiLeo } = await import("@/libs/prototipo/leo-esegui");
  const sp = await import("@/libs/dati/sportello");
  const { calcolaIncassi } = await import("@/libs/dati/vista");
  return { stato, az, eseguiAzione, datiLeo, sp, calcolaIncassi };
}

let m: Awaited<ReturnType<typeof carica>>;
beforeEach(async () => {
  m = await carica();
});

const dati = () => m.stato.get().dati;
const aperto = (clientId: string) => dati().pagamenti.find((p) => p.clientId === clientId && !p.paidOn)!;

describe("forma delle azioni dei soldi", () => {
  it("l'importo arriva in euro, anche scritto con la virgola o come testo", () => {
    expect(m.az.leggiAzione("registra_pagamento", { cliente: "luca", importo: "120,00", descrizione: "Mensile novembre" })).toEqual({
      nome: "registra_pagamento",
      dati: { cliente: "luca", importo: 120, descrizione: "Mensile novembre" },
    });
    expect(m.az.leggiAzione("rinnova_pacchetto", { cliente: "giulia", lezioni: 10, importo: 450 })).toMatchObject({ dati: { importo: 450, lezioni: 10 } });
    expect(m.az.leggiAzione("registra_pagamento", { cliente: "luca", importo: "tanto", descrizione: "x" })).toBeNull();
  });

  it("rileggere un'azione già letta non cambia l'importo (server e browser la leggono entrambi)", () => {
    const una = m.az.leggiAzione("rinnova_pacchetto", { cliente: "giulia", lezioni: 10, importo: "450" })!;
    const due = m.az.leggiAzione(una.nome, una.dati);
    expect(due).toEqual(una);
  });

  it("il rinnovo vuole lezioni oppure mesi, non tutti e due né nessuno", () => {
    expect(m.az.leggiAzione("rinnova_pacchetto", { cliente: "giulia", lezioni: 10, mesi: 1, importo: 450 })).toBeNull();
    expect(m.az.leggiAzione("rinnova_pacchetto", { cliente: "giulia", importo: 450 })).toBeNull();
  });

  it("inChiaro trova il cliente e scrive l'id del pagamento in maiuscolo", () => {
    expect(m.az.inChiaro({ nome: "registra_pagamento", dati: { cliente: "Luca", importo: 120, descrizione: "x" } })).toMatchObject({ dati: { cliente: "luca-ferri" } });
    expect(m.az.inChiaro({ nome: "segna_pagato", dati: { pagamento: "p2" } })).toEqual({ nome: "segna_pagato", dati: { pagamento: "P2" } });
  });

  it("si confermano tutte", () => {
    for (const a of [
      { nome: "segna_pagato", dati: { pagamento: "P2" } },
      { nome: "registra_pagamento", dati: { cliente: "luca-ferri", importo: 120, descrizione: "x" } },
      { nome: "rinnova_pacchetto", dati: { cliente: "giulia-bianchi", lezioni: 10, importo: 450 } },
      { nome: "sollecita", dati: { pagamento: "P2" } },
    ] as AzioneLeo[])
      expect(m.az.daConfermare(a)).toBe(true);
  });
});

describe("controlli e riassunti", () => {
  it("segna_pagato: pagamento esistente e non ancora pagato", async () => {
    const id = aperto("antonella-russo").id;
    expect(m.az.verificaAzione({ nome: "segna_pagato", dati: { pagamento: "P99" } }, m.datiLeo())).toEqual({ ok: false, motivo: "Pagamento non trovato" });
    expect(m.az.verificaAzione({ nome: "segna_pagato", dati: { pagamento: id } }, m.datiLeo())).toEqual({ ok: true });
    // il trainer lo segna a mano mentre la scheda di Leo aspetta: alla conferma non si raddoppia
    await m.sp.segnaPagato(id);
    const incassato = m.calcolaIncassi(dati()).collectedCents;
    expect(await m.eseguiAzione({ nome: "segna_pagato", dati: { pagamento: id } })).toEqual({ ok: false, motivo: "Il pagamento è già segnato" });
    expect(m.calcolaIncassi(dati()).collectedCents).toBe(incassato);
  });

  it("rinnova_pacchetto: il tipo di pacchetto deve combaciare", () => {
    expect(m.az.verificaAzione({ nome: "rinnova_pacchetto", dati: { cliente: "luca-ferri", lezioni: 10, importo: 120 } }, m.datiLeo())).toEqual({
      ok: false,
      motivo: "Il pacchetto di Luca Ferri è a tempo: si rinnova a mesi",
    });
    expect(m.az.verificaAzione({ nome: "rinnova_pacchetto", dati: { cliente: "luca-ferri", mesi: 1, importo: 120 } }, m.datiLeo())).toEqual({ ok: true });
  });

  it("registra_pagamento: importo nei limiti", () => {
    expect(m.az.verificaAzione({ nome: "registra_pagamento", dati: { cliente: "luca-ferri", importo: 0.5, descrizione: "x" } }, m.datiLeo())).toEqual({
      ok: false,
      motivo: "L'importo va da 1 € a 5.000 €",
    });
  });

  it("i riassunti dicono chi, quanto e cosa", () => {
    const d = m.datiLeo();
    const p = aperto("antonella-russo").id;
    expect(m.az.riassunto({ nome: "segna_pagato", dati: { pagamento: p } }, d)).toBe("Segno pagato · Antonella Russo · € 40 (valutazione posturale)");
    expect(m.az.riassunto({ nome: "registra_pagamento", dati: { cliente: "luca-ferri", importo: 120, descrizione: "Mensile novembre" } }, d)).toBe("Registro € 120 da Luca Ferri · Mensile novembre");
    expect(m.az.riassunto({ nome: "rinnova_pacchetto", dati: { cliente: "giulia-bianchi", lezioni: 10, importo: 450 } }, d)).toBe("Rinnovo Giulia Bianchi · +10 lezioni · € 450 da incassare");
    expect(m.az.riassunto({ nome: "rinnova_pacchetto", dati: { cliente: "luca-ferri", mesi: 1, importo: 120 } }, d)).toBe("Rinnovo Luca Ferri · +1 mese · € 120 da incassare");
    expect(m.az.riassunto({ nome: "sollecita", dati: { pagamento: p } }, d)).toBe("Sollecito ad Antonella Russo · € 40");
  });
});

describe("esecuzione", () => {
  it("segna_pagato sposta l'incasso; annulla lo rimette", async () => {
    const prima = structuredClone(dati());
    const id = aperto("antonella-russo").id;
    const esito = await m.eseguiAzione({ nome: "segna_pagato", dati: { pagamento: id } });
    expect(m.calcolaIncassi(dati())).toEqual({ collectedCents: 288000, outstandingCents: 12000 });
    expect(m.stato.get().focus).toMatchObject({ tipo: "pagato", pagamentoId: id });
    if (esito.ok) await esito.annulla?.();
    expect(dati()).toEqual(prima);
  });

  it("rinnova_pacchetto aggiunge lezioni e pagamento da incassare; annulla toglie tutto", async () => {
    const prima = structuredClone(dati());
    const esito = await m.eseguiAzione({ nome: "rinnova_pacchetto", dati: { cliente: "giulia-bianchi", lezioni: 10, importo: 450 } });
    expect(esito.ok).toBe(true);
    expect(dati().pacchetti.find((p) => p.clientId === "giulia-bianchi")?.lessonsTotal).toBe(20);
    expect(m.stato.get().focus).toMatchObject({ tipo: "rinnovo", clientId: "giulia-bianchi" });
    if (esito.ok) await esito.annulla?.();
    expect(dati()).toEqual(prima);
  });

  it("registra_pagamento entra già incassato", async () => {
    await m.eseguiAzione({ nome: "registra_pagamento", dati: { cliente: "luca-ferri", importo: 120, descrizione: "Mensile novembre" } });
    expect(m.calcolaIncassi(dati()).collectedCents).toBe(296000);
    expect(m.stato.get().focus).toMatchObject({ tipo: "pagamento", clientId: "luca-ferri" });
  });

  it("sollecita scrive al cliente l'importo, col testo di Leo o quello standard", async () => {
    const id = aperto("antonella-russo").id;
    await m.eseguiAzione({ nome: "sollecita", dati: { pagamento: id } });
    expect(m.stato.get().threads["antonella-russo"].at(-1)?.text).toBe("Ciao Antonella, ti ricordo il pagamento di € 40 per valutazione posturale. Grazie!");
    await m.eseguiAzione({ nome: "sollecita", dati: { pagamento: id, testo: "Ciao Antonella, quando puoi mi fai il bonifico di € 40? Grazie" } });
    expect(m.stato.get().threads["antonella-russo"].at(-1)?.text).toContain("bonifico di € 40");
    expect(m.stato.get().focus).toMatchObject({ tipo: "messaggio", clientId: "antonella-russo" });
  });
});
