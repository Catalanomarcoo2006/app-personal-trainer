// Dati inventati per il prototipo visivo (Task 1). Nessun dato reale.

export const trainer = {
  name: "Marco Rossi",
  role: "Personal trainer",
  initials: "MR",
  color: "#FF6B2C",
  today: "21 Ottobre",
  month: "Ottobre 2026",
  sessionsToday: 4,
  openAlerts: 3,
};

export type MonthRow = {
  label: string;
  value: number;
  format: "euro" | "number";
  suffix?: string;
  right: { kind: "badge"; text: string } | { kind: "icon"; icon: "users" | "clock" | "info" | "calendar" };
};

export const monthRows: MonthRow[] = [
  { label: "Incassi del mese", value: 2840, format: "euro", right: { kind: "badge", text: "+12%" } },
  { label: "Clienti attivi", value: 24, format: "number", suffix: " clienti", right: { kind: "icon", icon: "users" } },
  { label: "Sedute di oggi", value: 4, format: "number", suffix: " · prossima alle 18:00", right: { kind: "icon", icon: "clock" } },
  { label: "Pacchetti in scadenza", value: 3, format: "number", suffix: " da rinnovare", right: { kind: "icon", icon: "info" } },
  { label: "Da seguire", value: 2, format: "number", suffix: " clienti fermi da 7 giorni", right: { kind: "icon", icon: "calendar" } },
];

export type PathCard = {
  since: string;
  client: string;
  goal: string;
  percent: number;
  left: string;
  days: string[];
  tone: "peach" | "sky" | "rose";
};

export const pathCards: PathCard[] = [
  { since: "Dal 05 Ott 2026", client: "Giulia Bianchi", goal: "Dimagrimento · −8 kg", percent: 62, left: "2 lezioni rimaste", days: ["L", "M", "V"], tone: "peach" },
  { since: "Dal 08 Set 2026", client: "Luca Ferri", goal: "Mezza maratona", percent: 50, left: "5 lezioni rimaste", days: ["M", "G", "S"], tone: "sky" },
  { since: "Dal 12 Ago 2026", client: "Sara Conti", goal: "Tonificazione", percent: 70, left: "Scade tra 8 giorni", days: ["L", "G", "V"], tone: "rose" },
];

export type DayKind = "default" | "done" | "planned" | "plannedLight" | "check" | "payment" | "event";

// Stessa disposizione di colori del riferimento; il giorno selezionato si sceglie cliccando.
export const calendarDays: { day: number; kind: DayKind; tip: string }[] = Array.from({ length: 28 }, (_, i) => {
  const day = i + 1;
  const map: Record<number, [DayKind, string]> = {
    6: ["plannedLight", "1 seduta programmata"],
    7: ["done", "3 sedute fatte"],
    8: ["done", "2 sedute fatte"],
    12: ["check", "Valutazione iniziale di Sara"],
    13: ["planned", "2 sedute programmate"],
    15: ["planned", "3 sedute programmate"],
    17: ["done", "4 sedute fatte"],
    18: ["planned", "2 sedute programmate"],
    20: ["done", "3 sedute fatte"],
    23: ["payment", "Rinnovo pacchetto di Giulia"],
    25: ["done", "2 sedute fatte"],
    27: ["event", "Workshop di gruppo"],
  };
  const [kind, tip] = map[day] ?? ["default", "Nessuna seduta"];
  return { day, kind, tip };
});

export type Alert = { from: string; initials: string; text: string; urgent?: boolean };

export const alerts: Alert[] = [
  { from: "Giulia Bianchi", initials: "GB", text: "Posso spostare la seduta di giovedì alle 18 a venerdì?" },
  { from: "Luca Ferri", initials: "LF", text: "Fastidio al ginocchio durante gli affondi: segnalato dall'assistente", urgent: true },
  { from: "Sara Conti", initials: "SC", text: "Pacchetto in scadenza: resta 1 lezione" },
];

// ——— Cliente ———

export const client = {
  name: "Giulia",
  goal: "Obiettivo −8 kg",
  goalDetail: "Partenza 72 kg · oggi 68,9 kg",
  goalPercent: 39,
  since: "Dal 05 Ott 2026",
  lessonsLeft: 7,
  weekDone: ["L", "M"],
  nextSession: { when: "Giovedì 23, ore 18:00", where: "Fit Lab, Meolo" },
  weight: [72, 71.6, 71.1, 70.8, 70.2, 69.9, 69.4, 68.9],
  water: { done: 1.5, target: 2 },
  steps: 7420,
};

export type Exercise = { name: string; detail: string };

export const workout = {
  title: "Giorno A · Gambe e glutei",
  exercises: [
    { name: "Squat con bilanciere", detail: "4 × 10 · 40 kg · recupero 90″" },
    { name: "Affondi camminati", detail: "3 × 12 per gamba · manubri 8 kg" },
    { name: "Hip thrust", detail: "4 × 12 · 50 kg · recupero 75″" },
    { name: "Plank", detail: "3 × 45″ · recupero 45″" },
  ] satisfies Exercise[],
};

export const assistantSuggestions = [
  "Come faccio lo squat?",
  "Come sto andando?",
  "Oggi non ho il bilanciere",
  "Mi fa male il ginocchio",
];

export const assistantAnswers: Record<string, string> = {
  "Come faccio lo squat?":
    "Piedi alla larghezza delle spalle, punte leggermente in fuori. Scendi portando indietro il bacino come per sederti, ginocchia nella direzione delle punte e schiena neutra. Spingi sui talloni per risalire. Oggi hai 4 serie da 10 con 40 kg: se l'ultima ripetizione ti costa troppo, scendi a 35 kg.",
  "Come sto andando?":
    "Benissimo! Hai perso 3,1 kg dall'inizio e sei al 39% del tuo obiettivo. Questa settimana hai già fatto 2 allenamenti su 3. Continua così: giovedì alle 18 c'è la seduta con Marco.",
  "Oggi non ho il bilanciere":
    "Nessun problema: al posto dello squat con bilanciere fai il goblet squat con un manubrio o un kettlebell, stesse 4 serie da 10. Per l'hip thrust puoi appoggiare un manubrio sul bacino.",
  "Mi fa male il ginocchio":
    "Fermati con gli affondi per oggi. Al loro posto fai un ponte glutei a terra, 3 × 15, senza carico. Se il dolore è forte o non passa in qualche giorno, senti un medico. Ho avvisato Marco, che ti scriverà.",
};

export const assistantFallback =
  "Posso aiutarti con il tuo allenamento, gli esercizi e le abitudini. Per l'alimentazione segui la dieta del tuo nutrizionista che trovi nei documenti.";
