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
