import { describe, expect, it, vi } from "vitest";
import { creaFila } from "@/libs/prototipo/leo-fila";

describe("fila dei viaggi di Leo", () => {
  it("esegue i lavori uno alla volta, in ordine", async () => {
    const fatti: number[] = [];
    const fila = creaFila(() => {});
    fila.aggiungi(async () => {
      await new Promise((r) => setTimeout(r, 20));
      fatti.push(1);
    });
    await fila.aggiungi(async () => {
      fatti.push(2);
    });
    expect(fatti).toEqual([1, 2]);
  });

  it("un errore non blocca la fila: lo segnala e il lavoro dopo parte lo stesso", async () => {
    const onErrore = vi.fn();
    const fila = creaFila(onErrore);
    fila.aggiungi(async () => {
      throw new Error("animazione rotta");
    });
    const dopo = vi.fn();
    await fila.aggiungi(async () => dopo());
    expect(onErrore).toHaveBeenCalledTimes(1);
    expect(dopo).toHaveBeenCalled();
  });

  it("con i timer finti: il secondo lavoro aspetta che il primo finisca la sua attesa", async () => {
    vi.useFakeTimers();
    try {
      const fatti: string[] = [];
      const fila = creaFila(() => {});
      void fila.aggiungi(async () => {
        fatti.push("primo parte");
        await new Promise((r) => setTimeout(r, 1000));
        fatti.push("primo finisce");
      });
      const secondo = fila.aggiungi(async () => {
        fatti.push("secondo");
      });
      await vi.advanceTimersByTimeAsync(999);
      expect(fatti).toEqual(["primo parte"]);
      await vi.advanceTimersByTimeAsync(1);
      await secondo;
      expect(fatti).toEqual(["primo parte", "primo finisce", "secondo"]);
    } finally {
      vi.useRealTimers();
    }
  });
});
