// Suoni brevi sintetizzati con Web Audio: nessun file audio da scaricare o licenziare.
// La preferenza (on/off) resta nel browser con la chiave "suoni".
//
// Tutti nascono dal "pop" del tocco (tap), con tonalità diverse per azione:
// nav = cambio sezione (due pop che salgono), open = si apre qualcosa (più acuto),
// close = si chiude (più grave), confirm e complete = conferme.

export type SoundKind = "tap" | "open" | "close" | "nav" | "confirm" | "complete";

// Un solo suono per gesto: se nello stesso clic partono più suoni (quello generico del clic e quello
// dell'azione), vince il più importante.
const PRIORITY: Record<SoundKind, number> = { tap: 0, open: 1, close: 1, nav: 2, confirm: 3, complete: 4 };

const STORAGE_KEY = "suoni";

let context: AudioContext | null = null;
let enabled: boolean | null = null;
const listeners = new Set<(enabled: boolean) => void>();

export function isSoundEnabled(): boolean {
  if (enabled === null) {
    try {
      enabled = window.localStorage.getItem(STORAGE_KEY) !== "0";
    } catch {
      enabled = true;
    }
  }
  return enabled;
}

export function setSoundEnabled(value: boolean): void {
  enabled = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // storage non disponibile (navigazione privata): la scelta vale per questa pagina
  }
  listeners.forEach((listener) => listener(value));
}

export function onSoundChange(listener: (enabled: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

// Creare il motore audio costa circa 90 ms: lo prepariamo quando il dito o il mouse si appoggia
// (pointerdown), così al clic vero è già pronto e non rallenta il cambio di pagina.
if (typeof window !== "undefined") {
  const prepare = () => {
    window.removeEventListener("pointerdown", prepare, true);
    window.removeEventListener("keydown", prepare, true);
    if (isSoundEnabled()) audio();
  };
  window.addEventListener("pointerdown", prepare, true);
  window.addEventListener("keydown", prepare, true);
}

// Una nota con attacco rapido e coda morbida: è quello che rende il suono "pop" e non un bip.
function note(ac: AudioContext, at: number, from: number, to: number, duration: number, gain: number, type: OscillatorType = "sine") {
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + duration);
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.004);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

// Il "pop": nota che scende di tono con una punta brillante sopra. pitch lo alza o lo abbassa.
function pop(ac: AudioContext, at: number, pitch: number, gain = 0.07) {
  note(ac, at, 720 * pitch, 420 * pitch, 0.07, gain);
  note(ac, at, 1440 * pitch, 840 * pitch, 0.04, gain * 0.17, "triangle");
}

let pending: SoundKind | null = null;

export function playSound(kind: SoundKind): void {
  if (typeof window === "undefined" || !isSoundEnabled()) return;
  // Prima di un clic il browser blocca l'audio: non ci proviamo nemmeno.
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  // Si suona a fine evento (setTimeout 0), così tutti i suoni chiesti dallo stesso clic si contendono il posto.
  if (pending === null) window.setTimeout(flush, 0);
  if (pending === null || PRIORITY[kind] > PRIORITY[pending]) pending = kind;
}

function flush() {
  const kind = pending;
  pending = null;
  if (kind) render(kind);
}

function render(kind: SoundKind): void {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;

  if (kind === "tap") {
    pop(ac, t, 1);
    if ("vibrate" in navigator) navigator.vibrate?.(8);
  } else if (kind === "open") {
    pop(ac, t, 1.19); // una terza minore sopra
    if ("vibrate" in navigator) navigator.vibrate?.(8);
  } else if (kind === "close") {
    pop(ac, t, 0.84, 0.06); // una terza minore sotto, appena più piano
  } else if (kind === "nav") {
    pop(ac, t, 0.94, 0.055);
    pop(ac, t + 0.055, 1.26, 0.065); // secondo pop una quarta sopra: "si va avanti"
    if ("vibrate" in navigator) navigator.vibrate?.(8);
  } else if (kind === "confirm") {
    note(ac, t, 880, 860, 0.09, 0.06);
    note(ac, t + 0.07, 1320, 1300, 0.12, 0.05);
    if ("vibrate" in navigator) navigator.vibrate?.(12);
  } else {
    [660, 880, 1100, 1320].forEach((freq, i) => note(ac, t + i * 0.065, freq, freq, 0.18, 0.05));
    if ("vibrate" in navigator) navigator.vibrate?.([10, 40, 10]);
  }
}

// ——— Suoni delle animazioni ———
// Non nascono da un clic ma accompagnano un'animazione (numeri che contano, telefono che sale, notifiche).
// Il browser li permette solo dopo il primo clic o tasto sulla pagina: prima tacciono (vedi audioSbloccato).

export function audioSbloccato(): boolean {
  if (typeof window === "undefined" || !isSoundEnabled()) return false;
  return !navigator.userActivation || navigator.userActivation.hasBeenActive;
}

// Curva dei numeri che contano (EASE_OUT di components/ui/motion: cubic-bezier(0.22, 1, 0.36, 1)):
// avanzamento del numero a un certo punto del tempo, entrambi da 0 a 1.
function easeOut(x: number): number {
  const [x1, y1, x2, y2] = [0.22, 1, 0.36, 1];
  const bez = (t: number, a: number, b: number) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (bez(mid, x1, x2) < x) lo = mid;
    else hi = mid;
  }
  return bez((lo + hi) / 2, y1, y2);
}

// Numeri che salgono: ticchettio fitto all'inizio che si dirada (segue la curva del conteggio) e sale di tono,
// poi un "ding" quando il numero si ferma. ritardo e durata in secondi, come le animazioni.
export function suonoConteggio({ ritardo = 0, durata = 0.9, scatti = 22, volume = 1 }: { ritardo?: number; durata?: number; scatti?: number; volume?: number } = {}): void {
  if (!audioSbloccato()) return;
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + ritardo;
  let ultimo = 0;
  const passi = 240;
  for (let i = 1; i <= passi; i++) {
    const x = i / passi;
    const scatto = Math.min(scatti, Math.floor(easeOut(x) * scatti));
    if (scatto > ultimo) {
      ultimo = scatto;
      const at = t0 + x * durata;
      const f = 900 + (scatto / scatti) * 900;
      note(ac, at, f, f * 0.92, 0.024, 0.022 * volume, "triangle");
    }
  }
  const fine = t0 + durata;
  note(ac, fine, 1568, 1560, 0.32, 0.03 * volume);
  note(ac, fine + 0.01, 2349, 2340, 0.22, 0.012 * volume);
}

let rumore: AudioBuffer | null = null;
function bufferRumore(ac: AudioContext): AudioBuffer {
  if (rumore && rumore.sampleRate === ac.sampleRate) return rumore;
  const b = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  rumore = b;
  return b;
}

// Soffio di vento che sale (rumore filtrato che passa dal grave all'acuto), poi un tocco morbido quando
// quello che saliva si appoggia. Per il telefono che spunta dal basso nel benvenuto.
export function suonoVento(ritardo = 0, durata = 0.75): void {
  if (!audioSbloccato()) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + ritardo;
  const src = ac.createBufferSource();
  src.buffer = bufferRumore(ac);
  const filtro = ac.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.Q.value = 0.9;
  filtro.frequency.setValueAtTime(260, t);
  filtro.frequency.exponentialRampToValueAtTime(2200, t + durata * 0.75);
  filtro.frequency.exponentialRampToValueAtTime(1400, t + durata);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(0.11, t + durata * 0.45);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + durata);
  src.connect(filtro).connect(amp).connect(ac.destination);
  src.start(t);
  src.stop(t + durata + 0.05);
  pop(ac, t + durata * 0.9, 0.62, 0.05);
}

// Notifica che arriva: due note brevi e leggere che salgono.
export function suonoNotifica(volume = 1): void {
  if (!audioSbloccato()) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  note(ac, t, 1175, 1170, 0.12, 0.022 * volume);
  note(ac, t + 0.08, 1568, 1560, 0.18, 0.02 * volume);
}

// Schede che entrano una dopo l'altra: un pop leggero per ciascuna, ogni "passo" secondi dopo "ritardo".
export function suonoComparse(quante: number, ritardo = 0, passo = 0.09): void {
  if (!audioSbloccato()) return;
  const ac = audio();
  if (!ac) return;
  for (let i = 0; i < quante; i++) pop(ac, ac.currentTime + ritardo + i * passo, 1.1 + i * 0.06, 0.03);
}
