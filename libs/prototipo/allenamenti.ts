// Quale giorno della scheda tocca a ogni seduta del cliente: le sedute, in ordine di data, prendono i giorni della
// scheda in fila (A, B, C, A, …) a partire dalla prima seduta da oggi in poi, che fa il primo giorno. Le sedute
// passate tornano indietro nella fila. Così se una seduta si sposta o si cancella, la fila si aggiorna da sola.

import type { Seduta } from "./leo-azioni";

export type SedutaConGiorno = { seduta: Seduta; giorno: number };

const ordina = (a: Seduta, b: Seduta) => (a.date + a.time).localeCompare(b.date + b.time);

export function seduteConGiorno(sedute: Seduta[], clientId: string, oggi: string, giorni: number): SedutaConGiorno[] {
  if (giorni < 1) return [];
  const sue = sedute.filter((s) => s.clientId === clientId).sort(ordina);
  const primo = sue.findIndex((s) => s.date >= oggi);
  const zero = primo === -1 ? sue.length : primo;
  return sue.map((seduta, i) => ({ seduta, giorno: (((i - zero) % giorni) + giorni) % giorni }));
}

// L'allenamento da mostrare in Home: quello di oggi se c'è una seduta oggi, altrimenti il prossimo; null se non ce n'è.
export function oggiOProssimo(sedute: Seduta[], clientId: string, oggi: string, giorni: number): (SedutaConGiorno & { oggi: boolean }) | null {
  const prossima = seduteConGiorno(sedute, clientId, oggi, giorni).find((x) => x.seduta.date >= oggi);
  return prossima ? { ...prossima, oggi: prossima.seduta.date === oggi } : null;
}

// La prossima seduta, da oggi in poi, di un giorno della scheda (per scrivere "Venerdì 23 alle 18:00" sotto ogni giorno).
export function prossimaDelGiorno(sedute: Seduta[], clientId: string, oggi: string, giorni: number, giorno: number): Seduta | null {
  return seduteConGiorno(sedute, clientId, oggi, giorni).find((x) => x.giorno === giorno && x.seduta.date >= oggi)?.seduta ?? null;
}
