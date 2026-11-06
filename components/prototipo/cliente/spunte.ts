// Gli esercizi spuntati oggi dal cliente: la Home mostra l'avanzamento, Allenamento le spunte. Stessa memoria per
// tutte e due. Nella demo parte con il primo fatto e resta in questa finestra; nella versione vera parte dal
// database (impostaSpunteVere: tutte se l'allenamento di oggi è già segnato) e l'allenamento finito si salva.

import { useSyncExternalStore } from "react";

let spunte: boolean[] = [true];
let quandoCambia: ((fatto: boolean) => void) | null = null;
const ascolti = new Set<() => void>();

const iscrivi = (f: () => void) => {
  ascolti.add(f);
  return () => ascolti.delete(f);
};
const leggi = () => spunte;

// Tutte spuntate se oggi l'allenamento è già nel database (una scheda non ha mai 100 esercizi in un giorno).
export const spunteIniziali = (fattoOggi: boolean): boolean[] => (fattoOggi ? Array<boolean>(100).fill(true) : []);

// true: l'allenamento è appena diventato completo; false: non lo è più; null: niente da salvare.
export function cambioAllenamento(prima: boolean[], dopo: boolean[]): boolean | null {
  const completo = (s: boolean[]) => s.length > 0 && s.every(Boolean);
  return completo(prima) === completo(dopo) ? null : completo(dopo);
}

export function impostaSpunteVere(fattoOggi: boolean, salva: (fatto: boolean) => void) {
  spunte = spunteIniziali(fattoOggi);
  quandoCambia = salva;
  ascolti.forEach((f) => f());
}

// n: quanti esercizi ha l'allenamento di oggi. Ritorna le spunte (sempre n) e la funzione che ne cambia una.
export function useSpunte(n: number): [boolean[], (i: number) => boolean[]] {
  const tutte = useSyncExternalStore(iscrivi, leggi, leggi);
  const fatte = Array.from({ length: n }, (_, i) => !!tutte[i]);
  const cambia = (i: number) => {
    const dopo = fatte.map((v, k) => (k === i ? !v : v));
    const evento = cambioAllenamento(fatte, dopo);
    spunte = dopo;
    ascolti.forEach((f) => f());
    if (evento !== null) quandoCambia?.(evento);
    return dopo;
  };
  return [fatte, cambia];
}
