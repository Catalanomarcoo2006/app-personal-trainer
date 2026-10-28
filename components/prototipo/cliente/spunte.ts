// Gli esercizi spuntati oggi dal cliente: la Home mostra l'avanzamento, Allenamento le spunte. Stessa memoria per
// tutte e due (in questa finestra, per la demo; con Supabase finirà nel database). La demo parte con il primo fatto.

import { useSyncExternalStore } from "react";

let spunte: boolean[] = [true];
const ascolti = new Set<() => void>();

const iscrivi = (f: () => void) => {
  ascolti.add(f);
  return () => ascolti.delete(f);
};
const leggi = () => spunte;

// n: quanti esercizi ha l'allenamento di oggi. Ritorna le spunte (sempre n) e la funzione che ne cambia una.
export function useSpunte(n: number): [boolean[], (i: number) => boolean[]] {
  const tutte = useSyncExternalStore(iscrivi, leggi, leggi);
  const fatte = Array.from({ length: n }, (_, i) => !!tutte[i]);
  const cambia = (i: number) => {
    const dopo = fatte.map((v, k) => (k === i ? !v : v));
    spunte = dopo;
    ascolti.forEach((f) => f());
    return dopo;
  };
  return [fatte, cambia];
}
