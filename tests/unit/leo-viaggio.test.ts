import { describe, expect, it } from "vitest";
import { durataScrittura, sezioneDi, settimanaDi, TEMPI, tempoAzione } from "@/libs/prototipo/leo-viaggio";

describe("viaggio di Leo", () => {
  it("porta al calendario per le sedute e ai messaggi per scrivere", () => {
    expect(sezioneDi({ nome: "fissa_appuntamento", dati: { cliente: "sara-conti", data: "2026-10-26", ora: "10:00", durata: 60, tipo: "Workout" } })).toBe("/prototipo/trainer/calendario");
    expect(sezioneDi({ nome: "sposta_appuntamento", dati: { id: "A1", data: "2026-10-26", ora: "10:00" } })).toBe("/prototipo/trainer/calendario");
    expect(sezioneDi({ nome: "cancella_appuntamento", dati: { id: "A1" } })).toBe("/prototipo/trainer/calendario");
    expect(sezioneDi({ nome: "scrivi_messaggio", dati: { cliente: "sara-conti", testo: "Ciao" } })).toBe("/prototipo/trainer/messaggi?cliente=sara-conti");
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
