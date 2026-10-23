// Incassi: importi sempre in centesimi (niente errori di arrotondamento con i decimali).

import { romeMonthKey } from "./time";

// Totale dei pagamenti di un mese ("AAAA-MM"), contati sul calendario italiano.
export function monthRevenueCents(payments: { amount_cents: number; paid_on: string }[], monthKey: string): number {
  return payments.reduce((sum, p) => (romeMonthKey(p.paid_on) === monthKey ? sum + p.amount_cents : sum), 0);
}
