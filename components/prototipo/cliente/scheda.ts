// La scheda del cliente della demo, letta dallo stesso store dell'area trainer: se Marco la cambia in Schede, o
// sposta una seduta nel calendario, la Home e Allenamento cambiano subito (in questa finestra).

import { isoDi, LONG } from "@/libs/prototipo/calendario";
import { oggi } from "@/libs/orologio";
import { oggiOProssimo, prossimaDelGiorno } from "@/libs/prototipo/allenamenti";
import type { Seduta } from "@/libs/prototipo/leo-azioni";
import { rowName, rowVideo, useStato, type Row } from "@/libs/prototipo/stato";

// Il cliente di questa app: Giulia nella demo, il cliente collegato nella versione vera (impostaClienteIo, all'avvio).
// È un let esportato: chi lo importa legge sempre il valore di adesso.
export let CLIENTE_IO = "giulia-bianchi";
export function impostaClienteIo(id: string) {
  CLIENTE_IO = id;
}

export function useScheda() {
  const giorni = useStato((s) => s.plans[CLIENTE_IO]) ?? [];
  const videos = useStato((s) => s.videos);
  const sedute = useStato((s) => s.sedute);
  return {
    giorni,
    sedute,
    prossimo: oggiOProssimo(sedute, CLIENTE_IO, oggi(), giorni.length),
    prossimaDi: (giorno: number) => prossimaDelGiorno(sedute, CLIENTE_IO, oggi(), giorni.length, giorno),
    esercizio: (r: Row) => ({ nome: rowName(r), dettaglio: dettaglio(r), video: rowVideo(r, videos) }),
  };
}

// "4 × 10 · 40 kg · recupero 90″"
export const dettaglio = (r: Row) => [r.sets, r.load && r.load !== "—" ? r.load : "", r.rest && r.rest !== "—" ? `recupero ${r.rest}` : ""].filter(Boolean).join(" · ");

// "Oggi", "Domani", "Venerdì 23"
export function giornoDetto(date: string): string {
  if (date === oggi()) return "Oggi";
  const d = new Date(`${date}T12:00:00`);
  const domani = new Date(`${oggi()}T12:00:00`);
  domani.setDate(domani.getDate() + 1);
  if (isoDi(d) === isoDi(domani)) return "Domani";
  return `${LONG[(d.getDay() + 6) % 7]} ${d.getDate()}`;
}

export const quandoSeduta = (s: Seduta) => `${giornoDetto(s.date)} alle ${s.time}`;
