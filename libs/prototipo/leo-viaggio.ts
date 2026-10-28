// Il "viaggio" di Leo: dove portare il trainer per ogni azione e quanto dura ogni tappa.
// La chat si fa piccola, l'app va alla sezione, l'azione si vede accadere, poi la chat torna grande.

import { ROUTES } from "@/components/prototipo/trainer/nav";
import type { AzioneLeo, DatiLeo, Seduta } from "./leo-azioni";
import { testoSollecito } from "@/libs/dati/testi";

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

// d: i dati di adesso, per sapere di chi è un pagamento (sollecito). null: si resta dove si è (aspetto).
export function sezioneDi(a: AzioneLeo, d?: DatiLeo): string | null {
  if (a.nome === "cambia_aspetto") return null;
  if (a.nome === "imposta_notifiche") return ROUTES.impostazioni;
  const scrive = d ? testoDaScrivere(a, d) : null;
  if (scrive) return `${ROUTES.messaggi}?cliente=${scrive.clientId}`;
  if (a.nome === "scrivi_messaggio") return `${ROUTES.messaggi}?cliente=${a.dati.cliente}`;
  if (a.nome === "scrivi_a_piu") return `${ROUTES.messaggi}?cliente=${a.dati.clienti[0]}`;
  if (a.nome === "segna_pagato" || a.nome === "registra_pagamento" || a.nome === "rinnova_pacchetto") return ROUTES.incassi;
  if (a.nome === "aggiorna_misure" || a.nome === "aggiorna_obiettivo" || a.nome === "aggiungi_nota") return ROUTES.cliente(a.dati.cliente);
  if (a.nome === "nuovo_cliente") return ROUTES.clienti;
  return ROUTES.calendario;
}

// 0 = questa settimana (19–25 ottobre), 1 = la prossima.
export const settimanaDi = (date: string): 0 | 1 => (date >= "2026-10-26" ? 1 : 0);

// Le cancellazioni in fila, a partire da quella in posizione da: tutte le schede "in-corso" di seguito che
// cancellano una seduta della stessa settimana. Partono insieme (un viaggio, il vetro si rompe su tutte): con
// tante cancellazioni il trainer non aspetta un'animazione per ognuna. Se la prima non è una cancellazione, resta da sola.
export function cancellazioniInsieme<T extends { stato: string; azione: AzioneLeo }>(lista: T[], da: number, sedute: Seduta[]): T[] {
  const primo = lista[da];
  if (!primo) return [];
  const settimana = (a: AzioneLeo) => {
    if (a.nome !== "cancella_appuntamento") return null;
    const s = sedute.find((x) => x.id === a.dati.id);
    return s ? settimanaDi(s.date) : null;
  };
  const sua = settimana(primo.azione);
  if (sua === null) return [primo];
  const gruppo = [primo];
  for (const s of lista.slice(da + 1)) {
    if (s.stato !== "in-corso" || settimana(s.azione) !== sua) break;
    gruppo.push(s);
  }
  return gruppo;
}

export const durataScrittura = (testo: string, ridotto: boolean) => (ridotto ? 0 : Math.min(testo.length * TEMPI.carattere, TEMPI.scritturaMax));

// Quanto aspettare dopo l'azione, prima della prossima o del ritorno della chat.
export function tempoAzione(nome: AzioneLeo["nome"], ridotto: boolean): number {
  const vistosa = nome === "cancella_appuntamento" || nome === "fissa_appuntamento";
  if (ridotto) return vistosa ? TEMPI.vistosaRidotta : TEMPI.azioneRidotta;
  return vistosa ? TEMPI.vistosa : TEMPI.azione;
}

// Il testo che la chat dei messaggi scrive da sola prima che parta: un messaggio o un sollecito. null per le altre.
export function testoDaScrivere(a: AzioneLeo, d: DatiLeo): { clientId: string; testo: string } | null {
  if (a.nome === "scrivi_messaggio") return { clientId: a.dati.cliente, testo: a.dati.testo };
  if (a.nome !== "sollecita") return null;
  const p = d.dati.pagamenti.find((x) => x.id === a.dati.pagamento);
  const c = p && d.dati.clienti.find((x) => x.id === p.clientId);
  return p && c ? { clientId: c.id, testo: a.dati.testo?.trim() || testoSollecito(p, c.name) } : null;
}
