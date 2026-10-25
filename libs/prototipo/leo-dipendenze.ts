// Azioni su un cliente che Leo sta creando nella stessa risposta ("crea Marta Nerini e fissale una seduta"):
// il cliente non esiste ancora, quindi l'azione aspetta. Il nuovo cliente passa sempre per primo; le azioni che lo citano
// restano in attesa (con il suo nome nel titolo) e, quando il cliente è stato creato, trovano il suo id vero.

import { inChiaro, riassunto, type AzioneLeo, type DatiLeo, type StatoScheda } from "./leo-azioni";
import { clienteDa } from "./leo-contesto";
import type { ClienteDati } from "@/libs/dati/tipi";

export type NuovoCliente = { key: string; nome: string }; // key: la chiave della sua scheda

export const ordinaNuoviPrima = (azioni: AzioneLeo[]): AzioneLeo[] => [...azioni].sort((x, y) => Number(y.nome === "nuovo_cliente") - Number(x.nome === "nuovo_cliente"));

// Il cliente che l'azione cita (nome o id scritto dall'AI), se è un'azione su un solo cliente.
function citato(a: AzioneLeo): string | undefined {
  if (a.nome === "nuovo_cliente") return undefined;
  const c = (a.dati as unknown as { cliente?: unknown }).cliente;
  return typeof c === "string" ? c : undefined;
}

export function dipendeDaNuovo(a: AzioneLeo, nuovi: NuovoCliente[]): NuovoCliente | undefined {
  const c = citato(a);
  return c ? nuovi.find((n) => clienteDa(c, [{ id: n.key, name: n.nome }]) === n.key) : undefined;
}

export const conClienteCitato = (a: AzioneLeo, riferimento: string): AzioneLeo => ({ ...a, dati: { ...a.dati, cliente: riferimento } }) as AzioneLeo;

// La scheda provvisoria: l'azione punta alla chiave del nuovo cliente e il titolo ha già il suo nome.
export function sulNuovoCliente(a: AzioneLeo, n: NuovoCliente, d: DatiLeo): { azione: AzioneLeo; titolo: string } {
  const azione = conClienteCitato(a, n.key);
  const provvisorio = { id: n.key, name: n.nome } as ClienteDati;
  return { azione, titolo: riassunto(azione, { ...d, dati: { ...d.dati, clienti: [...d.dati.clienti, provvisorio] } }) };
}

// Quando tocca all'azione: se il nuovo cliente è stato creato (anche con un nome cambiato nella sua scheda)
// si cerca il suo id vero; se no l'azione non parte.
export function risolviDipendenza(
  a: AzioneLeo,
  dip: { azione: AzioneLeo; stato: StatoScheda } | undefined,
  elenco: { id: string; name: string }[],
): { azione: AzioneLeo } | { motivo: string } {
  if (!dip || dip.azione.nome !== "nuovo_cliente" || dip.stato !== "fatto") return { motivo: "Il nuovo cliente non è stato creato" };
  const chiara = inChiaro(conClienteCitato(a, dip.azione.dati.nome), elenco);
  return chiara ? { azione: chiara } : { motivo: "Cliente non trovato" };
}
