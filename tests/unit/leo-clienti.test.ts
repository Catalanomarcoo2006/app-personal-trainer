import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AzioneLeo } from "@/libs/prototipo/leo-azioni";

// Ogni test riparte dallo stato iniziale della demo: i moduli si ricaricano da capo.
async function carica() {
  vi.resetModules();
  const { stato } = await import("@/libs/prototipo/stato");
  const az = await import("@/libs/prototipo/leo-azioni");
  const { clienteDa } = await import("@/libs/prototipo/leo-contesto");
  const { eseguiAzione, datiLeo } = await import("@/libs/prototipo/leo-esegui");
  const { clientiAttuali, vistaCliente } = await import("@/libs/dati/selettori");
  return { stato, az, clienteDa, eseguiAzione, datiLeo, clientiAttuali, vistaCliente };
}

let m: Awaited<ReturnType<typeof carica>>;
beforeEach(async () => {
  m = await carica();
});

const vista = (id: string) => m.vistaCliente(m.stato.get().dati, id)!;
const misure = (dati: Record<string, unknown>): AzioneLeo => ({ nome: "aggiorna_misure", dati: { cliente: "giulia-bianchi", ...dati } }) as AzioneLeo;

describe("forma e controlli", () => {
  it("le misure accettano la virgola e i numeri scritti come testo", () => {
    expect(m.az.leggiAzione("aggiorna_misure", { cliente: "giulia", peso: "68,4", vita: "79" })).toEqual({ nome: "aggiorna_misure", dati: { cliente: "giulia", peso: 68.4, vita: 79 } });
  });

  it("un valore che non è un numero (n/d, -, testo) non diventa 0: si lascia fuori", () => {
    expect(m.az.leggiAzione("aggiorna_misure", { cliente: "giulia", peso: "n/d", vita: "79" })).toEqual({ nome: "aggiorna_misure", dati: { cliente: "giulia", vita: 79 } });
    expect(m.az.leggiAzione("aggiorna_misure", { cliente: "giulia", peso: "-", fianchi: "da misurare" })).toEqual({ nome: "aggiorna_misure", dati: { cliente: "giulia" } });
    expect(m.az.verificaAzione(misure({}), m.datiLeo())).toEqual({ ok: false, motivo: "Nessun valore da salvare" });
  });

  it("misure senza valori o fuori misura non passano", () => {
    expect(m.az.verificaAzione(misure({}), m.datiLeo())).toEqual({ ok: false, motivo: "Nessun valore da salvare" });
    const v = m.az.verificaAzione(misure({ peso: 680 }), m.datiLeo());
    expect("motivo" in v && v.motivo).toContain("680");
    expect(m.az.verificaAzione(misure({ peso: 68, data: "2026-10-30" }), m.datiLeo())).toEqual({ ok: false, motivo: "La data è nel futuro" });
    expect(m.az.verificaAzione(misure({ peso: 68 }), m.datiLeo())).toEqual({ ok: true });
  });

  it("obiettivo e nota vogliono qualcosa da scrivere", () => {
    expect(m.az.verificaAzione({ nome: "aggiorna_obiettivo", dati: { cliente: "giulia-bianchi" } }, m.datiLeo())).toEqual({ ok: false, motivo: "Niente da cambiare nell'obiettivo" });
    expect(m.az.leggiAzione("aggiungi_nota", { cliente: "luca", testo: "   " })).toBeNull();
  });

  it("un nuovo cliente con lo stesso nome di uno esistente non passa", () => {
    expect(m.az.verificaAzione({ nome: "nuovo_cliente", dati: { nome: "Sara Conti", genere: "donna" } }, m.datiLeo())).toEqual({ ok: false, motivo: "Esiste già un cliente con questo nome" });
    expect(m.az.verificaAzione({ nome: "nuovo_cliente", dati: { nome: "Marta Neri", genere: "donna" } }, m.datiLeo())).toEqual({ ok: true });
  });

  it("subito con Annulla, ma da un file si conferma; il nuovo cliente si conferma sempre", () => {
    expect(m.az.daConfermare(misure({ peso: 68 }))).toBe(false);
    expect(m.az.daConfermare(misure({ peso: 68 }), true)).toBe(true);
    expect(m.az.daConfermare({ nome: "aggiungi_nota", dati: { cliente: "luca-ferri", testo: "ok" } }, true)).toBe(true);
    expect(m.az.daConfermare({ nome: "nuovo_cliente", dati: { nome: "Marta Neri", genere: "donna" } })).toBe(true);
    // le azioni del calendario restano come prima anche con un allegato
    expect(m.az.daConfermare({ nome: "sposta_appuntamento", dati: { id: "A1", data: "2026-10-23", ora: "10:00" } }, true)).toBe(false);
  });
});

describe("prima e dopo", () => {
  it("per le misure mostra il valore di adesso e quello nuovo", () => {
    expect(m.az.primaDopo(misure({ vita: 79, peso: 68 }), m.datiLeo())).toEqual([
      { voce: "Peso", prima: "68,9 kg", dopo: "68 kg" },
      { voce: "Vita", prima: "82 cm", dopo: "79 cm" },
    ]);
  });
  it("per l'obiettivo mostra descrizione e traguardo", () => {
    expect(m.az.primaDopo({ nome: "aggiorna_obiettivo", dati: { cliente: "giulia-bianchi", traguardo: 62 } }, m.datiLeo())).toEqual([{ voce: "Traguardo", prima: "64 kg", dopo: "62 kg" }]);
  });
  it("per le altre azioni non c'è niente da mostrare", () => {
    expect(m.az.primaDopo({ nome: "aggiungi_nota", dati: { cliente: "luca-ferri", testo: "ok" } }, m.datiLeo())).toEqual([]);
  });
});

describe("nomi dei clienti", () => {
  it("riconosce cognome e nome al contrario e in maiuscolo", () => {
    expect(m.clienteDa("CONTI SARA")).toBe("sara-conti");
    expect(m.clienteDa("bianchi giulia")).toBe("giulia-bianchi");
  });
  it("con due clienti dallo stesso nome non sceglie a caso", () => {
    const elenco = [
      { id: "sara-conti", name: "Sara Conti" },
      { id: "sara-neri", name: "Sara Neri" },
    ];
    expect(m.clienteDa("Sara", elenco)).toBeUndefined();
  });
});

describe("esecuzione", () => {
  it("aggiorna_misure aggiunge la rilevazione; annulla la toglie", async () => {
    const prima = structuredClone(m.stato.get().dati);
    const esito = await m.eseguiAzione(misure({ peso: 68, vita: 79 }));
    expect(vista("giulia-bianchi").current).toBe(68);
    expect(vista("giulia-bianchi").measures.find((x) => x.label === "Vita")?.current).toBe(79);
    expect(m.stato.get().focus).toMatchObject({ tipo: "misure", clientId: "giulia-bianchi" });
    if (esito.ok) await esito.annulla?.();
    expect(m.stato.get().dati).toEqual(prima);
  });

  it("aggiorna_obiettivo e aggiungi_nota cambiano il profilo", async () => {
    await m.eseguiAzione({ nome: "aggiorna_obiettivo", dati: { cliente: "giulia-bianchi", descrizione: "Dimagrimento −10 kg", traguardo: 62 } });
    expect(vista("giulia-bianchi")).toMatchObject({ goal: "Dimagrimento −10 kg", target: 62 });
    await m.eseguiAzione({ nome: "aggiungi_nota", dati: { cliente: "luca-ferri", testo: "Ginocchio a posto" } });
    expect(vista("luca-ferri").notes).toContain("21/10 · Ginocchio a posto");
    expect(m.stato.get().focus).toMatchObject({ tipo: "nota", clientId: "luca-ferri" });
  });

  it("nuovo_cliente crea il cliente con l'email scritta dal trainer; dopo Leo lo trova per nome", async () => {
    const esito = await m.eseguiAzione({ nome: "nuovo_cliente", dati: { nome: "Marta Neri", genere: "donna", obiettivo: "Tonificazione", email: "marta@esempio.it" } });
    expect(esito.ok).toBe(true);
    expect(m.clientiAttuali().find((c) => c.id === "marta-neri")).toMatchObject({ name: "Marta Neri", goal: "Tonificazione", email: "marta@esempio.it" });
    expect(m.stato.get().focus).toMatchObject({ tipo: "cliente", clientId: "marta-neri" });
    const fissa = m.az.inChiaro({ nome: "fissa_appuntamento", dati: { cliente: "Marta", data: "2026-10-26", ora: "09:00", durata: 60, tipo: "Workout" } }, m.clientiAttuali());
    expect(fissa).toMatchObject({ dati: { cliente: "marta-neri" } });
  });

  it("l'email non arriva mai dall'AI: lo schema la scarta", () => {
    expect(m.az.leggiAzione("nuovo_cliente", { nome: "Marta Neri", genere: "donna", email: "x@y.it" })).toEqual({ nome: "nuovo_cliente", dati: { nome: "Marta Neri", genere: "donna" } });
  });
});
