// Le modifiche che il trainer fa in una scheda di Leo prima di confermarla (testo del messaggio, destinatari,
// nome ed email del nuovo cliente) e "Conferma tutte", che parte con le modifiche di ogni scheda.

import { riassunto, type AzioneLeo, type DatiLeo, type StatoScheda } from "./leo-azioni";

export type Modifica = { testo?: string; clienti?: string[]; nome?: string; obiettivo?: string; email?: string };

export function conModifica(a: AzioneLeo, m?: Modifica): AzioneLeo {
  if (!m) return a;
  if ((a.nome === "scrivi_messaggio" || a.nome === "sollecita") && m.testo !== undefined) return { ...a, dati: { ...a.dati, testo: m.testo.trim() } } as AzioneLeo;
  if (a.nome === "scrivi_a_piu") return { ...a, dati: { clienti: m.clienti ?? a.dati.clienti, testo: (m.testo ?? a.dati.testo).trim() } };
  // l'email la scrive solo il trainer, qui: non passa mai dall'AI
  if (a.nome === "nuovo_cliente")
    return { ...a, dati: { ...a.dati, nome: m.nome?.trim() || a.dati.nome, obiettivo: m.obiettivo?.trim() || undefined, email: m.email?.trim() || undefined } };
  return a;
}

// Il titolo della scheda dopo le modifiche (il nome del nuovo cliente, i destinatari): quello di prima non vale più.
export const titoloModificato = (a: AzioneLeo, m: Modifica | undefined, d: DatiLeo) => riassunto(conModifica(a, m), d);

// Tutte le schede ancora da confermare partono, ognuna con quello che il trainer ci ha cambiato.
// Con d anche il titolo si aggiorna (senza, resta quello calcolato quando è arrivata); le schede che aspettano un
// nuovo cliente (dipendeDa) tengono il loro, finché il cliente non esiste.
export function daConfermareTutte<T extends { key: string; azione: AzioneLeo; stato: StatoScheda; titolo?: string; dipendeDa?: string }>(schede: T[], modifiche: Map<string, Modifica>, d?: DatiLeo): T[] {
  return schede.map((s) => {
    if (s.stato !== "da-confermare") return s;
    const m = modifiche.get(s.key);
    const azione = conModifica(s.azione, m);
    return { ...s, stato: "in-corso", azione, ...(d && m && !s.dipendeDa ? { titolo: riassunto(azione, d) } : {}) };
  });
}
