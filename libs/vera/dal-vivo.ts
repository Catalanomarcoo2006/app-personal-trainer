// Messaggi, sedute e avvisi dal vivo (Realtime: messages dalla migrazione 7, sessions e alerts dalla 10): quello
// che cambia l'altro arriva senza ricaricare. Qui la scelta pura (la provano i test); l'ascolto è in AvvioVero.
// I messaggi propri si ignorano: sono già nella pagina (e il salvataggio continuo li ha appena scritti).

import type { Tables } from "@/types/db";
import type { Seduta } from "@/libs/prototipo/leo-azioni";
import type { Ruolo } from "./salva";
import { sedutaDa } from "./mappa";

export function messaggioArrivato(riga: Pick<Tables<"messages">, "client_id" | "sender">, ruolo: Ruolo, clientiInElenco: string[]): string | null {
  if (ruolo.tipo === "trainer") {
    if (riga.sender !== "client" || !clientiInElenco.includes(riga.client_id)) return null;
    return riga.client_id;
  }
  if (riga.sender !== "trainer" || riga.client_id !== ruolo.clientId) return null;
  return riga.client_id;
}

// Sedute dal vivo, nell'app del cliente: il trainer ne aggiunge, sposta o annulla una e il calendario cambia.
// null = niente da fare (non è sua, o è già così). Il trainer non le ascolta: le cambia solo lui.
export function sedutaArrivata(
  sedute: Seduta[],
  riga: Tables<"sessions">,
  clientId: string,
): { tipo: "metti"; seduta: Seduta } | { tipo: "togli"; id: string } | null {
  if (riga.client_id !== clientId) return null;
  const presente = sedute.find((x) => x.id === riga.id);
  if (riga.status === "cancelled") return presente ? { tipo: "togli", id: riga.id } : null;
  const seduta = sedutaDa(riga);
  if (presente && JSON.stringify(presente) === JSON.stringify(seduta)) return null;
  return { tipo: "metti", seduta };
}

// Avvisi dal vivo, per il trainer: un dolore entra negli Urgenti; dolore e richiesta di spostamento fanno un avviso
// a schermo. I pacchetti che finiscono li crea il controllo del mattino: gli Urgenti li calcolano già da soli.
export function avvisoArrivato(
  riga: Pick<Tables<"alerts">, "kind" | "text" | "client_id">,
  clienti: { id: string; name: string }[],
): { avviso: string; dolore?: { clientId: string; title: string; detail: string; text: string } } | null {
  const c = clienti.find((x) => x.id === riga.client_id);
  if (!c) return null;
  const nome = c.name.split(" ")[0];
  if (riga.kind === "pain") return { avviso: `${nome} ha segnalato un dolore`, dolore: { clientId: c.id, title: "Dolore segnalato", detail: `${c.name} · ${riga.text}`, text: riga.text } };
  if (riga.kind === "change_request") return { avviso: `${nome} chiede di spostare una seduta` };
  return null;
}
