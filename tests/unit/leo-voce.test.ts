import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cosaFare, creaSessioneVoce, messaggioErrore, unisciTesto, VoceErrore, type Dettato, type StatoVoce, type Trascrittore } from "@/libs/prototipo/leo-voce";

// Un trascrittore finto: tiene l'ultimo onTesto e permette di ritardare o far fallire avvia e ferma.
function finto(opz: { testo?: string; parziale?: boolean; avvia?: Promise<void>; ferma?: Promise<Dettato> } = {}) {
  let onTesto: (t: string) => void = () => {};
  const t: Trascrittore = {
    avvia: vi.fn((f) => {
      onTesto = f;
      return opz.avvia ?? Promise.resolve();
    }),
    ferma: vi.fn(() => opz.ferma ?? Promise.resolve({ testo: opz.testo ?? "Luca ha pagato", parziale: opz.parziale ?? false })),
    annulla: vi.fn(),
  };
  return { t, scrivi: (testo: string) => onTesto(testo) };
}

function sessione(t: Trascrittore, maxMs?: number) {
  const stati: StatoVoce[] = [];
  const onFine = vi.fn<(d: Dettato | null) => void>();
  const s = creaSessioneVoce(t, { onStato: (x) => stati.push(x), onFine, maxMs });
  return { s, stati, onFine, ultimo: () => stati[stati.length - 1] };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("sessione del vocale", () => {
  it("premi: prima il microfono si accende, poi si ascolta e il testo arriva dal vivo", async () => {
    const { t, scrivi } = finto();
    const { s, stati, ultimo } = sessione(t);
    await s.premi();
    expect(stati[0]).toEqual({ fase: "preparazione", testo: "", errore: null });
    expect(stati[1]).toEqual({ fase: "in-ascolto", testo: "", errore: null });
    scrivi("Luca ha pagato");
    expect(ultimo()).toEqual({ fase: "in-ascolto", testo: "Luca ha pagato", errore: null });
  });

  it("lascia: ferma una volta e consegna il testo senza spazi ai bordi", async () => {
    const { t } = finto({ testo: "  Luca ha pagato " });
    const { s, onFine, ultimo } = sessione(t);
    await s.premi();
    await s.lascia();
    expect(t.ferma).toHaveBeenCalledTimes(1);
    expect(onFine).toHaveBeenCalledWith({ testo: "Luca ha pagato", parziale: false });
    expect(ultimo()).toMatchObject({ fase: "fermo", errore: null });
  });

  it("senza voce (tocco velocissimo): niente testo e 'nessuna voce'", async () => {
    const { t } = finto({ testo: "   " });
    const { s, onFine, ultimo } = sessione(t);
    await s.premi();
    await s.lascia();
    expect(onFine).toHaveBeenCalledWith(null);
    expect(ultimo()).toEqual({ fase: "fermo", testo: "", errore: "nessuna-voce" });
  });

  it("permesso negato: errore, e lascia dopo non chiama ferma", async () => {
    const { t } = finto({ avvia: Promise.reject(new VoceErrore("permesso")) });
    const { s, onFine, ultimo } = sessione(t);
    await s.premi();
    expect(ultimo()).toMatchObject({ fase: "fermo", errore: "permesso" });
    await s.lascia();
    expect(t.ferma).not.toHaveBeenCalled();
    expect(onFine).toHaveBeenCalledWith(null);
  });

  it("lascia mentre il microfono si sta ancora accendendo: si annulla e dice di tenere premuto", async () => {
    let ok!: () => void;
    const { t } = finto({ avvia: new Promise<void>((r) => (ok = r)) });
    const { s, onFine, ultimo } = sessione(t);
    const premuto = s.premi();
    expect(ultimo().fase).toBe("preparazione");
    await s.lascia();
    expect(t.annulla).toHaveBeenCalledTimes(1);
    expect(t.ferma).not.toHaveBeenCalled();
    expect(onFine).toHaveBeenCalledWith(null);
    expect(ultimo()).toEqual({ fase: "fermo", testo: "", errore: "troppo-presto" });
    ok(); // il microfono si accende dopo: non cambia più niente
    await premuto;
    expect(ultimo()).toEqual({ fase: "fermo", testo: "", errore: "troppo-presto" });
    expect(onFine).toHaveBeenCalledTimes(1);
  });

  it("lascia presto e poi il permesso risulta negato: nessun blocco in ascolto, l'esito resta 'troppo presto'", async () => {
    let no!: (e: unknown) => void;
    const { t } = finto({ avvia: new Promise<void>((_, r) => (no = r)) });
    const { s, onFine, ultimo } = sessione(t);
    const premuto = s.premi();
    await s.lascia();
    no(new VoceErrore("permesso"));
    await premuto;
    expect(t.ferma).not.toHaveBeenCalled();
    expect(onFine).toHaveBeenCalledTimes(1);
    expect(ultimo()).toMatchObject({ fase: "fermo", errore: "troppo-presto" });
  });

  it("annulla: butta tutto, ignora il testo che arriva dopo e lascia non fa niente", async () => {
    const { t, scrivi } = finto();
    const { s, onFine, ultimo } = sessione(t);
    await s.premi();
    scrivi("Segna pagato");
    s.annulla();
    expect(t.annulla).toHaveBeenCalledTimes(1);
    expect(ultimo()).toEqual({ fase: "fermo", testo: "", errore: null });
    const prima = ultimo();
    scrivi("troppo tardi");
    expect(ultimo()).toBe(prima);
    await s.lascia();
    expect(onFine).not.toHaveBeenCalled();
    expect(t.ferma).not.toHaveBeenCalled();
  });

  it("premi mentre è già in ascolto: si avvia una volta sola", async () => {
    const { t } = finto();
    const { s } = sessione(t);
    await s.premi();
    await s.premi();
    expect(t.avvia).toHaveBeenCalledTimes(1);
  });

  it("dopo il tempo massimo si ferma da solo, come se si lasciasse", async () => {
    const { t } = finto();
    const { s, onFine } = sessione(t, 1000);
    await s.premi();
    await vi.advanceTimersByTimeAsync(1000);
    expect(t.ferma).toHaveBeenCalledTimes(1);
    expect(onFine).toHaveBeenCalledWith({ testo: "Luca ha pagato", parziale: false });
  });

  it("se ferma si interrompe: errore 'interrotto' e niente testo", async () => {
    const { t } = finto({ ferma: Promise.reject(new VoceErrore("interrotto")) });
    const { s, onFine, ultimo } = sessione(t);
    await s.premi();
    await s.lascia();
    expect(onFine).toHaveBeenCalledWith(null);
    expect(ultimo()).toMatchObject({ fase: "fermo", errore: "interrotto" });
  });

  it("un vocale parziale arriva con parziale: true", async () => {
    const { t } = finto({ parziale: true });
    const { s, onFine } = sessione(t);
    await s.premi();
    await s.lascia();
    expect(onFine).toHaveBeenCalledWith({ testo: "Luca ha pagato", parziale: true });
  });
});

describe("cosa fare del testo", () => {
  const intero: Dettato = { testo: "x", parziale: false };
  it("segue la scelta del trainer", () => {
    expect(cosaFare("subito", intero, false)).toBe("invia");
    expect(cosaFare("rivedi", intero, false)).toBe("rivedi");
    expect(cosaFare(null, intero, false)).toBe("chiedi");
  });
  it("un vocale interrotto va sempre riletto", () => {
    for (const s of ["subito", "rivedi", null] as const) expect(cosaFare(s, { testo: "x", parziale: true }, false)).toBe("rivedi");
  });
  it("con del testo già scritto non si manda mai un testo misto", () => {
    for (const s of ["subito", "rivedi", null] as const) expect(cosaFare(s, intero, true)).toBe("rivedi");
  });
});

describe("testi", () => {
  it("unisciTesto non perde quello che c'era", () => {
    expect(unisciTesto("", "ciao")).toBe("ciao");
    expect(unisciTesto("Segna 77 kg ", "a Sara")).toBe("Segna 77 kg a Sara");
  });
  it("messaggi d'errore", () => {
    expect(messaggioErrore("permesso")).toBe("Serve il permesso del microfono: abilitalo dal lucchetto vicino all'indirizzo");
    expect(messaggioErrore("nessun-microfono")).toBe("Non trovo un microfono");
    expect(messaggioErrore("nessuna-voce")).toBe("Non ho sentito niente: aspetta che il microfono sia acceso e parla tenendo premuto");
    expect(messaggioErrore("troppo-presto")).toBe("Tieni premuto finché il microfono si accende, poi parla");
    expect(messaggioErrore("non-supportato")).toBe("Questo browser non ascolta la voce: prova con Chrome o Edge");
    expect(messaggioErrore("interrotto")).toBe("Il vocale si è interrotto: controlla il testo prima di mandarlo");
  });
});
