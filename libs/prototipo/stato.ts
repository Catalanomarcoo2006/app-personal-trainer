// Stato condiviso del prototipo, in memoria: resta mentre si cambia pagina, si azzera ricaricando.
// Tiene i video degli esercizi, le schede in modifica e quelle inviate ai clienti.

import { useEffect, useSyncExternalStore } from "react";
import { clients, defaultPlan, exerciseById, library, plans, trainer, type PlanDay } from "./dati-finti";

// ——— Tipi della scheda ———

// Una riga: esercizio della libreria (exId) oppure scritto a mano / letto dal PDF (name).
// video: link scelto per questa riga; se manca vale quello dell'esercizio in libreria.
export type Row = { exId?: string; name?: string; sets: string; load: string; rest: string; key: string; fresh?: boolean; video?: string };
export type Day = { label: string; focus: string; rows: Row[] };

export type SentPlan = {
  id: string;
  clientId: string;
  fileName: string;
  url: string; // PDF generato nel browser (blob)
  days: Day[];
  exercises: number;
  withVideo: number;
  time: string;
};

let seq = 0;
export const nextKey = () => `r${++seq}`;

const fromPlan = (days: PlanDay[]): Day[] => days.map((d) => ({ ...d, rows: d.rows.map((r) => ({ ...r, key: nextKey() })) }));

// Video dimostrativi della demo: ricerche su YouTube, al posto dei video che il trainer caricherà sul suo canale.
// Alcuni esercizi restano senza video apposta, per mostrare come si collega.
const withoutVideo = new Set(["abductor", "pallof", "ripetute", "french"]);
export const demoVideo = (name: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} esecuzione corretta`)}`;

type State = {
  videos: Record<string, string>; // exId → link
  plans: Record<string, Day[]>; // clientId → scheda in modifica
  sent: SentPlan[];
  replied: string[]; // schede a cui il cliente ha già risposto in chat
  trainerPhoto: string | null; // foto scelta dal trainer (data URL), null = quella della demo
};

let state: State = {
  videos: Object.fromEntries(library.filter((e) => !withoutVideo.has(e.id)).map((e) => [e.id, demoVideo(e.name)])),
  plans: Object.fromEntries(clients.map((c) => [c.id, fromPlan(plans[c.id] ?? defaultPlan)])),
  sent: [],
  replied: [],
  trainerPhoto: null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function useStato<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(state),
  );
}

export const stato = {
  get: () => state,
  setPlan(clientId: string, fn: (days: Day[]) => Day[]) {
    state = { ...state, plans: { ...state.plans, [clientId]: fn(state.plans[clientId]) } };
    emit();
  },
  setLibraryVideo(exId: string, url: string | null) {
    const videos = { ...state.videos };
    if (url) videos[exId] = url;
    else delete videos[exId];
    state = { ...state, videos };
    emit();
  },
  addSent(plan: SentPlan) {
    state = { ...state, sent: [...state.sent, plan] };
    emit();
  },
  markReplied(id: string) {
    state = { ...state, replied: [...state.replied, id] };
    emit();
  },
  setTrainerPhoto(url: string | null) {
    state = { ...state, trainerPhoto: url };
    try {
      if (url) localStorage.setItem(PHOTO_KEY, url);
      else localStorage.removeItem(PHOTO_KEY);
    } catch {
      // senza archivio del browser la foto resta solo fino al prossimo ricaricamento
    }
    emit();
  },
};

// ——— Foto del trainer ———
// Scelta dalle Impostazioni, rimpicciolita nel browser e ricordata in questo browser (localStorage).

const PHOTO_KEY = "pt-foto-trainer";
let photoLoaded = false;

// La foto da mostrare: quella scelta dal trainer, altrimenti quella della demo.
export function useTrainerPhoto(): string {
  const chosen = useStato((s) => s.trainerPhoto);
  useEffect(() => {
    if (photoLoaded) return;
    photoLoaded = true;
    try {
      const saved = localStorage.getItem(PHOTO_KEY);
      if (saved) stato.setTrainerPhoto(saved);
    } catch {
      // archivio non disponibile: resta la foto della demo
    }
  }, []);
  return chosen ?? trainer.photo;
}

// Legge l'immagine scelta e la riduce a un quadrato di 256 px (JPEG): pesa pochi KB.
export function shrinkPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.86));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("immagine non leggibile"));
    };
    img.src = url;
  });
}

// ——— Aiuti ———

export const rowName = (r: Row) => r.name ?? exerciseById(r.exId ?? "")?.name ?? "Esercizio";

// Il video di una riga: quello scelto per la riga, altrimenti quello dell'esercizio in libreria.
export const rowVideo = (r: Row, videos: Record<string, string>) => r.video ?? (r.exId ? videos[r.exId] : undefined);

// Il video di un esercizio cercato per nome (app del cliente).
export const videoByName = (name: string, videos: Record<string, string>) => {
  const ex = library.find((e) => e.name.toLowerCase() === name.toLowerCase());
  return ex ? videos[ex.id] : undefined;
};

export const isLink = (v: string) => /^https?:\/\/\S+\.\S+/i.test(v.trim());

// "youtube.com", "instagram.com": per mostrare da dove viene il video.
export const linkHost = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
