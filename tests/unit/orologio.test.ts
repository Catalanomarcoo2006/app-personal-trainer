import { afterEach, describe, expect, it, vi } from "vitest";
import { adesso, giornoDi, impostaModo, indiceOggi, isoDi, oggi, piuGiorni } from "@/libs/orologio";
import { trainer } from "@/libs/prototipo/dati-finti";

afterEach(() => {
  impostaModo("demo");
  vi.useRealTimers();
});

describe("orologio", () => {
  it("demo: ferma a mercoledì 21 ottobre 2026, 10:20", () => {
    expect(oggi()).toBe("2026-10-21");
    expect(adesso()).toBe("10:20");
    expect(indiceOggi()).toBe(2);
    expect(isoDi(giornoDi(0, 0))).toBe("2026-10-19");
    expect(isoDi(giornoDi(1, 6))).toBe("2026-11-01");
    expect(trainer.today).toBe("21 Ottobre");
    expect(trainer.month).toBe("Ottobre 2026");
  });

  it("versione vera: giorno e ora di adesso in Italia", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-31T23:30:00Z")); // in Italia è già lunedì 1 febbraio, 00:30
    impostaModo("vera");
    expect(oggi()).toBe("2027-02-01");
    expect(adesso()).toBe("00:30");
    expect(indiceOggi()).toBe(0);
    expect(isoDi(giornoDi(0, 0))).toBe("2027-02-01");
    expect(isoDi(giornoDi(-1, 6))).toBe("2027-01-31");
    expect(trainer.month).toBe("Febbraio 2027");
  });

  it("piuGiorni attraversa i mesi", () => {
    expect(piuGiorni("2026-10-31", 1)).toBe("2026-11-01");
    expect(piuGiorni("2026-03-01", -1)).toBe("2026-02-28");
  });
});
