import { describe, expect, it } from "vitest";
import { durataScrittura, sezioneDi, settimanaDi, TEMPI, tempoAzione, testoDaScrivere } from "@/libs/prototipo/leo-viaggio";
import { datiIniziali } from "@/libs/dati/iniziali";
import type { Seduta } from "@/libs/prototipo/leo-azioni";

describe("viaggio di Leo", () => {
  it("porta al calendario per le sedute e ai messaggi per scrivere", () => {
    expect(sezioneDi({ nome: "fissa_appuntamento", dati: { cliente: "sara-conti", data: "2026-10-26", ora: "10:00", durata: 60, tipo: "Workout" } })).toBe("/prototipo/trainer/calendario");
    expect(sezioneDi({ nome: "sposta_appuntamento", dati: { id: "A1", data: "2026-10-26", ora: "10:00" } })).toBe("/prototipo/trainer/calendario");
    expect(sezioneDi({ nome: "cancella_appuntamento", dati: { id: "A1" } })).toBe("/prototipo/trainer/calendario");
    expect(sezioneDi({ nome: "scrivi_messaggio", dati: { cliente: "sara-conti", testo: "Ciao" } })).toBe("/prototipo/trainer/messaggi?cliente=sara-conti");
  });

  it("per i soldi porta agli incassi, per il sollecito alla chat del cliente", () => {
    const d = { sedute: [] as Seduta[], dati: datiIniziali() };
    const p = d.dati.pagamenti.find((x) => x.clientId === "antonella-russo" && !x.paidOn)!;
    expect(sezioneDi({ nome: "segna_pagato", dati: { pagamento: p.id } }, d)).toBe("/prototipo/trainer/incassi");
    expect(sezioneDi({ nome: "registra_pagamento", dati: { cliente: "luca-ferri", importo: 120, descrizione: "x" } }, d)).toBe("/prototipo/trainer/incassi");
    expect(sezioneDi({ nome: "rinnova_pacchetto", dati: { cliente: "giulia-bianchi", lezioni: 10, importo: 450 } }, d)).toBe("/prototipo/trainer/incassi");
    expect(sezioneDi({ nome: "sollecita", dati: { pagamento: p.id } }, d)).toBe("/prototipo/trainer/messaggi?cliente=antonella-russo");
  });

  it("sa quale testo scrivere da solo nella chat dei messaggi", () => {
    const d = { sedute: [] as Seduta[], dati: datiIniziali() };
    const p = d.dati.pagamenti.find((x) => x.clientId === "antonella-russo" && !x.paidOn)!;
    expect(testoDaScrivere({ nome: "scrivi_messaggio", dati: { cliente: "sara-conti", testo: "Ciao" } }, d)).toEqual({ clientId: "sara-conti", testo: "Ciao" });
    expect(testoDaScrivere({ nome: "sollecita", dati: { pagamento: p.id } }, d)).toEqual({ clientId: "antonella-russo", testo: "Ciao Antonella, ti ricordo il pagamento di € 40 per valutazione posturale. Grazie!" });
    expect(testoDaScrivere({ nome: "sollecita", dati: { pagamento: p.id, testo: "Mi fai il bonifico?" } }, d)).toEqual({ clientId: "antonella-russo", testo: "Mi fai il bonifico?" });
    expect(testoDaScrivere({ nome: "segna_pagato", dati: { pagamento: p.id } }, d)).toBeNull();
  });

  it("per il messaggio a più clienti apre la conversazione del primo", () => {
    expect(sezioneDi({ nome: "scrivi_a_piu", dati: { clienti: ["luca-ferri", "sara-conti"], testo: "Ciao {nome}" } })).toBe("/prototipo/trainer/messaggi?cliente=luca-ferri");
  });

  it("sa in che settimana cade una data", () => {
    expect(settimanaDi("2026-10-19")).toBe(0);
    expect(settimanaDi("2026-10-25")).toBe(0);
    expect(settimanaDi("2026-10-26")).toBe(1);
    expect(settimanaDi("2026-11-01")).toBe(1);
  });

  it("scrive il messaggio a 25 ms per carattere, al massimo 3 secondi, subito con riduci movimento", () => {
    expect(durataScrittura("Ciao Sara", false)).toBe(9 * 25);
    expect(durataScrittura("a".repeat(500), false)).toBe(3000);
    expect(durataScrittura("Ciao Sara", true)).toBe(0);
  });

  it("con riduci movimento l'azione dura meno", () => {
    expect(TEMPI.azione).toBe(900);
    expect(TEMPI.azioneRidotta).toBe(300);
  });

  it("cancellare e fissare durano di più, per farsi vedere", () => {
    expect(tempoAzione("cancella_appuntamento", false)).toBe(1600);
    expect(tempoAzione("fissa_appuntamento", false)).toBe(1600);
    expect(tempoAzione("sposta_appuntamento", false)).toBe(900);
    expect(tempoAzione("scrivi_messaggio", false)).toBe(900);
    expect(tempoAzione("cancella_appuntamento", true)).toBe(600);
    expect(tempoAzione("sposta_appuntamento", true)).toBe(300);
  });
});
