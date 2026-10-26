import { describe, expect, it } from "vitest";
import { contornoOnda, formeOnda } from "@/libs/ui/onda";

// punto dentro un poligono (contorno campionato dell'onda)
function dentro(p: { x: number; y: number }, poli: { x: number; y: number }[]): boolean {
  let ok = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const a = poli[i];
    const b = poli[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) ok = !ok;
  }
  return ok;
}

const SCHERMI = [
  { w: 1440, h: 900, x: 1380, y: 40 }, // tasto del tema in alto a destra
  { w: 1440, h: 900, x: 60, y: 860 },
  { w: 1440, h: 900, x: 720, y: 450 }, // dal centro (Leo senza punto di partenza)
  { w: 390, h: 844, x: 350, y: 60 }, // telefono
];

describe("formeOnda", () => {
  it("tutte le forme hanno la stessa struttura (il browser le anima una nell'altra)", () => {
    for (const s of SCHERMI) {
      const forme = formeOnda(s.w, s.h, { x: s.x, y: s.y });
      expect(forme.length).toBeGreaterThan(8);
      const struttura = forme.map((f) => f.replace(/-?\d+(\.\d+)?/g, "#"));
      expect(new Set(struttura).size).toBe(1);
      for (const f of forme) expect(f).toMatch(/^path\('M .* Z'\)$/);
    }
  });

  it("all'inizio è una goccia piccola attorno al punto toccato", () => {
    for (const s of SCHERMI) {
      const primo = contornoOnda(s.w, s.h, { x: s.x, y: s.y }, 0.05);
      const r = Math.max(...primo.map((p) => Math.hypot(p.x - s.x, p.y - s.y)));
      expect(r).toBeLessThan(Math.min(s.w, s.h) * 0.15);
    }
  });

  it("alla fine copre tutto lo schermo, angoli compresi", () => {
    for (const s of SCHERMI) {
      const ultimo = contornoOnda(s.w, s.h, { x: s.x, y: s.y }, 1);
      for (const angolo of [
        { x: 0, y: 0 },
        { x: s.w, y: 0 },
        { x: 0, y: s.h },
        { x: s.w, y: s.h },
        { x: s.w / 2, y: s.h / 2 },
      ])
        expect(dentro(angolo, ultimo)).toBe(true);
    }
  });

  it("a metà il fronte non ha ancora raggiunto l'angolo più lontano", () => {
    const s = SCHERMI[0];
    const meta = contornoOnda(s.w, s.h, { x: s.x, y: s.y }, 0.4);
    expect(dentro({ x: s.x, y: s.y }, meta)).toBe(true);
    expect(dentro({ x: 0, y: s.h }, meta)).toBe(false);
  });
});
