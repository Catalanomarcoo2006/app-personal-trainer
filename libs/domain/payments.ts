// Pagamenti: importi in centesimi, "da incassare" finché paidOn è vuoto.

import type { Pagamento } from "@/libs/dati/tipi";
import { monthRevenueCents } from "./revenue";
import { no, OK, type Verifica } from "./verifica";

const MIN_CENTS = 100; // 1 €
const MAX_CENTS = 500_000; // 5.000 €

// 450, "450", "450,50", "€ 450", "1.200,00" → centesimi; null se non è un importo.
export function euroInCentesimi(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v * 100) : null;
  if (typeof v !== "string") return null;
  let s = v.replace(/€|eur(o)?/gi, "").replace(/\s/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

export function controllaImporto(cents: number): Verifica {
  return Number.isInteger(cents) && cents >= MIN_CENTS && cents <= MAX_CENTS ? OK : no("L'importo va da 1 € a 5.000 €");
}

export function controllaPagabile(p: Pagamento | undefined): Verifica {
  if (!p) return no("Pagamento non trovato");
  return p.paidOn ? no("Il pagamento è già segnato") : OK;
}

export const outstandingCents = (pagamenti: Pagamento[]) => pagamenti.reduce((s, p) => (p.paidOn ? s : s + p.amountCents), 0);

// Incassato in un mese ("AAAA-MM"), sul calendario italiano.
export const collectedCents = (pagamenti: Pagamento[], monthKey: string) =>
  monthRevenueCents(
    pagamenti.flatMap((p) => (p.paidOn ? [{ amount_cents: p.amountCents, paid_on: p.paidOn }] : [])),
    monthKey,
  );
