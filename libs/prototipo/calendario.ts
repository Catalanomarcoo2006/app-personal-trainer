// Le settimane del calendario della demo: quella del prototipo (19–25 ottobre) e, spostandosi,
// settimane credibili prima e dopo. Logica pura, usata da Agenda, dal calendario e dallo store di Leo.

import { agenda, type Appointment } from "./dati-finti";
import type { Seduta } from "./leo-azioni";

export const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
export const SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
export const LONG = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

// Le settimane su cui Leo può agire (e che vivono nello store): questa e la prossima.
export const SETTIMANE_LEO = [0, 1];

export const giornoDi = (offset: number, i: number) => new Date(2026, 9, 19 + offset * 7 + i);
export const isoDi = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Le sedute della demo per un giorno: le altre settimane riusano i giorni feriali di questa, mescolati; la domenica resta libera.
export function seduteDemo(offset: number, i: number): Appointment[] {
  return offset === 0 ? agenda[i] : i === 6 ? [] : agenda[(((i + offset * 2) % 6) + 6) % 6];
}

// Le sedute iniziali dello store, con id A1, A2, … in ordine di giorno.
export function seduteIniziali(): Seduta[] {
  let n = 0;
  return SETTIMANE_LEO.flatMap((offset) =>
    SHORT.flatMap((_, i) => seduteDemo(offset, i).map((a) => ({ ...a, id: `A${++n}`, date: isoDi(giornoDi(offset, i)) }))),
  );
}
