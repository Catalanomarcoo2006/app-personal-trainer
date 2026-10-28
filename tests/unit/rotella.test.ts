import { describe, expect, it } from "vitest";
import { componiOra, distanza, indiceDa, minutiDi, ORE, RIGA, separaOra } from "@/libs/ui/rotella";

describe("rotella dell'orario", () => {
  it("ore da 0 a 23 e minuti a passi di 5", () => {
    expect(ORE).toHaveLength(24);
    expect(minutiDi(30)).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  });

  it("un minuto fuori dai passi resta tra le voci, al suo posto", () => {
    const m = minutiDi(17);
    expect(m).toContain(17);
    expect(m.indexOf(17)).toBe(m.indexOf(15) + 1);
  });

  it("legge e scrive l'orario come HH:MM", () => {
    expect(separaOra("07:05")).toEqual({ h: 7, m: 5 });
    expect(separaOra("18:30")).toEqual({ h: 18, m: 30 });
    expect(separaOra("")).toEqual({ h: 9, m: 0 }); // vuoto: un orario normale, non NaN
    expect(componiOra(7, 5)).toBe("07:05");
  });

  it("da quanto si è scorso alla voce al centro, senza uscire dalla lista", () => {
    expect(indiceDa(0, 24)).toBe(0);
    expect(indiceDa(RIGA * 3, 24)).toBe(3);
    expect(indiceDa(RIGA * 3 + RIGA * 0.4, 24)).toBe(3);
    expect(indiceDa(RIGA * 3 + RIGA * 0.6, 24)).toBe(4);
    expect(indiceDa(-50, 24)).toBe(0);
    expect(indiceDa(RIGA * 99, 24)).toBe(23);
  });

  it("la distanza dal centro vale 0 sulla voce scelta e cresce allontanandosi", () => {
    expect(distanza(3, RIGA * 3)).toBe(0);
    expect(distanza(5, RIGA * 3)).toBe(2);
    expect(distanza(1, RIGA * 3)).toBe(2);
  });
});
