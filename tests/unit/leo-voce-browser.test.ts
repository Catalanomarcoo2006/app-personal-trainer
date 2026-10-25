import { afterEach, describe, expect, it, vi } from "vitest";
import { VoceErrore } from "@/libs/prototipo/leo-voce";
import { dettaturaDisponibile, erroreDaBrowser, testoDaRisultati, trascrittoreBrowser } from "@/libs/prototipo/leo-voce-browser";

// Un riconoscitore finto, con i gestori che il browser richiama: il test li fa scattare a mano.
class Finto {
  static ultimo: Finto;
  continuous = false;
  interimResults = false;
  lang = "";
  onstart: (() => void) | null = null;
  onresult: ((e: { results: { transcript: string }[][] }) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn(() => queueMicrotask(() => this.onend?.()));
  abort = vi.fn();
  constructor() {
    Finto.ultimo = this;
  }
  risultati(...frasi: string[]) {
    this.onresult?.({ results: frasi.map((transcript) => [{ transcript }]) });
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("funzioni pure", () => {
  it("traduce i codici d'errore del browser", () => {
    expect(erroreDaBrowser("not-allowed")).toBe("permesso");
    expect(erroreDaBrowser("service-not-allowed")).toBe("permesso");
    expect(erroreDaBrowser("audio-capture")).toBe("nessun-microfono");
    expect(erroreDaBrowser("no-speech")).toBe("nessuna-voce");
    expect(erroreDaBrowser("language-not-supported")).toBe("non-supportato");
    for (const c of ["network", "aborted", "qualcosa-di-nuovo"]) expect(erroreDaBrowser(c)).toBe("interrotto");
  });

  it("unisce i pezzi riconosciuti in una frase sola", () => {
    expect(testoDaRisultati([[{ transcript: " Luca ha pagato" }], [{ transcript: " e Sara 77 kg" }]])).toBe("Luca ha pagato e Sara 77 kg");
    expect(testoDaRisultati([])).toBe("");
  });
});

describe("trascrittore del browser", () => {
  it("senza dettatura nel browser: non disponibile e avvia rifiuta", async () => {
    expect(dettaturaDisponibile()).toBe(false);
    await expect(trascrittoreBrowser().avvia(() => {})).rejects.toMatchObject({ codice: "non-supportato" });
  });

  it("il flusso normale: testo dal vivo, poi il testo finale", async () => {
    vi.stubGlobal("SpeechRecognition", Finto);
    expect(dettaturaDisponibile()).toBe(true);
    const t = trascrittoreBrowser();
    const dalVivo: string[] = [];
    const partito = t.avvia((x) => dalVivo.push(x));
    const r = Finto.ultimo;
    expect(r.lang).toBe("it-IT");
    expect(r.interimResults).toBe(true);
    expect(r.continuous).toBe(true);
    expect(r.start).toHaveBeenCalledTimes(1);
    r.onstart?.();
    await partito;
    r.risultati("Luca ha pagato");
    r.risultati("Luca ha pagato", "e Sara 77 kg");
    expect(dalVivo).toEqual(["Luca ha pagato", "Luca ha pagato e Sara 77 kg"]);
    await expect(t.ferma()).resolves.toEqual({ testo: "Luca ha pagato e Sara 77 kg", parziale: false });
    expect(r.stop).toHaveBeenCalledTimes(1);
  });

  it("permesso negato prima dell'avvio: avvia rifiuta con 'permesso'", async () => {
    vi.stubGlobal("SpeechRecognition", Finto);
    const partito = trascrittoreBrowser().avvia(() => {});
    Finto.ultimo.onerror?.({ error: "not-allowed" });
    const errore = await partito.catch((e: unknown) => e);
    expect(errore).toBeInstanceOf(VoceErrore);
    expect(errore).toMatchObject({ codice: "permesso" });
  });

  it("la rete cade dopo del testo: il testo arriva, segnato come parziale", async () => {
    vi.stubGlobal("SpeechRecognition", Finto);
    const t = trascrittoreBrowser();
    const partito = t.avvia(() => {});
    const r = Finto.ultimo;
    r.onstart?.();
    await partito;
    r.risultati("Sposta Davide a domani");
    r.onerror?.({ error: "network" });
    r.onend?.();
    await expect(t.ferma()).resolves.toEqual({ testo: "Sposta Davide a domani", parziale: true });
  });

  it("la rete cade senza testo: ferma rifiuta con 'interrotto'", async () => {
    vi.stubGlobal("SpeechRecognition", Finto);
    const t = trascrittoreBrowser();
    const partito = t.avvia(() => {});
    const r = Finto.ultimo;
    r.onstart?.();
    await partito;
    r.onerror?.({ error: "network" });
    r.onend?.();
    await expect(t.ferma()).rejects.toMatchObject({ codice: "interrotto" });
  });

  it("nessuna voce: testo vuoto, non è un errore", async () => {
    vi.stubGlobal("SpeechRecognition", Finto);
    const t = trascrittoreBrowser();
    const partito = t.avvia(() => {});
    const r = Finto.ultimo;
    r.onstart?.();
    await partito;
    r.onerror?.({ error: "no-speech" });
    await expect(t.ferma()).resolves.toEqual({ testo: "", parziale: false });
  });

  it("annulla: abort, e quello che arriva dopo si ignora", async () => {
    vi.stubGlobal("SpeechRecognition", Finto);
    const t = trascrittoreBrowser();
    const dalVivo: string[] = [];
    const partito = t.avvia((x) => dalVivo.push(x));
    const r = Finto.ultimo;
    r.onstart?.();
    await partito;
    t.annulla();
    expect(r.abort).toHaveBeenCalledTimes(1);
    r.risultati("troppo tardi");
    expect(dalVivo).toEqual([]);
  });
});
