// Che giorno è e che ore sono, per tutta l'app.
// La demo è ferma a mercoledì 21 ottobre 2026, ore 10:20 (i dati finti sono costruiti attorno a quel giorno);
// la versione vera usa il giorno e l'ora di adesso in Italia. Si passa alla versione vera solo nel browser
// (AvvioVero, dopo il montaggio): sul server l'orologio resta quello della demo, così le richieste di
// demo e versione vera non si mescolano.

import { romeDayKey } from "@/libs/domain/time";

export type Modo = "demo" | "vera";

export const DEMO = { data: "2026-10-21", ora: "10:20" } as const;

let modo: Modo = "demo";

export const modoAttuale = (): Modo => modo;
export const inDemo = () => modo === "demo";

export function impostaModo(m: Modo) {
  modo = m;
}

const oraRoma = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hour12: false });

// "AAAA-MM-GG" di oggi.
export const oggi = (): string => (modo === "demo" ? DEMO.data : romeDayKey(new Date()));

// "HH:MM" di adesso.
export const adesso = (): string => (modo === "demo" ? DEMO.ora : oraRoma.format(new Date()));

const due = (n: number) => String(n).padStart(2, "0");
const daIso = (iso: string) => new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
export const isoDi = (d: Date) => `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}`;

// 0 = lunedì … 6 = domenica, per oggi.
export const indiceOggi = (): number => (daIso(oggi()).getDay() + 6) % 7;

// Il giorno i (0 = lunedì) della settimana spostata di offset settimane da quella di oggi.
export function giornoDi(offset: number, i: number): Date {
  const o = daIso(oggi());
  return new Date(o.getFullYear(), o.getMonth(), o.getDate() - indiceOggi() + offset * 7 + i);
}

// Il giorno spostato di n giorni.
export const piuGiorni = (iso: string, n: number): string => {
  const d = daIso(iso);
  return isoDi(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
};
