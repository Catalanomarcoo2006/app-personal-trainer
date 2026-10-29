// Ogni quanto il cliente si pesa (lo sceglie alla registrazione, si cambia nel Profilo) e quando tocca la prossima:
// dall'ultima pesata, un giorno, una settimana o un mese dopo. Senza pesate tocca subito.

import { aggiungiMesi } from "./time";

export type Frequenza = "giorno" | "settimana" | "mese";

export const FREQUENZE: { f: Frequenza; label: string; detto: string }[] = [
  { f: "giorno", label: "Ogni giorno", detto: "ogni mattina" },
  { f: "settimana", label: "Ogni settimana", detto: "una volta a settimana" },
  { f: "mese", label: "Ogni mese", detto: "una volta al mese" },
];

const piuGiorni = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export function prossimaPesata(ultima: string, f: Frequenza): string {
  return f === "giorno" ? piuGiorni(ultima, 1) : f === "settimana" ? piuGiorni(ultima, 7) : aggiungiMesi(ultima, 1);
}

export function pesataDovuta(ultima: string | undefined, oggi: string, f: Frequenza): boolean {
  return !ultima || oggi >= prossimaPesata(ultima, f);
}
