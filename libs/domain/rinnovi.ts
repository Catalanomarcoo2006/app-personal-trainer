// Rinnovo di un pacchetto: lezioni in più per i pacchetti a lezioni, mesi in più per quelli a tempo.

import type { Pacchetto } from "@/libs/dati/tipi";
import { no, OK, type Verifica } from "./verifica";

const LEZIONI = { min: 1, max: 50 };
const MESI = { min: 1, max: 12 };

export function controllaRinnovo(p: Pacchetto | undefined, nomeCliente: string, r: { lezioni?: number; mesi?: number }): Verifica {
  if (!p) return no(`${nomeCliente} non ha ancora un pacchetto`);
  if ((r.lezioni === undefined) === (r.mesi === undefined)) return no("Indica lezioni oppure mesi");
  if (r.lezioni !== undefined) {
    if (p.kind !== "lessons") return no(`Il pacchetto di ${nomeCliente} è a tempo: si rinnova a mesi`);
    if (!(Number.isInteger(r.lezioni) && r.lezioni >= LEZIONI.min && r.lezioni <= LEZIONI.max)) return no(`Le lezioni vanno da ${LEZIONI.min} a ${LEZIONI.max}`);
    return OK;
  }
  if (p.kind !== "time") return no(`Il pacchetto di ${nomeCliente} è a lezioni: si rinnova a lezioni`);
  if (!(Number.isInteger(r.mesi) && r.mesi! >= MESI.min && r.mesi! <= MESI.max)) return no(`I mesi vanno da ${MESI.min} a ${MESI.max}`);
  return OK;
}
