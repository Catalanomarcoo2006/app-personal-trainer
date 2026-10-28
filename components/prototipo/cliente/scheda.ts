// La scheda del cliente della demo, letta dallo stesso store dell'area trainer: se Marco la cambia in Schede, o
// sposta una seduta nel calendario, la Home e Allenamento cambiano subito (in questa finestra).

import { giornoDi, isoDi, LONG } from "@/libs/prototipo/calendario";
import { oggiOProssimo, prossimaDelGiorno } from "@/libs/prototipo/allenamenti";
import type { Seduta } from "@/libs/prototipo/leo-azioni";
import { rowName, rowVideo, useStato, type Row } from "@/libs/prototipo/stato";

export const CLIENTE_DEMO = "giulia-bianchi";
export const OGGI = 2; // mercoledì 21 ottobre, come in tutta la demo
export const OGGI_ISO = isoDi(giornoDi(0, OGGI));

export function useScheda() {
  const giorni = useStato((s) => s.plans[CLIENTE_DEMO]) ?? [];
  const videos = useStato((s) => s.videos);
  const sedute = useStato((s) => s.sedute);
  return {
    giorni,
    sedute,
    prossimo: oggiOProssimo(sedute, CLIENTE_DEMO, OGGI_ISO, giorni.length),
    prossimaDi: (giorno: number) => prossimaDelGiorno(sedute, CLIENTE_DEMO, OGGI_ISO, giorni.length, giorno),
    esercizio: (r: Row) => ({ nome: rowName(r), dettaglio: dettaglio(r), video: rowVideo(r, videos) }),
  };
}

// "4 × 10 · 40 kg · recupero 90″"
export const dettaglio = (r: Row) => [r.sets, r.load && r.load !== "—" ? r.load : "", r.rest && r.rest !== "—" ? `recupero ${r.rest}` : ""].filter(Boolean).join(" · ");

// "Oggi", "Domani", "Venerdì 23"
export function giornoDetto(date: string): string {
  if (date === OGGI_ISO) return "Oggi";
  const d = new Date(`${date}T12:00:00`);
  const domani = new Date(`${OGGI_ISO}T12:00:00`);
  domani.setDate(domani.getDate() + 1);
  if (isoDi(d) === isoDi(domani)) return "Domani";
  return `${LONG[(d.getDay() + 6) % 7]} ${d.getDate()}`;
}

export const quandoSeduta = (s: Seduta) => `${giornoDetto(s.date)} alle ${s.time}`;
