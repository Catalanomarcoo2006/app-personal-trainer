import { describe, expect, it } from "vitest";
import { crepe, IMPATTO, schegge } from "@/libs/ui/vetro";

// i punti di un clip-path "polygon(10% 20%, ...)"
const punti = (clip: string) =>
  clip
    .slice(8, -1)
    .split(", ")
    .map((c) => {
      const [x, y] = c.split(" ").map((v) => parseFloat(v));
      return { x, y };
    });

// area con la formula del laccio
const area = (p: { x: number; y: number }[]) => Math.abs(p.reduce((s, a, i) => s + a.x * p[(i + 1) % p.length].y - p[(i + 1) % p.length].x * a.y, 0)) / 2;

describe("vetro che si rompe", () => {
  it("le schegge coprono tutta la seduta, senza buchi né sovrapposizioni", () => {
    const totale = schegge().reduce((s, sc) => s + area(punti(sc.clip)), 0);
    expect(totale).toBeCloseTo(100 * 100, 0);
  });

  it("ogni scheggia sta dentro la seduta", () => {
    for (const sc of schegge()) for (const p of punti(sc.clip)) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(100);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(100);
    }
  });

  it("le schegge volano via dall'impatto e cadono tutte verso il basso", () => {
    for (const sc of schegge()) {
      expect(Math.sign(sc.x)).toBe(Math.sign(sc.centro.x - IMPATTO.x));
      expect(sc.caduta).toBeGreaterThan(0);
    }
  });

  it("le interne partono prima delle esterne dello stesso spicchio", () => {
    const tutte = schegge();
    for (let i = 0; i < tutte.length; i += 2) expect(tutte[i].ritardo).toBeLessThan(tutte[i + 1].ritardo);
  });

  it("una crepa per ogni punto del bordo, più l'anello chiuso", () => {
    const c = crepe();
    expect(c.raggi).toHaveLength(schegge().length / 2);
    expect(c.raggi.every((d) => d.startsWith(`M${IMPATTO.x} ${IMPATTO.y} L`))).toBe(true);
    expect(c.anello.endsWith("Z")).toBe(true);
  });
});
