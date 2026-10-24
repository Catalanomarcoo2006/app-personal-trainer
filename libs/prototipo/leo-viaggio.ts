// Il "viaggio" di Leo: dove portare il trainer per ogni azione e quanto dura ogni tappa.
// La chat si fa piccola, l'app va alla sezione, l'azione si vede accadere, poi la chat torna grande.

import { ROUTES } from "@/components/prototipo/trainer/nav";
import type { AzioneLeo } from "./leo-azioni";

export const TEMPI = {
  compatta: 350, // la chat si rimpicciolisce
  arrivo: 450, // la sezione nuova compare, poi parte l'azione
  azione: 900, // l'animazione dell'azione
  azioneRidotta: 300, // la stessa con "riduci movimento"
  ritorno: 1000, // dopo l'ultima azione, la chat torna grande
  carattere: 25, // scrittura del messaggio, per carattere
  scritturaMax: 3000,
};

export function sezioneDi(a: AzioneLeo): string {
  return a.nome === "scrivi_messaggio" ? `${ROUTES.messaggi}?cliente=${a.dati.cliente}` : ROUTES.calendario;
}

// 0 = questa settimana (19–25 ottobre), 1 = la prossima.
export const settimanaDi = (date: string): 0 | 1 => (date >= "2026-10-26" ? 1 : 0);

export const durataScrittura = (testo: string, ridotto: boolean) => (ridotto ? 0 : Math.min(testo.length * TEMPI.carattere, TEMPI.scritturaMax));
