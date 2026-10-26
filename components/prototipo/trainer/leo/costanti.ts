
// Misure e costanti di Leo, condivise tra il tasto, la chat e la tela.

export const BARRA_MAX_PX = 112; // altezza massima della casella del messaggio (~6 righe)

// L'assistente del trainer si chiama Leo.
export const COACH_NAME = "Leo";

// ——— Misure, in px della tela ———

// Chat chiusa: Leo in piedi nell'angolo in basso a destra della home (in-piedi.webp).
export const STAND_RATIO = 294 / 640; // larghezza / altezza di in-piedi.webp
export const STAND_RIGHT = 74; // centro della figura, dal bordo destro della tela
export const FLOOR = 14; // i piedi poggiano 14 px sopra il bordo inferiore

// Chat aperta: Leo si sporge dal bordo destro della chat, aggrappato con le mani (spunta.webp).
export const LEAN_W = 112;
export const LEAN_H = Math.round(LEAN_W / (385 / 560));
export const LEAN_EDGE = 0.1276; // dove cade il bordo a cui si tiene, in frazione della larghezza: a sinistra le dita, a destra il corpo
export const LEAN_BODY = Math.round(LEAN_W * (1 - LEAN_EDGE)); // quanto spazio occupa a destra della chat
export const LEAN_BOTTOM = 26; // distanza dal fondo della chat

export const PANEL_W = 410;
export const PANEL_TOP = 112;
export const PANEL_LEFT_MIN = 84; // a destra della barra laterale

export const POP = { type: "spring" as const, duration: 0.5, bounce: 0.3 };

// Leo sulla home si illumina a intervalli per dire che si può toccare: 1,4 s di luce, poi 2,2 s di pausa.
export const PULSE = { duration: 1.4, pause: 2.2, first: 1.6 };

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// la chat durante il viaggio: un riquadro piccolo in basso, Leo resta aggrappato al bordo
export const COMPATTA = { w: 168, h: 150 };

// Barra laterale: fuori dalla home si allunga e in fondo ospita la testa di Leo (sotto una lineetta).
// leoTop: dove inizia la testa, misurato dal centro della barra (che sta a 50% + 40 px della tela).
export const BARRA_LATO = { h: 420, conLeo: 484, leoTop: 180, leo: 44 };
