import { describe, expect, it } from "vitest";
import { cambioAllenamento, spunteIniziali } from "@/components/prototipo/cliente/spunte";

describe("spunte dell'allenamento di oggi", () => {
  it("versione vera: si parte da nessuna spunta, o da tutte se oggi è già segnato", () => {
    expect(spunteIniziali(false).slice(0, 3)).toEqual([]);
    expect(spunteIniziali(true).slice(0, 5)).toEqual([true, true, true, true, true]);
  });

  it("l'allenamento si salva quando diventa completo, si toglie quando smette di esserlo", () => {
    expect(cambioAllenamento([true, false], [true, true])).toBe(true);
    expect(cambioAllenamento([true, true], [true, false])).toBe(false);
    expect(cambioAllenamento([false, false], [true, false])).toBeNull();
    expect(cambioAllenamento([], [])).toBeNull();
  });
});
