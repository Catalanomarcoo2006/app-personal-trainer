import { describe, expect, it } from "vitest";
import {
  ADESSO,
  daConfermare,
  GIORNI_LEO,
  inChiaro,
  leggiAzione,
  luogoPredefinito,
  normalizzaOra,
  notaPerLeo,
  riassunto,
  verificaAzione,
  type AzioneLeo,
  type Seduta,
} from "@/libs/prototipo/leo-azioni";
import { clienteDa } from "@/libs/prototipo/leo-contesto";

// Una sola seduta di prova: giovedì 22 alle 18:00 per un'ora con Giulia Bianchi.
const sedute: Seduta[] = [{ id: "A1", date: "2026-10-22", time: "18:00", minutes: 60, clientId: "giulia-bianchi", type: "Workout", place: "Fit Lab, Meolo" }];

const fissa = (ora: string, durata = 60, data = "2026-10-22"): AzioneLeo => ({
  nome: "fissa_appuntamento",
  dati: { cliente: "sara-conti", data, ora, durata, tipo: "Workout" },
});

describe("normalizzaOra", () => {
  it("porta le ore scritte in modi diversi a HH:MM", () => {
    expect(normalizzaOra("9:00")).toBe("09:00");
    expect(normalizzaOra("18.30")).toBe("18:30");
    expect(normalizzaOra("18:00")).toBe("18:00");
  });
  it("scarta quello che non è un'ora", () => {
    expect(normalizzaOra("ore 18")).toBeNull();
    expect(normalizzaOra("25:00")).toBeNull();
    expect(normalizzaOra("10:75")).toBeNull();
  });
});

describe("leggiAzione", () => {
  it("accetta un'azione ben formata", () => {
    expect(leggiAzione("sposta_appuntamento", { id: "A3", data: "2026-10-23", ora: "10:00" })).toEqual({
      nome: "sposta_appuntamento",
      dati: { id: "A3", data: "2026-10-23", ora: "10:00" },
    });
  });
  it("normalizza l'ora prima di controllare", () => {
    expect(leggiAzione("sposta_appuntamento", { id: "A3", data: "2026-10-23", ora: "9:00" })?.dati).toMatchObject({ ora: "09:00" });
  });
  it("scarta azioni sconosciute o con dati mancanti", () => {
    expect(leggiAzione("vola", {})).toBeNull();
    expect(leggiAzione("fissa_appuntamento", { cliente: "C1" })).toBeNull();
    expect(leggiAzione("sposta_appuntamento", { id: "A3", data: "23/10", ora: "10:00" })).toBeNull();
  });
  it("un luogo vuoto vale come luogo abituale, una durata vuota come nessuna durata", () => {
    expect(leggiAzione("fissa_appuntamento", { cliente: "C4", data: "2026-10-23", ora: "10:00", durata: 60, tipo: "Workout", luogo: "" })).toEqual({
      nome: "fissa_appuntamento",
      dati: { cliente: "C4", data: "2026-10-23", ora: "10:00", durata: 60, tipo: "Workout" },
    });
    expect(leggiAzione("sposta_appuntamento", { id: "A3", data: "2026-10-23", ora: "10:00", durata: null })?.dati).toEqual({ id: "A3", data: "2026-10-23", ora: "10:00" });
    expect(leggiAzione("sposta_appuntamento", { id: "A3", data: "2026-10-23", ora: "10:00", durata: "" })?.dati).toEqual({ id: "A3", data: "2026-10-23", ora: "10:00" });
  });
  it("scarta messaggi vuoti o troppo lunghi", () => {
    expect(leggiAzione("scrivi_messaggio", { cliente: "C1", testo: "" })).toBeNull();
    expect(leggiAzione("scrivi_messaggio", { cliente: "C1", testo: "a".repeat(1001) })).toBeNull();
    expect(leggiAzione("scrivi_messaggio", { cliente: "C1", testo: "a".repeat(1000) })).not.toBeNull();
  });
});

describe("riconoscere il cliente", () => {
  it("accetta l'id, il nome completo o il solo nome, in qualunque maiuscolo", () => {
    expect(clienteDa("sara-conti")).toBe("sara-conti");
    expect(clienteDa("Sara Conti")).toBe("sara-conti");
    expect(clienteDa(" sara conti ")).toBe("sara-conti");
    expect(clienteDa("Sara")).toBe("sara-conti");
    expect(clienteDa("Mario")).toBeUndefined();
    expect(clienteDa("")).toBeUndefined();
  });
  it("inChiaro mette l'id del cliente e lascia il messaggio com'è", () => {
    expect(inChiaro({ nome: "scrivi_messaggio", dati: { cliente: "Sara Conti", testo: "Ciao Sara, ci vediamo venerdì" } })).toEqual({
      nome: "scrivi_messaggio",
      dati: { cliente: "sara-conti", testo: "Ciao Sara, ci vediamo venerdì" },
    });
    expect(inChiaro({ nome: "fissa_appuntamento", dati: { cliente: "Mario Rossi", data: "2026-10-22", ora: "10:00", durata: 60, tipo: "Workout" } })).toBeNull();
    expect(inChiaro({ nome: "cancella_appuntamento", dati: { id: "A1" } })).toEqual({ nome: "cancella_appuntamento", dati: { id: "A1" } });
  });
});

describe("verificaAzione", () => {
  it("rifiuta le sovrapposizioni col nome vero del cliente", () => {
    expect(verificaAzione(fissa("18:30"), sedute)).toEqual({ ok: false, motivo: "Si sovrappone con Giulia Bianchi alle 18:00" });
  });
  it("accetta le sedute attaccate", () => {
    expect(verificaAzione(fissa("19:00"), sedute)).toEqual({ ok: true });
    expect(verificaAzione(fissa("17:00"), sedute)).toEqual({ ok: true });
  });
  it("tiene le sedute tra le 6 e le 22", () => {
    const presto = verificaAzione(fissa("05:30"), sedute);
    expect(presto).toMatchObject({ ok: false, motivo: expect.stringContaining("6:00") });
    const tardi = verificaAzione(fissa("21:30"), sedute);
    expect(tardi).toMatchObject({ ok: false, motivo: expect.stringContaining("22:00") });
    expect(verificaAzione(fissa("21:00"), sedute)).toEqual({ ok: true });
  });
  it("tiene la durata tra 15 e 180 minuti", () => {
    expect(verificaAzione(fissa("10:00", 10), sedute).ok).toBe(false);
    expect(verificaAzione(fissa("10:00", 200), sedute).ok).toBe(false);
    expect(verificaAzione(fissa("10:00", 15), sedute).ok).toBe(true);
  });
  it("agisce solo su questa settimana e la prossima, non nel passato", () => {
    expect(verificaAzione(fissa("10:00", 60, "2026-11-02"), sedute).ok).toBe(false);
    expect(verificaAzione(fissa("09:00", 60, "2026-10-21"), sedute).ok).toBe(false);
    expect(verificaAzione(fissa("09:00", 60, "2026-10-20"), sedute).ok).toBe(false);
    expect(verificaAzione(fissa("11:00", 60, "2026-10-21"), sedute).ok).toBe(true);
    expect(verificaAzione(fissa("10:00", 60, "2026-11-01"), sedute).ok).toBe(true);
  });
  it("lo spostamento può sovrapporsi solo a sé stesso", () => {
    expect(verificaAzione({ nome: "sposta_appuntamento", dati: { id: "A1", data: "2026-10-22", ora: "18:30" } }, sedute)).toEqual({ ok: true });
    expect(verificaAzione({ nome: "sposta_appuntamento", dati: { id: "A99", data: "2026-10-22", ora: "18:30" } }, sedute)).toEqual({
      ok: false,
      motivo: "Appuntamento non trovato",
    });
    const due: Seduta[] = [...sedute, { ...sedute[0], id: "A2", time: "10:00", clientId: "sara-conti" }];
    expect(verificaAzione({ nome: "sposta_appuntamento", dati: { id: "A2", data: "2026-10-22", ora: "17:30" } }, due)).toEqual({
      ok: false,
      motivo: "Si sovrappone con Giulia Bianchi alle 18:00",
    });
  });
  it("controlla che cliente e seduta esistano", () => {
    expect(verificaAzione({ ...fissa("10:00"), dati: { ...fissa("10:00").dati, cliente: "nessuno" } } as AzioneLeo, sedute)).toEqual({
      ok: false,
      motivo: "Cliente non trovato",
    });
    expect(verificaAzione({ nome: "cancella_appuntamento", dati: { id: "A7" } }, sedute)).toEqual({ ok: false, motivo: "Appuntamento non trovato" });
    expect(verificaAzione({ nome: "cancella_appuntamento", dati: { id: "A1" } }, sedute)).toEqual({ ok: true });
  });
});

describe("altre regole", () => {
  it("chiede conferma solo per cancellare e scrivere", () => {
    expect(daConfermare(fissa("10:00"))).toBe(false);
    expect(daConfermare({ nome: "sposta_appuntamento", dati: { id: "A1", data: "2026-10-23", ora: "10:00" } })).toBe(false);
    expect(daConfermare({ nome: "cancella_appuntamento", dati: { id: "A1" } })).toBe(true);
    expect(daConfermare({ nome: "scrivi_messaggio", dati: { cliente: "sara-conti", testo: "Ciao" } })).toBe(true);
  });
  it("sceglie il luogo secondo il tipo", () => {
    expect(luogoPredefinito("Workout")).toBe("Fit Lab, Meolo");
    expect(luogoPredefinito("Valutazione")).toBe("Fit Lab, Meolo");
    expect(luogoPredefinito("Online")).toBe("Videochiamata");
    expect(luogoPredefinito("Corsa")).toBe("Parco di Meolo");
  });
  it("le giornate di Leo sono le 14 di questa settimana e della prossima", () => {
    expect(GIORNI_LEO).toHaveLength(14);
    expect(GIORNI_LEO[0]).toBe("2026-10-19");
    expect(GIORNI_LEO[13]).toBe("2026-11-01");
    expect(ADESSO.data).toBe("2026-10-21");
  });
  it("riassume l'azione con i nomi veri", () => {
    const s: Seduta[] = [{ ...sedute[0], id: "A3", clientId: "sara-conti", time: "10:00" }];
    expect(riassunto({ nome: "sposta_appuntamento", dati: { id: "A3", data: "2026-10-23", ora: "10:00" } }, s)).toBe(
      "Sposto Sara Conti · gio 22/10 10:00 → ven 23/10 10:00",
    );
    expect(riassunto(fissa("19:00"), s)).toBe("Fisso Workout con Sara Conti · gio 22/10 19:00 · 60 min");
    expect(riassunto({ nome: "cancella_appuntamento", dati: { id: "A3" } }, s)).toBe("Cancello Workout con Sara Conti · gio 22/10 10:00");
    expect(riassunto({ nome: "scrivi_messaggio", dati: { cliente: "sara-conti", testo: "Ciao" } }, s)).toBe("Messaggio a Sara Conti");
  });
  it("la nota per Leo racconta gli esiti con i nomi", () => {
    const nota = notaPerLeo([
      { azione: { nome: "sposta_appuntamento", dati: { id: "A1", data: "2026-10-23", ora: "10:00" } }, stato: "fatto" },
      { azione: { nome: "scrivi_messaggio", dati: { cliente: "sara-conti", testo: "Ciao" } }, stato: "annullato" },
      { azione: fissa("18:30"), stato: "rifiutato", motivo: "Si sovrappone con Giulia Bianchi alle 18:00" },
    ]);
    expect(nota).toContain("fatto: spostato A1 a 2026-10-23 10:00");
    expect(nota).toContain("messaggio a Sara Conti annullato dal trainer");
    expect(nota).toContain("rifiutato dall'app (Si sovrappone con Giulia Bianchi alle 18:00)");
    expect(notaPerLeo([])).toBe("");
  });
});
