import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AzioneLeo } from "@/libs/prototipo/leo-azioni";

// Ogni test riparte dallo stato iniziale della demo: il modulo dello store si ricarica da capo.
async function carica() {
  vi.resetModules();
  const { stato } = await import("@/libs/prototipo/stato");
  const { eseguiAzione } = await import("@/libs/prototipo/leo-esegui");
  return { stato, eseguiAzione };
}

let m: Awaited<ReturnType<typeof carica>>;
beforeEach(async () => {
  m = await carica();
});

const seduta = (clientId: string, date: string) => m.stato.get().sedute.find((s) => s.clientId === clientId && s.date === date)!;

describe("store del calendario", () => {
  it("parte con le sedute di questa settimana e della prossima, con id unici", () => {
    const { sedute } = m.stato.get();
    expect(sedute.length).toBeGreaterThan(20);
    expect(new Set(sedute.map((s) => s.id)).size).toBe(sedute.length);
    const date = sedute.map((s) => s.date).sort();
    expect(date[0] >= "2026-10-19").toBe(true);
    expect(date[date.length - 1] <= "2026-11-01").toBe(true);
    expect(sedute.some((s) => s.date >= "2026-10-26")).toBe(true);
    expect(seduta("sara-conti", "2026-10-22")).toMatchObject({ time: "10:00", minutes: 60, type: "Workout" });
  });

  it("parte con le conversazioni della demo", () => {
    expect(Object.keys(m.stato.get().threads).length).toBeGreaterThan(3);
  });
});

describe("eseguiAzione", () => {
  it("fissa una seduta con il luogo abituale, e annulla la toglie", () => {
    const prima = m.stato.get().sedute;
    const esito = m.eseguiAzione({ nome: "fissa_appuntamento", dati: { cliente: "paolo-costa", data: "2026-10-26", ora: "13:00", durata: 60, tipo: "Workout" } });
    expect(esito.ok).toBe(true);
    const nuova = m.stato.get().sedute.find((s) => s.clientId === "paolo-costa" && s.date === "2026-10-26" && s.time === "13:00")!;
    expect(nuova).toMatchObject({ place: "Fit Lab, Meolo", minutes: 60, type: "Workout" });
    expect(m.stato.get().focus).toMatchObject({ tipo: "fissa", id: nuova.id });
    if (esito.ok) esito.annulla?.();
    expect(m.stato.get().sedute).toEqual(prima);
  });

  it("sposta una seduta e annulla la riporta dov'era", () => {
    const s = seduta("sara-conti", "2026-10-22");
    const esito = m.eseguiAzione({ nome: "sposta_appuntamento", dati: { id: s.id, data: "2026-10-23", ora: "15:00" } });
    expect(esito.ok).toBe(true);
    expect(m.stato.get().sedute.find((x) => x.id === s.id)).toMatchObject({ date: "2026-10-23", time: "15:00", minutes: 60 });
    expect(m.stato.get().focus).toMatchObject({ tipo: "sposta", id: s.id, da: { date: "2026-10-22", time: "10:00" } });
    if (esito.ok) esito.annulla?.();
    expect(m.stato.get().sedute.find((x) => x.id === s.id)).toEqual(s);
  });

  it("cancella una seduta e annulla la rimette con lo stesso id", () => {
    const s = seduta("davide-greco", "2026-10-22");
    const esito = m.eseguiAzione({ nome: "cancella_appuntamento", dati: { id: s.id } });
    expect(m.stato.get().sedute.some((x) => x.id === s.id)).toBe(false);
    expect(m.stato.get().focus).toMatchObject({ tipo: "cancella", id: s.id });
    if (esito.ok) esito.annulla?.();
    expect(m.stato.get().sedute.find((x) => x.id === s.id)).toEqual(s);
  });

  it("annulla tocca solo la seduta di Leo, non le modifiche fatte a mano dopo", () => {
    const x = seduta("sara-conti", "2026-10-22");
    const y = seduta("davide-greco", "2026-10-22");
    const esito = m.eseguiAzione({ nome: "sposta_appuntamento", dati: { id: x.id, data: "2026-10-23", ora: "15:00" } });
    m.stato.removeSeduta(y.id);
    if (esito.ok) esito.annulla?.();
    expect(m.stato.get().sedute.find((s) => s.id === x.id)).toEqual(x);
    expect(m.stato.get().sedute.some((s) => s.id === y.id)).toBe(false);
  });

  it("annulla non rimette una seduta sopra un'altra fissata a mano nel frattempo", () => {
    const x = seduta("sara-conti", "2026-10-22");
    const esito = m.eseguiAzione({ nome: "sposta_appuntamento", dati: { id: x.id, data: "2026-10-23", ora: "15:00" } });
    m.stato.addSeduta({ clientId: "paolo-costa", date: "2026-10-22", time: "10:00", minutes: 60, type: "Workout", place: "Fit Lab, Meolo" });
    const annullato = esito.ok && esito.annulla ? esito.annulla() : null;
    expect(annullato).toEqual({ ok: false, motivo: "Si sovrappone con Paolo Costa alle 10:00" });
    expect(m.stato.get().sedute.find((s) => s.id === x.id)).toMatchObject({ date: "2026-10-23", time: "15:00" });
  });

  it("annulla di una cancellazione controlla anche lui le sovrapposizioni", () => {
    const y = seduta("davide-greco", "2026-10-22");
    const esito = m.eseguiAzione({ nome: "cancella_appuntamento", dati: { id: y.id } });
    m.stato.addSeduta({ clientId: "paolo-costa", date: y.date, time: y.time, minutes: 60, type: "Workout", place: "Fit Lab, Meolo" });
    const annullato = esito.ok && esito.annulla ? esito.annulla() : null;
    expect(annullato).toMatchObject({ ok: false });
    expect(m.stato.get().sedute.some((s) => s.id === y.id)).toBe(false);
  });

  it("scrive il messaggio nella conversazione del cliente, senza annulla", () => {
    const esito = m.eseguiAzione({ nome: "scrivi_messaggio", dati: { cliente: "sara-conti", testo: "Ciao Sara, ci vediamo venerdì" } });
    expect(esito).toEqual({ ok: true });
    expect(m.stato.get().threads["sara-conti"].at(-1)).toEqual({ from: "trainer", text: "Ciao Sara, ci vediamo venerdì", time: "Adesso" });
    expect(m.stato.get().focus).toMatchObject({ tipo: "messaggio", clientId: "sara-conti" });
  });

  it("se il controllo non passa non cambia niente", () => {
    const prima = m.stato.get();
    const giulia = seduta("giulia-bianchi", "2026-10-23");
    const azione: AzioneLeo = { nome: "fissa_appuntamento", dati: { cliente: "sara-conti", data: "2026-10-23", ora: giulia.time, durata: 60, tipo: "Workout" } };
    expect(m.eseguiAzione(azione)).toEqual({ ok: false, motivo: `Si sovrappone con Giulia Bianchi alle ${giulia.time}` });
    expect(m.stato.get().sedute).toBe(prima.sedute);
    expect(m.stato.get().focus).toBe(prima.focus);
  });
});
