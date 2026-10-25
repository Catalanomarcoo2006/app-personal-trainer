// Il "viaggio" di Leo: dove portare il trainer per ogni azione e quanto dura ogni tappa.
// La chat si fa piccola, l'app va alla sezione, l'azione si vede accadere, poi la chat torna grande.

import { ROUTES } from "@/components/prototipo/trainer/nav";
import type { AzioneLeo } from "./leo-azioni";

export const TEMPI = {
  compatta: 350, // la chat si rimpicciolisce
  arrivo: 450, // la sezione nuova compare, poi parte l'azione
  azione: 900, // l'animazione dell'azione
  azioneRidotta: 300, // la stessa con "riduci movimento"
  vistosa: 1600, // cancellare (rosso, si spezzetta) e fissare (verde): più lente, devono farsi vedere
  vistosaRidotta: 600,
  ritorno: 1000, // dopo l'ultima azione, la chat torna grande
  carattere: 25, // scrittura del messaggio, per carattere
  scritturaMax: 3000,
};

export function sezioneDi(a: AzioneLeo): string {
  if (a.nome === "scrivi_messaggio") return `${ROUTES.messaggi}?cliente=${a.dati.cliente}`;
  if (a.nome === "scrivi_a_piu") return `${ROUTES.messaggi}?cliente=${a.dati.clienti[0]}`;
  return ROUTES.calendario;
}

// 0 = questa settimana (19–25 ottobre), 1 = la prossima.
export const settimanaDi = (date: string): 0 | 1 => (date >= "2026-10-26" ? 1 : 0);

export const durataScrittura = (testo: string, ridotto: boolean) => (ridotto ? 0 : Math.min(testo.length * TEMPI.carattere, TEMPI.scritturaMax));

// Quanto aspettare dopo l'azione, prima della prossima o del ritorno della chat.
export function tempoAzione(nome: AzioneLeo["nome"], ridotto: boolean): number {
  const vistosa = nome === "cancella_appuntamento" || nome === "fissa_appuntamento";
  if (ridotto) return vistosa ? TEMPI.vistosaRidotta : TEMPI.azioneRidotta;
  return vistosa ? TEMPI.vistosa : TEMPI.azione;
}
