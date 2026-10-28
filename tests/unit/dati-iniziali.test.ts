import { describe, expect, it } from "vitest";
import { dataDaBreve, datiIniziali } from "@/libs/dati/iniziali";
import { clients } from "@/libs/prototipo/dati-finti";

const d = datiIniziali();
const pagamentiDi = (id: string) => d.pagamenti.filter((p) => p.clientId === id);
const pacchettoDi = (id: string) => d.pacchetti.find((p) => p.clientId === id)!;
const misureDi = (id: string) => d.misure.filter((m) => m.clientId === id);

describe("dataDaBreve", () => {
  it("dal giorno e mese della demo alla data completa", () => {
    expect(dataDaBreve("07 Set")).toBe("2026-09-07");
    expect(dataDaBreve("03 Ott")).toBe("2026-10-03");
    expect(dataDaBreve("02 Giu")).toBe("2026-06-02");
  });
});

describe("datiIniziali", () => {
  it("pagamenti in centesimi, con id unici e da incassare quando non pagati", () => {
    const ids = d.pagamenti.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^P\d+$/.test(id))).toBe(true);
    const antonella = pagamentiDi("antonella-russo");
    expect(antonella).toHaveLength(2);
    expect(antonella[0]).toMatchObject({ description: "Pacchetto 10 lezioni", amountCents: 45000, paidOn: "2026-09-07" });
    expect(antonella[1]).toMatchObject({ description: "Valutazione posturale", amountCents: 4000, paidOn: null, dueOn: "2026-10-03" });
  });

  it("pacchetti strutturati, a lezioni o a tempo", () => {
    expect(pacchettoDi("giulia-bianchi")).toMatchObject({ kind: "lessons", lessonsTotal: 10, lessonsUsed: 8, endsOn: null });
    expect(pacchettoDi("luca-ferri")).toMatchObject({ kind: "time", lessonsTotal: null, endsOn: "2026-10-31", label: "Mensile" });
    expect(pacchettoDi("davide-greco")).toMatchObject({ kind: "time", endsOn: "2026-11-30" });
    expect(pacchettoDi("elena-marini")).toMatchObject({ kind: "lessons", lessonsTotal: 8, lessonsUsed: 3 });
    expect(pacchettoDi("sara-conti")).toMatchObject({ lessonsTotal: 10, lessonsUsed: 9 });
  });

  it("misure come righe datate: il peso di ogni settimana, le circonferenze ogni due settimane e all'ultima", () => {
    const giulia = clients.find((c) => c.id === "giulia-bianchi")!;
    const righe = misureDi("giulia-bianchi");
    expect(righe).toHaveLength(8);
    expect(righe.map((r) => r.weightKg)).toEqual(giulia.weights);
    expect(righe[7].takenOn).toBe("2026-10-21");
    expect(righe[6].takenOn).toBe("2026-10-14");
    expect(righe[0]).toMatchObject({ waistCm: 86, hipsCm: 104, chestCm: 95, armCm: 31, thighCm: 60 });
    expect(righe[7]).toMatchObject({ waistCm: 82, hipsCm: 101, chestCm: 93, armCm: 30, thighCm: 58 });
    expect(righe[3].waistCm).toBeUndefined();
    // in mezzo calano poco a poco, al mezzo centimetro
    expect(righe[2].waistCm).toBe(85);
    expect(righe[4].waistCm! * 2 % 1).toBe(0);
    expect(righe[6].waistCm).toBeGreaterThan(82);
  });

  it("clienti con obiettivo e note come nella demo", () => {
    const luca = d.clienti.find((c) => c.id === "luca-ferri")!;
    expect(luca).toMatchObject({ goalLabel: "Mezza maratona (21 km)", goalUnit: "km", goalStart: 8, goalCurrent: 14.5, goalTarget: 21, email: "luca.ferri@esempio.it" });
    expect(luca.notes).toContain("Gara il 15 marzo");
    expect(d.clienti).toHaveLength(clients.length);
  });

  it("notifiche come oggi in Impostazioni: tutte accese tranne il riepilogo", () => {
    expect(d.notifiche).toEqual({ dolore: true, spostamento: true, pacchetti: true, riepilogo: false, avvisoDolori: true });
  });
});
