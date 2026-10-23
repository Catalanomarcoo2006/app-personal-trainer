import { describe, expect, it } from "vitest";
import { romeMonthKey } from "@/libs/domain/time";
import { isPackageExpiring, lessonsRemaining } from "@/libs/domain/packages";
import { monthRevenueCents } from "@/libs/domain/revenue";
import { needsAttention } from "@/libs/domain/attention";

const DAY = 86_400_000;
const today = new Date("2026-10-23T09:00:00Z");
const inDays = (n: number) => new Date(today.getTime() + n * DAY).toISOString().slice(0, 10);

describe("romeMonthKey", () => {
  it("usa il fuso italiano: le 23:30 del 31 gennaio sono ancora gennaio", () => {
    expect(romeMonthKey("2027-01-31T22:30:00Z")).toBe("2027-01");
    expect(romeMonthKey("2027-01-31T23:30:00Z")).toBe("2027-02");
  });

  it("tiene conto dell'ora legale (UTC+2 d'estate)", () => {
    expect(romeMonthKey("2027-06-30T21:59:00Z")).toBe("2027-06");
    expect(romeMonthKey("2027-06-30T22:00:00Z")).toBe("2027-07");
  });

  it("una data senza ora vale per quel giorno", () => {
    expect(romeMonthKey("2027-03-31")).toBe("2027-03");
  });
});

describe("lessonsRemaining", () => {
  const pkg = { kind: "lessons" as const, lessons_total: 10 };

  it("scala solo le sedute fatte", () => {
    const sessions = [
      { id: "a", status: "done" as const },
      { id: "b", status: "done" as const },
      { id: "c", status: "done" as const },
      { id: "d", status: "cancelled" as const },
      { id: "e", status: "scheduled" as const },
    ];
    expect(lessonsRemaining(pkg, sessions)).toBe(7);
  });

  it("la stessa seduta segnata due volte conta una volta", () => {
    expect(lessonsRemaining(pkg, [{ id: "a", status: "done" }, { id: "a", status: "done" }])).toBe(9);
  });

  it("non va sotto zero", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: String(i), status: "done" as const }));
    expect(lessonsRemaining(pkg, many)).toBe(0);
  });

  it("i pacchetti a tempo non hanno lezioni", () => {
    expect(lessonsRemaining({ kind: "time", lessons_total: null }, [])).toBeNull();
  });
});

describe("isPackageExpiring", () => {
  const done = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i), status: "done" as const }));

  it("in scadenza con 2 lezioni rimaste", () => {
    expect(isPackageExpiring({ kind: "lessons", lessons_total: 10, ends_on: null }, done(8), today)).toBe(true);
  });

  it("non in scadenza con 3 lezioni e la fine fra 8 giorni", () => {
    expect(isPackageExpiring({ kind: "lessons", lessons_total: 10, ends_on: inDays(8) }, done(7), today)).toBe(false);
  });

  it("pacchetto a tempo che finisce fra 7 giorni: in scadenza", () => {
    expect(isPackageExpiring({ kind: "time", lessons_total: null, ends_on: inDays(7) }, [], today)).toBe(true);
  });

  it("pacchetto a tempo già finito: in scadenza", () => {
    expect(isPackageExpiring({ kind: "time", lessons_total: null, ends_on: inDays(-1) }, [], today)).toBe(true);
  });
});

describe("monthRevenueCents", () => {
  it("somma solo i pagamenti del mese", () => {
    const payments = [
      { amount_cents: 12000, paid_on: "2026-10-01" },
      { amount_cents: 4000, paid_on: "2026-10-31" },
      { amount_cents: 9900, paid_on: "2026-09-30" },
      { amount_cents: 5000, paid_on: "2026-11-01" },
    ];
    expect(monthRevenueCents(payments, "2026-10")).toBe(16000);
    expect(monthRevenueCents([], "2026-10")).toBe(0);
  });
});

describe("needsAttention", () => {
  it("mai allenato: da seguire", () => {
    expect(needsAttention(null, today)).toBe(true);
  });

  it("6 giorni fa no, 7 giorni fa sì", () => {
    expect(needsAttention(new Date(today.getTime() - 6 * DAY), today)).toBe(false);
    expect(needsAttention(new Date(today.getTime() - 7 * DAY), today)).toBe(true);
  });
});
