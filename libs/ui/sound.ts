// Suoni brevi sintetizzati con Web Audio: nessun file audio da scaricare o licenziare.
// La preferenza (on/off) resta nel browser con la chiave "suoni".

export type SoundKind = "tap" | "confirm" | "complete";

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

export function playSound(kind: SoundKind): void {
  if (typeof window === "undefined" || !isSoundEnabled()) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;

  if (kind === "tap") {
    note(ac, t, 720, 420, 0.07, 0.07);
    note(ac, t, 1440, 840, 0.04, 0.012, "triangle");
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
