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
});
