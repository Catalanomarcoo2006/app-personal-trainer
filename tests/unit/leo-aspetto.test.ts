import { beforeEach, describe, expect, it, vi } from "vitest";

async function carica() {
  vi.resetModules();
  const { stato } = await import("@/libs/prototipo/stato");
  const az = await import("@/libs/prototipo/leo-azioni");
  const { eseguiAzione, datiLeo } = await import("@/libs/prototipo/leo-esegui");
  const aspetto = await import("@/libs/dati/aspetto");
  const { coloreDa } = await import("@/libs/ui/colori");
  return { stato, az, eseguiAzione, datiLeo, aspetto, coloreDa };
}

let m: Awaited<ReturnType<typeof carica>>;
beforeEach(async () => {
  m = await carica();
});

// Un'app finta: colore, tema e suoni in variabili.
function ponteFinto() {
  const ora = { colore: "#ff6b2c", tema: "light" as "light" | "dark", suoni: true };
  m.aspetto.registraAspetto({
    leggi: () => ({ ...ora }),
    setAccent: (c) => (ora.colore = c),
    setTheme: (t) => (ora.tema = t),
    setSuoni: (s) => (ora.suoni = s),
  });
  return ora;
}

describe("colori", () => {
  it("dal nome al colore del marchio", () => {
    expect(m.coloreDa("blu")).toBe("#2f7dac");
    expect(m.coloreDa("Verde acqua")).toBe("#0f9d8a");
    expect(m.coloreDa("rosa")).toBe("#d6409f");
    expect(m.coloreDa("#123456")).toBe("#123456");
    expect(m.coloreDa("#12345")).toBeNull();
    expect(m.coloreDa("arcobaleno")).toBeNull();
  });
});

describe("cambia_aspetto", () => {
  it("lo schema traduce il nome del colore e il tema, anche rileggendo l'azione", () => {
    const a = m.az.leggiAzione("cambia_aspetto", { colore: "blu", tema: "scuro" })!;
    expect(a).toEqual({ nome: "cambia_aspetto", dati: { colore: "#2f7dac", tema: "scuro" } });
    expect(m.az.leggiAzione(a.nome, a.dati)).toEqual(a);
    expect(m.az.leggiAzione("cambia_aspetto", { colore: "arcobaleno" })).toBeNull();
  });

  it("parte subito con Annulla", () => {
    expect(m.az.daConfermare({ nome: "cambia_aspetto", dati: { tema: "scuro" } })).toBe(false);
    expect(m.az.daConfermare({ nome: "imposta_notifiche", dati: { tipo: "riepilogo", attiva: true } })).toBe(false);
  });

  it("cambia colore, tema e suoni; annulla rimette com'era", async () => {
    const ora = ponteFinto();
    const esito = await m.eseguiAzione({ nome: "cambia_aspetto", dati: { colore: "#2f7dac", tema: "scuro", suoni: false } });
    expect(ora).toEqual({ colore: "#2f7dac", tema: "dark", suoni: false });
    if (esito.ok) await esito.annulla?.();
    expect(ora).toEqual({ colore: "#ff6b2c", tema: "light", suoni: true });
  });

  it("senza niente da cambiare o senza app collegata non parte", async () => {
    expect(m.az.verificaAzione({ nome: "cambia_aspetto", dati: {} }, m.datiLeo())).toEqual({ ok: false, motivo: "Niente da cambiare" });
    expect(await m.eseguiAzione({ nome: "cambia_aspetto", dati: { tema: "scuro" } })).toEqual({ ok: false, motivo: "Impostazioni non disponibili" });
  });
});

describe("imposta_notifiche", () => {
  it("accende una notifica; annulla la rispegne", async () => {
    const esito = await m.eseguiAzione({ nome: "imposta_notifiche", dati: { tipo: "riepilogo", attiva: true } });
    expect(m.stato.get().dati.notifiche.riepilogo).toBe(true);
    expect(m.stato.get().focus).toMatchObject({ tipo: "notifica" });
    if (esito.ok) await esito.annulla?.();
    expect(m.stato.get().dati.notifiche.riepilogo).toBe(false);
  });

  it("tipi sconosciuti non passano", () => {
    expect(m.az.leggiAzione("imposta_notifiche", { tipo: "fuochi", attiva: true })).toBeNull();
  });
});
