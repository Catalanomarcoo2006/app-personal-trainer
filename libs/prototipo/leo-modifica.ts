// Le modifiche che il trainer fa in una scheda di Leo prima di confermarla (testo del messaggio, destinatari,
// nome ed email del nuovo cliente) e "Conferma tutte", che parte con le modifiche di ogni scheda.

import type { AzioneLeo, StatoScheda } from "./leo-azioni";

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

// Tutte le schede ancora da confermare partono, ognuna con quello che il trainer ci ha cambiato.
export function daConfermareTutte<T extends { key: string; azione: AzioneLeo; stato: StatoScheda }>(schede: T[], modifiche: Map<string, Modifica>): T[] {
  return schede.map((s) => (s.stato === "da-confermare" ? { ...s, stato: "in-corso", azione: conModifica(s.azione, modifiche.get(s.key)) } : s));
}
