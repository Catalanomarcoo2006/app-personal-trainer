import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { avviaRicarica } from "@/libs/vera/ricarica";
import { avviaSalvataggio } from "@/libs/vera/salva";
import type { StatoApp } from "@/libs/prototipo/stato";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const giro = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms);
};

describe("rilettura dei dati dal database", () => {
  it("non legge finché nessuno la chiede; poi legge una volta sola e applica", async () => {
    const leggi = vi.fn(async () => ({ n: 1 }));
    const applica = vi.fn();
    const r = avviaRicarica({ leggi, applica, libero: () => true, visibile: () => true });
    await giro(2000);
    expect(leggi).not.toHaveBeenCalled();
    r.richiedi();
    r.richiedi();
    await giro(1000);
    expect(leggi).toHaveBeenCalledTimes(1);
    expect(applica).toHaveBeenCalledWith({ n: 1 });
    await giro(5000);
    expect(leggi).toHaveBeenCalledTimes(1);
    r.ferma();
  });

  it("aspetta che sia libero: se qualcuno sta scrivendo non legge, poi legge", async () => {
    let libero = false;
    const leggi = vi.fn(async () => ({ n: 2 }));
    const applica = vi.fn();
    const r = avviaRicarica({ leggi, applica, libero: () => libero, visibile: () => true });
    r.richiedi();
    await giro(3000);
    expect(leggi).not.toHaveBeenCalled();
    libero = true;
    await giro(1000);
    expect(applica).toHaveBeenCalledWith({ n: 2 });
    r.ferma();
  });

  it("se mentre legge qualcuno comincia a scrivere, butta la lettura vecchia e la rifà", async () => {
    let libero = true;
    let n = 0;
    const leggi = vi.fn(async () => {
      n++;
      if (n === 1) libero = false; // durante la prima lettura qualcuno scrive
      return { n };
    });
    const applica = vi.fn();
    const r = avviaRicarica({ leggi, applica, libero: () => libero, visibile: () => true });
    r.richiedi();
    await giro(1000);
    expect(applica).not.toHaveBeenCalled();
    libero = true;
    await giro(1000);
    expect(applica).toHaveBeenCalledTimes(1);
    expect(applica).toHaveBeenCalledWith({ n: 2 });
    r.ferma();
  });

  it("da sola ogni tanto (se la connessione dal vivo cade i dati arrivano lo stesso), ma non a pagina nascosta", async () => {
    let visibile = false;
    const leggi = vi.fn(async () => ({ n: 3 }));
    const r = avviaRicarica({ leggi, applica: vi.fn(), libero: () => true, visibile: () => visibile, periodico: 10_000 });
    await giro(25_000);
    expect(leggi).not.toHaveBeenCalled();
    visibile = true;
    await giro(11_000);
    expect(leggi).toHaveBeenCalledTimes(1);
    r.ferma();
  });

  it("un errore di rete non ferma niente: si riprova alla volta dopo", async () => {
    const leggi = vi.fn().mockRejectedValueOnce(new Error("rete")).mockResolvedValue({ n: 4 });
    const applica = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const r = avviaRicarica({ leggi, applica, libero: () => true, visibile: () => true, periodico: 5000 });
    r.richiedi();
    await giro(1000);
    expect(applica).not.toHaveBeenCalled();
    await giro(6000);
    expect(applica).toHaveBeenCalledWith({ n: 4 });
    r.ferma();
  });

  it("fermata: non legge più", async () => {
    const leggi = vi.fn(async () => ({ n: 5 }));
    const r = avviaRicarica({ leggi, applica: vi.fn(), libero: () => true, visibile: () => true });
    r.ferma();
    r.richiedi();
    await giro(3000);
    expect(leggi).not.toHaveBeenCalled();
  });
});

describe("il salvataggio e le letture dal database", () => {
  const vuoto = { dati: { clienti: [], pacchetti: [], pagamenti: [], misure: [], notifiche: {} }, sedute: [], threads: {}, plans: {}, videos: {} } as unknown as Pick<StatoApp, "dati" | "sedute" | "threads" | "plans" | "videos">;

  function crea() {
    let stato = vuoto;
    const ascoltatori = new Set<() => void>();
    const s = avviaSalvataggio({
      db: {} as never,
      ruolo: { tipo: "trainer", trainerId: "t1" },
      leggi: () => stato,
      ascolta: (f) => {
        ascoltatori.add(f);
        return () => ascoltatori.delete(f);
      },
      errore: vi.fn(),
      attesa: 500,
    });
    const cambia = (nuovo: typeof vuoto) => {
      stato = nuovo;
      ascoltatori.forEach((f) => f());
    };
    return { s, cambia };
  }

  it("occupato: c'è un cambiamento da salvare; libero solo dopo", async () => {
    const { s, cambia } = crea();
    expect(s.occupato()).toBe(false);
    cambia({ ...vuoto, videos: { squat: "https://youtu.be/a" } });
    expect(s.occupato()).toBe(true);
    s.smetti();
  });

  it("i dati arrivati dal database si applicano senza essere riscritti, e il salvataggio non si accende", async () => {
    const { s, cambia } = crea();
    const arrivati = { ...vuoto, videos: { squat: "https://youtu.be/b" } };
    s.applicaDalDatabase(() => cambia(arrivati));
    expect(s.occupato()).toBe(false); // nessun salvataggio in coda
    // un cambiamento vero dopo, invece, si salva (e non c'è una scrittura del video appena arrivato)
    cambia({ ...arrivati, videos: { squat: "https://youtu.be/b", panca: "https://youtu.be/c" } });
    expect(s.occupato()).toBe(true);
    s.smetti();
  });
});
