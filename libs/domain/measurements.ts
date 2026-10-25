// Misure del cliente: una riga per rilevazione, con i valori plausibili controllati prima di salvarla.

import type { Misura } from "@/libs/dati/tipi";
import { no, OK, type Verifica } from "./verifica";

const PESO = { min: 30, max: 250 };
const CIRCONFERENZA = { min: 15, max: 200 };
const CIRCONFERENZE = [
  ["waistCm", "Vita"],
  ["hipsCm", "Fianchi"],
  ["chestCm", "Petto"],
  ["armCm", "Braccio"],
  ["thighCm", "Coscia"],
] as const;

const numero = (n: number) => String(n).replace(".", ",");

export function controllaMisura(m: Omit<Misura, "id">, oggi: string): Verifica {
  const valori = [m.weightKg, ...CIRCONFERENZE.map(([k]) => m[k])].filter((v) => v !== undefined);
  if (!valori.length) return no("Nessun valore da salvare");
  if (m.takenOn > oggi) return no("La data è nel futuro");
  if (m.weightKg !== undefined && !(m.weightKg >= PESO.min && m.weightKg <= PESO.max)) return no(`Peso fuori misura: ${numero(m.weightKg)} kg?`);
  for (const [k, nome] of CIRCONFERENZE) {
    const v = m[k];
    if (v !== undefined && !(v >= CIRCONFERENZA.min && v <= CIRCONFERENZA.max)) return no(`${nome} fuori misura: ${numero(v)} cm?`);
  }
  return OK;
}

export function ultimaMisura(misure: Misura[], clientId: string): Misura | undefined {
  return misure.filter((m) => m.clientId === clientId).reduce<Misura | undefined>((u, m) => (!u || m.takenOn >= u.takenOn ? m : u), undefined);
}
