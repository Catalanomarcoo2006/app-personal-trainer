// Conti della rotella stile iOS (components/ui/Rotella.tsx): misure, voci di ore e minuti, e da quanto si è scorso
// a quale voce si è arrivati. Funzioni pure, senza React.

export const RIGA = 27; // px, altezza di una voce
export const ALTEZZA = 108; // px, la rotella: la voce al centro e una e mezza sopra e sotto

export const ORE = Array.from({ length: 24 }, (_, h) => h);

// Minuti a passi di 5; se l'orario di partenza ha un minuto diverso (un "10:17" fissato da Leo) c'è anche quello,
// così aprire il modulo non cambia l'orario.
export function minutiDi(attuale: number, passo = 5): number[] {
  const voci = Array.from({ length: 60 / passo }, (_, i) => i * passo);
  return voci.includes(attuale) ? voci : [...voci, attuale].sort((a, b) => a - b);
}

export const due = (n: number) => String(n).padStart(2, "0");

// "HH:MM" → ore e minuti; un orario non valido diventa le 9:00, non NaN.
export function separaOra(t: string): { h: number; m: number } {
  const x = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!x) return { h: 9, m: 0 };
  return { h: Math.min(23, Number(x[1])), m: Math.min(59, Number(x[2])) };
}

export const componiOra = (h: number, m: number) => `${due(h)}:${due(m)}`;

// La voce al centro dopo aver scorso di scrollTop px (n voci in tutto).
export function indiceDa(scrollTop: number, n: number, riga = RIGA): number {
  return Math.min(n - 1, Math.max(0, Math.round(scrollTop / riga)));
}

// Quanto una voce dista dal centro, in voci: 0 al centro. Serve a rimpicciolire e sbiadire quelle lontane.
export const distanza = (i: number, scrollTop: number, riga = RIGA) => Math.abs(i * riga - scrollTop) / riga;
