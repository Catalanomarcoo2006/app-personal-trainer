import { describe, expect, it, vi } from "vitest";
import { creaArchivioScelta } from "@/libs/prototipo/leo-voce-scelta";

const magazzinoFinto = (iniziale: Record<string, string> = {}) => {
  const dati = new Map(Object.entries(iniziale));
  return {
    dati,
    getItem: (k: string) => dati.get(k) ?? null,
    setItem: (k: string, v: string): void => void dati.set(k, v),
    removeItem: (k: string): void => void dati.delete(k),
  };
};

describe("scelta dei vocali", () => {
  it("parte senza scelta, poi si ricorda", () => {
    const m = magazzinoFinto();
    const a = creaArchivioScelta(m);
    expect(a.leggi()).toBeNull();
    a.scrivi("subito");
    expect(a.leggi()).toBe("subito");
    expect(m.dati.get("leo-vocali")).toBe("subito");
  });

  it("si ritrova al ricaricamento (un archivio nuovo sullo stesso magazzino)", () => {
    const m = magazzinoFinto({ "leo-vocali": "rivedi" });
    expect(creaArchivioScelta(m).leggi()).toBe("rivedi");
  });

  it("un valore sconosciuto vale come non scelto", () => {
    expect(creaArchivioScelta(magazzinoFinto({ "leo-vocali": "boh" })).leggi()).toBeNull();
  });

  it("scrivere null toglie la scelta", () => {
    const m = magazzinoFinto({ "leo-vocali": "subito" });
    const a = creaArchivioScelta(m);
    a.scrivi(null);
    expect(a.leggi()).toBeNull();
    expect(m.dati.has("leo-vocali")).toBe(false);
  });

  it("avvisa chi è iscritto a ogni cambio, e non più dopo la disiscrizione", () => {
    const a = creaArchivioScelta(magazzinoFinto());
    const ascolta = vi.fn();
    const via = a.iscriviti(ascolta);
    a.scrivi("subito");
    a.scrivi("rivedi");
    expect(ascolta).toHaveBeenCalledTimes(2);
    via();
    a.scrivi("subito");
    expect(ascolta).toHaveBeenCalledTimes(2);
  });

  it("con il magazzino non disponibile (navigazione privata) non si rompe e la scelta vale per la pagina", () => {
    const rotto = {
      getItem: () => {
        throw new Error("storage bloccato");
      },
      setItem: () => {
        throw new Error("storage bloccato");
      },
      removeItem: () => {
        throw new Error("storage bloccato");
      },
    };
    const a = creaArchivioScelta(rotto);
    expect(a.leggi()).toBeNull();
    a.scrivi("rivedi");
    expect(a.leggi()).toBe("rivedi");
    a.scrivi(null);
    expect(a.leggi()).toBeNull();
  });

  it("senza magazzino (lato server) funziona in memoria", () => {
    const a = creaArchivioScelta(undefined);
    expect(a.leggi()).toBeNull();
    a.scrivi("subito");
    expect(a.leggi()).toBe("subito");
  });
});
