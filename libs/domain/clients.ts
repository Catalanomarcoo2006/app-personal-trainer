// Clienti: id leggibile dal nome ("sara-conti") e controlli prima di crearne uno nuovo.

import type { ClienteDati } from "@/libs/dati/tipi";
import { no, OK, type Verifica } from "./verifica";

const semplice = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export function idDaNome(nome: string, esistenti: string[]): string {
  const base = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!esistenti.includes(base)) return base;
  let n = 2;
  while (esistenti.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export function controllaNuovoCliente(nome: string, esistenti: ClienteDati[]): Verifica {
  if (!nome.trim()) return no("Manca il nome");
  return esistenti.some((c) => semplice(c.name) === semplice(nome)) ? no("Esiste già un cliente con questo nome") : OK;
}
