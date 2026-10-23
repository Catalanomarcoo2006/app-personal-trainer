// Benvenuto del trainer: il percorso del primo accesso (password, codice via email, marchio, accordi,
// primo cliente, Leo). Le regole sono funzioni pure, testate; il punto a cui si è arrivati resta in questo
// browser (localStorage), così ricaricando si riparte da lì e, una volta finito, non ricompare.

import { useSyncExternalStore } from "react";

export type Tono = "amichevole" | "professionale" | "motivante";

export const PASSI = ["accesso", "marchio", "accordi", "cliente", "leo", "finale"] as const;
export type Passo = 0 | 1 | 2 | 3 | 4 | 5;

export type Benvenuto = {
  v: 1;
  fatto: boolean;
  passo: Passo;
  verificato: boolean;
  studio: string;
  logo: string | null; // data URL
  accordi: { quando: string } | null;
  primoCliente: { nome: string; email: string; esempio: boolean } | null;
  tono: Tono;
};

export const BENVENUTO_INIZIALE: Benvenuto = {
  v: 1,
  fatto: false,
  passo: 0,
  verificato: false,
  studio: "",
  logo: null,
  accordi: null,
  primoCliente: null,
  tono: "amichevole",
};

// ——— Regole ———

export function regolePassword(p: string) {
  return { lunghezza: p.length >= 8, lettera: /\p{L}/u.test(p), numero: /\d/.test(p) };
}

export const passwordValida = (p: string) => Object.values(regolePassword(p)).every(Boolean);

export function nuovoCodice(rand: () => number = Math.random): string {
  return String(Math.floor(rand() * 1_000_000)).padStart(6, "0");
}

export const pulisciCodice = (t: string) => t.replace(/\D/g, "").slice(0, 6);

export const codiceGiusto = (inserito: string, atteso: string) => pulisciCodice(inserito) === atteso;

export const emailValida = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

const TIPI_LOGO: Record<string, boolean> = { "image/png": false, "image/jpeg": false, "image/webp": false, "image/svg+xml": true };
const MAX_LOGO = 5 * 1024 * 1024;

export function controllaLogo(f: { name: string; type: string; size: number }): { ok: true; vettoriale: boolean } | { ok: false; motivo: string } {
  if (!(f.type in TIPI_LOGO)) return { ok: false, motivo: "Carica un logo PNG, JPG, WebP o SVG" };
  if (f.size > MAX_LOGO) return { ok: false, motivo: "Il logo è troppo pesante: al massimo 5 MB" };
  return { ok: true, vettoriale: TIPI_LOGO[f.type] };
}

// Senza email verificata si riparte dall'accesso; il finale vuole gli accordi accettati.
export function passoDiRipartenza(b: Benvenuto): Passo {
  if (!b.verificato) return 0;
  if (b.passo === 5 && !b.accordi) return 2;
  return b.passo;
}

export function leggiBenvenuto(storage: Pick<Storage, "getItem"> | null): Benvenuto {
  try {
    const dati = JSON.parse(storage?.getItem(CHIAVE) ?? "null");
    if (!dati || dati.v !== 1) return BENVENUTO_INIZIALE;
    return { ...BENVENUTO_INIZIALE, ...dati };
  } catch {
    return BENVENUTO_INIZIALE;
  }
}

// ——— Stato nel browser ———

const CHIAVE = "benvenuto";

let attuale: Benvenuto | null = null;
const ascolti = new Set<() => void>();

function archivio(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const leggi = () => (attuale ??= leggiBenvenuto(archivio()));

function scrivi(b: Benvenuto) {
  attuale = b;
  try {
    archivio()?.setItem(CHIAVE, JSON.stringify(b));
  } catch {
    // navigazione privata: vale per questa visita
  }
  ascolti.forEach((l) => l());
}

const iscrivi = (l: () => void) => {
  ascolti.add(l);
  return () => {
    ascolti.delete(l);
  };
};

export function useBenvenuto(): Benvenuto {
  return useSyncExternalStore(iscrivi, leggi, () => BENVENUTO_INIZIALE);
}

export const aggiornaBenvenuto = (parte: Partial<Benvenuto>) => scrivi({ ...leggi(), ...parte });
export const completaBenvenuto = () => scrivi({ ...leggi(), fatto: true });
// Per rifare la demo: si riparte da zero ma si tiene il tono scelto per Leo.
export const azzeraBenvenuto = () => scrivi({ ...BENVENUTO_INIZIALE, tono: leggi().tono });
