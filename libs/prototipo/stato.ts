// Stato condiviso del prototipo, in memoria: resta mentre si cambia pagina, si azzera ricaricando.
// Tiene i video degli esercizi, le schede in modifica e quelle inviate ai clienti, il calendario di questa
// settimana e della prossima (anche Leo lo modifica) e le conversazioni con i clienti.

import { useEffect, useSyncExternalStore } from "react";
import { conta } from "@/libs/ui/testo";
import { seduteIniziali } from "./calendario";
import { clients, conversations, defaultPlan, exerciseById, library, plans, trainer, type ChatMessage, type PlanDay } from "./dati-finti";
import type { Seduta } from "./leo-azioni";
import { datiIniziali } from "@/libs/dati/iniziali";
import type { DatiClienti } from "@/libs/dati/tipi";

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

// Dove guardare dopo un'azione di Leo: il calendario o la chat la usano per evidenziare e animare.
// seq cresce a ogni azione, così la stessa seduta si può evidenziare due volte di fila.
// daScrivere: la chat dei messaggi scrive il testo nella barra prima che il messaggio parta.
// multiplo: lo stesso messaggio a più clienti (clientiIds), la chat mostra quanti l'hanno ricevuto.
export type FocusLeo = {
  seq: number;
  tipo: "fissa" | "sposta" | "cancella" | "messaggio" | "multiplo";
  id?: string;
  clientId?: string;
  clientiIds?: string[];
  da?: { date: string; time: string };
  testo?: string;
  daScrivere?: boolean;
};

export const planReply = "Grazie! La guardo subito, i video sono comodissimi 💪";

// Il messaggio con il PDF della scheda inviata da Schede.
export const sentMessage = (p: SentPlan): ChatMessage => ({
  from: "trainer",
  text: "Ecco la tua nuova scheda! Sotto ogni esercizio trovi il video dell’esecuzione.",
  time: p.time,
  attachment: { name: p.fileName, url: p.url, detail: `${conta(p.days.length, "giorno", "giorni")} · ${conta(p.exercises, "esercizio", "esercizi")} · ${p.withVideo} video` },
});

type State = {
  videos: Record<string, string>; // exId → link
  plans: Record<string, Day[]>; // clientId → scheda in modifica
  sent: SentPlan[];
  replied: string[]; // schede a cui il cliente ha già risposto in chat
  trainerPhoto: string | null; // foto scelta dal trainer (data URL), null = quella della demo
  sedute: Seduta[]; // settimane 0 e 1 del calendario
  threads: Record<string, ChatMessage[]>; // clientId → messaggi
  focus: FocusLeo | null;
  dati: DatiClienti; // clienti, pacchetti, pagamenti, misure, notifiche: si cambiano solo dallo sportello (libs/dati)
};

let state: State = {
  videos: Object.fromEntries(library.filter((e) => !withoutVideo.has(e.id)).map((e) => [e.id, demoVideo(e.name)])),
  plans: Object.fromEntries(clients.map((c) => [c.id, fromPlan(plans[c.id] ?? defaultPlan)])),
  sent: [],
  replied: [],
  trainerPhoto: null,
  sedute: seduteIniziali(),
  threads: Object.fromEntries(conversations.map((c) => [c.clientId, c.messages])),
  focus: null,
  dati: datiIniziali(),
};

let idSeduta = state.sedute.length;
let seqFocus = 0;

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
    stato.addMessage(plan.clientId, sentMessage(plan));
  },
  markReplied(id: string) {
    const plan = state.sent.find((p) => p.id === id);
    state = { ...state, replied: [...state.replied, id] };
    if (plan) stato.addMessage(plan.clientId, { from: "client", text: planReply, time: "Adesso" });
    else emit();
  },
  addSeduta(s: Omit<Seduta, "id">): Seduta {
    const nuova = { ...s, id: `A${++idSeduta}` };
    state = { ...state, sedute: [...state.sedute, nuova] };
    emit();
    return nuova;
  },
  updateSeduta(id: string, patch: Partial<Omit<Seduta, "id">>) {
    state = { ...state, sedute: state.sedute.map((s) => (s.id === id ? { ...s, ...patch } : s)) };
    emit();
  },
  removeSeduta(id: string) {
    state = { ...state, sedute: state.sedute.filter((s) => s.id !== id) };
    emit();
  },
  // rimette una seduta tolta (annulla), al suo posto nell'elenco se c'era già
  putSeduta(s: Seduta) {
    state = { ...state, sedute: state.sedute.some((x) => x.id === s.id) ? state.sedute.map((x) => (x.id === s.id ? s : x)) : [...state.sedute, s] };
    emit();
  },
  addMessage(clientId: string, m: ChatMessage) {
    state = { ...state, threads: { ...state.threads, [clientId]: [...(state.threads[clientId] ?? []), m] } };
    emit();
  },
  // solo per lo sportello dei dati (libs/dati/sportello.ts): le pagine e Leo passano da lì
  setDati(fn: (d: DatiClienti) => DatiClienti) {
    state = { ...state, dati: fn(state.dati) };
    emit();
  },
  setFocus(f: Omit<FocusLeo, "seq"> | null) {
    state = { ...state, focus: f ? { ...f, seq: ++seqFocus } : null };
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
