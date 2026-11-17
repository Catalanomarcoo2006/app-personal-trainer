// Messaggi dal vivo (Realtime sulla tabella messages, migrazione 7): quando l'altro scrive, il messaggio entra
// nella conversazione senza ricaricare. Qui la scelta pura (la provano i test); l'ascolto è in AvvioVero.
// I messaggi propri si ignorano: sono già nella pagina (e il salvataggio continuo li ha appena scritti).

import type { Tables } from "@/types/db";
import type { Ruolo } from "./salva";

export function messaggioArrivato(riga: Pick<Tables<"messages">, "client_id" | "sender">, ruolo: Ruolo, clientiInElenco: string[]): string | null {
  if (ruolo.tipo === "trainer") {
    if (riga.sender !== "client" || !clientiInElenco.includes(riga.client_id)) return null;
    return riga.client_id;
  }
  if (riga.sender !== "trainer" || riga.client_id !== ruolo.clientId) return null;
  return riga.client_id;
}
