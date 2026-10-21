// Dati inventati per il prototipo visivo (Task 1). Nessun dato reale.
// "Oggi" nel prototipo è mercoledì 21 ottobre 2026, ore 10:20.

export const trainer = {
  name: "Marco Rossi",
  role: "Personal trainer",
  initials: "MR",
  photo: "/prototipo/trainer-foto.jpg",
  color: "#FF6B2C",
  today: "21 Ottobre",
  month: "Ottobre 2026",
  now: "10:20",
};

// ——— Clienti ———

export type Tone = "peach" | "sky" | "rose" | "violet" | "mint";

export type Payment = { date: string; label: string; amount: number; paid: boolean };

export type Client = {
  id: string;
  name: string;
  initials: string;
  photo?: string;
  tone: Tone;
  since: string;
  goal: string;
  unit: string;
  start: number;
  current: number;
  target: number;
  weights: number[];
  measures: { label: string; start: number; current: number }[];
  pkg: { label: string; left: string; expiring: boolean };
  payments: Payment[];
  lastWorkout: string;
  needsAttention: boolean;
  plan: string;
  notes: string;
  questions: string[];
  phone: string;
  email: string;
};

// Serie di pesi credibile fra due valori (8 settimane).
const series = (from: number, to: number, wobble = 0.25) =>
  Array.from({ length: 8 }, (_, i) => +(from + ((to - from) * i) / 7 + (i % 2 ? wobble : -wobble) * (i > 0 && i < 7 ? 1 : 0)).toFixed(1));

const m = (vita: [number, number], fianchi: [number, number], petto: [number, number], braccio: [number, number], coscia: [number, number]) => [
  { label: "Vita", start: vita[0], current: vita[1] },
  { label: "Fianchi", start: fianchi[0], current: fianchi[1] },
  { label: "Petto", start: petto[0], current: petto[1] },
  { label: "Braccio", start: braccio[0], current: braccio[1] },
  { label: "Coscia", start: coscia[0], current: coscia[1] },
];

export const clients: Client[] = [
  {
    id: "antonella-russo", name: "Antonella Russo", initials: "AR", tone: "peach", since: "Dal 07 Set 2026",
    goal: "Dimagrimento −6 kg", unit: "kg", start: 70, current: 66.1, target: 64, weights: series(70, 66.1),
    measures: m([82, 77], [101, 97], [92, 90], [30, 29], [58, 56]),
    pkg: { label: "Pacchetto 10 lezioni", left: "6 lezioni rimaste", expiring: false },
    payments: [
      { date: "07 Set", label: "Pacchetto 10 lezioni", amount: 450, paid: true },
      { date: "03 Ott", label: "Valutazione posturale", amount: 40, paid: false },
    ],
    lastWorkout: "Ieri", needsAttention: false, plan: "Giorno A · Total body",
    notes: "Preferisce allenarsi al mattino. Ginocchio destro delicato: niente salti.",
    questions: ["Posso sostituire gli affondi con la cyclette?", "Quanta acqua devo bere nei giorni di allenamento?"],
    phone: "+39 340 000 0101", email: "antonella.russo@esempio.it",
  },
  {
    id: "giulia-bianchi", name: "Giulia Bianchi", initials: "GB", photo: "/prototipo/cliente-giulia.jpg", tone: "rose", since: "Dal 05 Ott 2026",
    goal: "Dimagrimento −8 kg", unit: "kg", start: 72, current: 68.9, target: 64, weights: series(72, 68.9),
    measures: m([86, 82], [104, 101], [95, 93], [31, 30], [60, 58]),
    pkg: { label: "Pacchetto 10 lezioni", left: "2 lezioni rimaste", expiring: true },
    payments: [{ date: "05 Ott", label: "Pacchetto 10 lezioni", amount: 450, paid: true }],
    lastWorkout: "Oggi", needsAttention: false, plan: "Giorno A · Gambe e glutei",
    notes: "Molto motivata. Vuole arrivare in forma per un matrimonio a dicembre.",
    questions: ["Come faccio lo squat?", "Oggi non ho il bilanciere"],
    phone: "+39 340 000 0102", email: "giulia.bianchi@esempio.it",
  },
  {
    id: "luca-ferri", name: "Luca Ferri", initials: "LF", photo: "/prototipo/cliente-luca.jpg", tone: "sky", since: "Dal 08 Set 2026",
    goal: "Mezza maratona (21 km)", unit: "km", start: 8, current: 14.5, target: 21, weights: series(79, 77.4, 0.2),
    measures: m([88, 85], [98, 97], [100, 99], [33, 33], [57, 56]),
    pkg: { label: "Mensile", left: "Scade il 31 ottobre", expiring: false },
    payments: [
      { date: "08 Set", label: "Mensile settembre", amount: 120, paid: true },
      { date: "01 Ott", label: "Mensile ottobre", amount: 120, paid: false },
    ],
    lastWorkout: "Ieri", needsAttention: false, plan: "Corsa · ripetute 4 × 1 km",
    notes: "Gara il 15 marzo. Controllare il ginocchio dopo la segnalazione.",
    questions: ["Mi fa male il ginocchio negli affondi", "Quanto devo correre prima della gara?"],
    phone: "+39 340 000 0103", email: "luca.ferri@esempio.it",
  },
  {
    id: "sara-conti", name: "Sara Conti", initials: "SC", tone: "violet", since: "Dal 12 Ago 2026",
    goal: "Tonificazione", unit: "%", start: 0, current: 70, target: 100, weights: series(61, 59.8, 0.15),
    measures: m([72, 69], [96, 93], [88, 88], [27, 27], [55, 53]),
    pkg: { label: "Pacchetto 10 lezioni", left: "1 lezione rimasta", expiring: true },
    payments: [{ date: "12 Ago", label: "Pacchetto 10 lezioni", amount: 450, paid: true }],
    lastWorkout: "3 giorni fa", needsAttention: false, plan: "Giorno B · Upper body",
    notes: "Ha chiesto di parlare del rinnovo: proporre il pacchetto da 20.",
    questions: ["Posso allenarmi due giorni di fila?"],
    phone: "+39 340 000 0104", email: "sara.conti@esempio.it",
  },
  {
    id: "davide-greco", name: "Davide Greco", initials: "DG", photo: "/prototipo/cliente-davide.jpg", tone: "mint", since: "Dal 01 Lug 2026",
    goal: "Massa muscolare +4 kg", unit: "kg", start: 74, current: 76.2, target: 78, weights: series(74, 76.2, 0.2),
    measures: m([80, 81], [95, 96], [98, 102], [33, 35], [56, 58]),
    pkg: { label: "Trimestrale", left: "Scade il 30 novembre", expiring: false },
    payments: [{ date: "01 Set", label: "Trimestrale set-nov", amount: 330, paid: true }],
    lastWorkout: "Ieri", needsAttention: false, plan: "Push · Pull · Legs",
    notes: "Progressi ottimi sulla panca. Alimentazione seguita dal suo nutrizionista.",
    questions: ["Quante serie per il petto a settimana?"],
    phone: "+39 340 000 0105", email: "davide.greco@esempio.it",
  },
  {
    id: "elena-marini", name: "Elena Marini", initials: "EM", tone: "sky", since: "Dal 20 Set 2026",
    goal: "Postura e schiena", unit: "%", start: 0, current: 40, target: 100, weights: series(58, 57.6, 0.1),
    measures: m([70, 69], [93, 92], [86, 86], [26, 26], [52, 52]),
    pkg: { label: "Online · 8 sedute", left: "5 sedute rimaste", expiring: false },
    payments: [{ date: "20 Set", label: "Online 8 sedute", amount: 240, paid: true }],
    lastWorkout: "9 giorni fa", needsAttention: true, plan: "Mobilità · 20 minuti",
    notes: "Lavora molte ore seduta. Non si allena da 9 giorni: scriverle.",
    questions: ["Che esercizi faccio se ho la schiena rigida al mattino?"],
    phone: "+39 340 000 0106", email: "elena.marini@esempio.it",
  },
  {
    id: "paolo-costa", name: "Paolo Costa", initials: "PC", tone: "peach", since: "Dal 19 Ott 2026",
    goal: "Rimettersi in forma", unit: "%", start: 0, current: 5, target: 100, weights: series(88, 87.6, 0.1),
    measures: m([98, 97], [104, 104], [106, 106], [34, 34], [61, 61]),
    pkg: { label: "Pacchetto 10 lezioni", left: "9 lezioni rimaste", expiring: false },
    payments: [{ date: "19 Ott", label: "Pacchetto 10 lezioni", amount: 450, paid: true }],
    lastWorkout: "2 giorni fa", needsAttention: false, plan: "Valutazione iniziale",
    notes: "Primo mese: costruire l'abitudine, 2 sedute a settimana.",
    questions: [],
    phone: "+39 340 000 0107", email: "paolo.costa@esempio.it",
  },
  {
    id: "chiara-fontana", name: "Chiara Fontana", initials: "CF", tone: "rose", since: "Dal 02 Giu 2026",
    goal: "Dimagrimento −5 kg", unit: "kg", start: 63, current: 59, target: 58, weights: series(63, 59),
    measures: m([76, 70], [99, 94], [90, 88], [28, 27], [56, 53]),
    pkg: { label: "Mensile", left: "Scade il 31 ottobre", expiring: false },
    payments: [{ date: "01 Ott", label: "Mensile ottobre", amount: 120, paid: true }],
    lastWorkout: "8 giorni fa", needsAttention: true, plan: "Circuito metabolico",
    notes: "Quasi all'obiettivo. Non si allena da 8 giorni: proporre una seduta.",
    questions: ["Posso fare addominali tutti i giorni?"],
    phone: "+39 340 000 0108", email: "chiara.fontana@esempio.it",
  },
];

export const clientById = (id: string) => clients.find((c) => c.id === id);

export const progressOf = (c: Client) =>
  Math.round(Math.max(0, Math.min(100, ((c.current - c.start) / (c.target - c.start || 1)) * 100)));

export const toneColors: Record<Tone, { bg: string; strong: string; track: string; sub: string }> = {
  peach: { bg: "var(--color-peach)", strong: "var(--color-peach-strong)", track: "var(--color-peach-track)", sub: "#9b9184" },
  sky: { bg: "var(--color-sky)", strong: "var(--color-sky-strong)", track: "var(--color-sky-track)", sub: "#7f909b" },
  rose: { bg: "var(--color-rose)", strong: "var(--color-rose-strong)", track: "var(--color-rose-track)", sub: "#a08890" },
  violet: { bg: "var(--color-violet)", strong: "var(--color-violet-strong)", track: "var(--color-violet-track)", sub: "#8a85a8" },
  mint: { bg: "var(--color-mint)", strong: "var(--color-mint-strong)", track: "var(--color-mint-track)", sub: "#7a978a" },
};

export const pathCards = ["giulia-bianchi", "luca-ferri", "davide-greco"];

export const quickStats = [
  { key: "clienti", label: "Clienti attivi", value: clients.length, href: "/prototipo/trainer/clienti" },
  { key: "sedute", label: "Sedute di oggi", value: 4, href: "#agenda" },
  { key: "scadenza", label: "Pacchetti in scadenza", value: clients.filter((c) => c.pkg.expiring).length, href: "/prototipo/trainer/clienti?filtro=scadenza" },
  { key: "seguire", label: "Da seguire", value: clients.filter((c) => c.needsAttention).length, href: "/prototipo/trainer/clienti?filtro=seguire" },
] as const;

// ——— Agenda della settimana (lunedì 19 – domenica 25 ottobre) ———

export type AppointmentType = "Workout" | "Valutazione" | "Online" | "Corsa";

export type Appointment = { time: string; minutes: number; clientId: string; type: AppointmentType; place: string };

export const week = [
  { short: "L", long: "Lunedì", n: 19 },
  { short: "M", long: "Martedì", n: 20 },
  { short: "M", long: "Mercoledì", n: 21 },
  { short: "G", long: "Giovedì", n: 22 },
  { short: "V", long: "Venerdì", n: 23 },
  { short: "S", long: "Sabato", n: 24 },
  { short: "D", long: "Domenica", n: 25 },
];

export const TODAY_INDEX = 2;

export const agenda: Appointment[][] = [
  [
    { time: "09:00", minutes: 60, clientId: "giulia-bianchi", type: "Workout", place: "Fit Lab, Meolo" },
    { time: "11:00", minutes: 60, clientId: "antonella-russo", type: "Workout", place: "Fit Lab, Meolo" },
    { time: "18:00", minutes: 45, clientId: "paolo-costa", type: "Valutazione", place: "Fit Lab, Meolo" },
  ],
  [
    { time: "07:30", minutes: 50, clientId: "luca-ferri", type: "Corsa", place: "Parco di Meolo" },
    { time: "12:30", minutes: 40, clientId: "elena-marini", type: "Online", place: "Videochiamata" },
    { time: "19:00", minutes: 60, clientId: "davide-greco", type: "Workout", place: "Fit Lab, Meolo" },
  ],
  [
    { time: "08:30", minutes: 60, clientId: "chiara-fontana", type: "Workout", place: "Fit Lab, Meolo" },
    { time: "11:00", minutes: 60, clientId: "antonella-russo", type: "Workout", place: "Fit Lab, Meolo" },
    { time: "15:00", minutes: 40, clientId: "elena-marini", type: "Online", place: "Videochiamata" },
    { time: "18:00", minutes: 60, clientId: "giulia-bianchi", type: "Workout", place: "Fit Lab, Meolo" },
  ],
  [
    { time: "07:30", minutes: 50, clientId: "luca-ferri", type: "Corsa", place: "Parco di Meolo" },
    { time: "10:00", minutes: 60, clientId: "sara-conti", type: "Workout", place: "Fit Lab, Meolo" },
    { time: "18:30", minutes: 60, clientId: "davide-greco", type: "Workout", place: "Fit Lab, Meolo" },
  ],
  [
    { time: "09:00", minutes: 60, clientId: "antonella-russo", type: "Workout", place: "Fit Lab, Meolo" },
    { time: "18:00", minutes: 60, clientId: "giulia-bianchi", type: "Workout", place: "Fit Lab, Meolo" },
  ],
  [{ time: "10:00", minutes: 60, clientId: "chiara-fontana", type: "Workout", place: "Fit Lab, Meolo" }],
  [],
];

export const appointmentColors: Record<AppointmentType, { bg: string; strong: string }> = {
  Workout: { bg: "var(--color-peach)", strong: "var(--color-peach-strong)" },
  Valutazione: { bg: "var(--color-sky)", strong: "var(--color-sky-strong)" },
  Online: { bg: "var(--color-violet)", strong: "var(--color-violet-strong)" },
  Corsa: { bg: "var(--color-rose)", strong: "var(--color-rose-strong)" },
};

// ——— Cose urgenti ———

export type UrgentKind = "pagamento" | "imminente" | "pacchetto" | "dolore";

export const urgent: { kind: UrgentKind; clientId: string; title: string; detail: string }[] = [
  { kind: "imminente", clientId: "antonella-russo", title: "Workout tra 40 minuti", detail: "Antonella Russo · ore 11:00 · Fit Lab" },
  { kind: "pagamento", clientId: "luca-ferri", title: "Pagamento mancante · € 120", detail: "Luca Ferri · mensile di ottobre" },
  { kind: "pagamento", clientId: "antonella-russo", title: "Pagamento mancante · € 40", detail: "Antonella Russo · valutazione del 3 ottobre" },
  { kind: "dolore", clientId: "luca-ferri", title: "Dolore segnalato", detail: "Luca Ferri · fastidio al ginocchio negli affondi" },
  { kind: "pacchetto", clientId: "sara-conti", title: "Pacchetto quasi finito", detail: "Sara Conti · resta 1 lezione" },
  { kind: "pacchetto", clientId: "giulia-bianchi", title: "Pacchetto quasi finito", detail: "Giulia Bianchi · restano 2 lezioni" },
];

// ——— Incassi ———

export const revenue = {
  month: "Ottobre",
  collected: 2840,
  outstanding: 160,
  forecast: 3400,
  delta: 12,
  months: [
    { label: "Mag", value: 1900 },
    { label: "Giu", value: 2150 },
    { label: "Lug", value: 1700 },
    { label: "Ago", value: 1450 },
    { label: "Set", value: 2540 },
    { label: "Ott", value: 2840 },
  ],
};

// ——— Messaggi dai clienti ———

export type Alert = { clientId: string; text: string; urgent?: boolean };

export const alerts: Alert[] = [
  { clientId: "giulia-bianchi", text: "Posso spostare la seduta di venerdì alle 18 a sabato?" },
  { clientId: "luca-ferri", text: "Fastidio al ginocchio durante gli affondi: segnalato dall'assistente", urgent: true },
  { clientId: "sara-conti", text: "Mi piacerebbe rinnovare il pacchetto, quando ne parliamo?" },
  { clientId: "davide-greco", text: "Nuovo massimale di panca: 90 kg! Grazie per la scheda" },
  { clientId: "elena-marini", text: "Giovedì non riesco a collegarmi, possiamo fare venerdì?" },
];

// ——— App del cliente ———

export const client = {
  name: "Giulia",
  goal: "Obiettivo −8 kg",
  goalDetail: "Partenza 72 kg · oggi 68,9 kg",
  goalPercent: 39,
  since: "Dal 05 Ott 2026",
  lessonsLeft: 2,
  weekDone: ["L", "M"],
  nextSession: { when: "Venerdì 23, ore 18:00", where: "Fit Lab, Meolo" },
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
    "Benissimo! Hai perso 3,1 kg dall'inizio e sei al 39% del tuo obiettivo. Questa settimana hai già fatto 2 allenamenti su 3. Continua così: venerdì alle 18 c'è la seduta con Marco.",
  "Oggi non ho il bilanciere":
    "Nessun problema: al posto dello squat con bilanciere fai il goblet squat con un manubrio o un kettlebell, stesse 4 serie da 10. Per l'hip thrust puoi appoggiare un manubrio sul bacino.",
  "Mi fa male il ginocchio":
    "Fermati con gli affondi per oggi. Al loro posto fai un ponte glutei a terra, 3 × 15, senza carico. Se il dolore è forte o non passa in qualche giorno, senti un medico. Ho avvisato Marco, che ti scriverà.",
};

export const assistantFallback =
  "Posso aiutarti con il tuo allenamento, gli esercizi e le abitudini. Per l'alimentazione segui la dieta del tuo nutrizionista che trovi nei documenti.";

// ——— Schede di allenamento ———

export type Muscle = "Gambe" | "Glutei" | "Petto" | "Schiena" | "Spalle" | "Braccia" | "Core" | "Cardio";

export type LibraryExercise = { id: string; name: string; muscle: Muscle; equipment: string };

export const library: LibraryExercise[] = [
  { id: "squat", name: "Squat con bilanciere", muscle: "Gambe", equipment: "Bilanciere" },
  { id: "goblet", name: "Goblet squat", muscle: "Gambe", equipment: "Manubrio" },
  { id: "affondi", name: "Affondi camminati", muscle: "Gambe", equipment: "Manubri" },
  { id: "leg-press", name: "Leg press", muscle: "Gambe", equipment: "Macchina" },
  { id: "stacco-rumeno", name: "Stacco rumeno", muscle: "Glutei", equipment: "Bilanciere" },
  { id: "hip-thrust", name: "Hip thrust", muscle: "Glutei", equipment: "Bilanciere" },
  { id: "ponte", name: "Ponte glutei", muscle: "Glutei", equipment: "Corpo libero" },
  { id: "abductor", name: "Abduzioni con elastico", muscle: "Glutei", equipment: "Elastico" },
  { id: "panca", name: "Panca piana", muscle: "Petto", equipment: "Bilanciere" },
  { id: "spinte-manubri", name: "Spinte con manubri inclinata", muscle: "Petto", equipment: "Manubri" },
  { id: "piegamenti", name: "Piegamenti", muscle: "Petto", equipment: "Corpo libero" },
  { id: "trazioni", name: "Trazioni alla sbarra", muscle: "Schiena", equipment: "Sbarra" },
  { id: "lat", name: "Lat machine", muscle: "Schiena", equipment: "Macchina" },
  { id: "rematore", name: "Rematore con manubrio", muscle: "Schiena", equipment: "Manubrio" },
  { id: "military", name: "Military press", muscle: "Spalle", equipment: "Bilanciere" },
  { id: "alzate", name: "Alzate laterali", muscle: "Spalle", equipment: "Manubri" },
  { id: "curl", name: "Curl con manubri", muscle: "Braccia", equipment: "Manubri" },
  { id: "french", name: "French press", muscle: "Braccia", equipment: "Bilanciere EZ" },
  { id: "plank", name: "Plank", muscle: "Core", equipment: "Corpo libero" },
  { id: "dead-bug", name: "Dead bug", muscle: "Core", equipment: "Corpo libero" },
  { id: "pallof", name: "Pallof press", muscle: "Core", equipment: "Cavo" },
  { id: "corsa", name: "Corsa a ritmo lento", muscle: "Cardio", equipment: "—" },
  { id: "ripetute", name: "Ripetute 4 × 1 km", muscle: "Cardio", equipment: "—" },
  { id: "bike", name: "Bike a intervalli", muscle: "Cardio", equipment: "Cyclette" },
];

export const exerciseById = (id: string) => library.find((e) => e.id === id);

export type PlanRow = { exId: string; sets: string; load: string; rest: string };
export type PlanDay = { label: string; focus: string; rows: PlanRow[] };

const row = (exId: string, sets: string, load: string, rest: string): PlanRow => ({ exId, sets, load, rest });

export const plans: Record<string, PlanDay[]> = {
  "giulia-bianchi": [
    { label: "Giorno A", focus: "Gambe e glutei", rows: [row("squat", "4 × 10", "40 kg", "90″"), row("affondi", "3 × 12", "8 kg", "75″"), row("hip-thrust", "4 × 12", "50 kg", "75″"), row("plank", "3 × 45″", "—", "45″")] },
    { label: "Giorno B", focus: "Upper body", rows: [row("lat", "4 × 10", "35 kg", "90″"), row("spinte-manubri", "3 × 10", "10 kg", "90″"), row("alzate", "3 × 15", "4 kg", "60″"), row("dead-bug", "3 × 12", "—", "45″")] },
    { label: "Giorno C", focus: "Metabolico", rows: [row("bike", "6 × 1′", "alta", "1′"), row("goblet", "3 × 15", "12 kg", "60″"), row("piegamenti", "3 × 10", "—", "60″")] },
  ],
  "antonella-russo": [
    { label: "Giorno A", focus: "Total body", rows: [row("goblet", "4 × 12", "14 kg", "75″"), row("rematore", "3 × 12", "12 kg", "75″"), row("ponte", "3 × 15", "—", "60″"), row("plank", "3 × 40″", "—", "45″")] },
    { label: "Giorno B", focus: "Cardio e core", rows: [row("bike", "8 × 30″", "alta", "60″"), row("dead-bug", "3 × 12", "—", "45″"), row("pallof", "3 × 10", "8 kg", "45″")] },
  ],
  "luca-ferri": [
    { label: "Corsa", focus: "Ripetute", rows: [row("corsa", "15′", "Z2", "—"), row("ripetute", "4 × 1 km", "4:50/km", "2′"), row("corsa", "10′", "Z1", "—")] },
    { label: "Forza", focus: "Gambe per runner", rows: [row("stacco-rumeno", "3 × 8", "50 kg", "90″"), row("affondi", "3 × 10", "12 kg", "75″"), row("plank", "3 × 60″", "—", "45″")] },
  ],
  "davide-greco": [
    { label: "Push", focus: "Petto, spalle, tricipiti", rows: [row("panca", "5 × 5", "85 kg", "2′"), row("spinte-manubri", "4 × 8", "26 kg", "90″"), row("military", "4 × 8", "45 kg", "90″"), row("french", "3 × 12", "25 kg", "60″")] },
    { label: "Pull", focus: "Schiena e bicipiti", rows: [row("trazioni", "5 × 6", "+5 kg", "2′"), row("rematore", "4 × 10", "32 kg", "90″"), row("curl", "3 × 12", "14 kg", "60″")] },
    { label: "Legs", focus: "Gambe", rows: [row("squat", "5 × 5", "110 kg", "2′30″"), row("leg-press", "4 × 10", "200 kg", "90″"), row("stacco-rumeno", "3 × 8", "90 kg", "2′")] },
  ],
};

export const defaultPlan: PlanDay[] = [
  { label: "Giorno A", focus: "Total body", rows: [row("goblet", "3 × 12", "10 kg", "75″"), row("rematore", "3 × 12", "10 kg", "75″"), row("plank", "3 × 30″", "—", "45″")] },
];

// ——— Messaggi ———

export type ChatMessage = { from: "client" | "trainer" | "assistant"; text: string; time: string };

export const conversations: { clientId: string; unread: number; messages: ChatMessage[] }[] = [
  {
    clientId: "luca-ferri",
    unread: 2,
    messages: [
      { from: "trainer", text: "Com'è andata la corsa di ieri?", time: "Lun 18:40" },
      { from: "client", text: "Bene! 4 ripetute sotto i 5 minuti al km", time: "Lun 19:02" },
      { from: "assistant", text: "Luca ha segnalato un fastidio al ginocchio durante gli affondi. Gli ho proposto il ponte glutei al posto degli affondi e di sentire un medico se il dolore continua.", time: "Mar 20:15" },
      { from: "client", text: "Oggi il ginocchio mi dava un po' fastidio negli affondi", time: "Mar 20:16" },
      { from: "client", text: "Domani faccio comunque la corsa?", time: "Mar 20:17" },
    ],
  },
  {
    clientId: "giulia-bianchi",
    unread: 1,
    messages: [
      { from: "client", text: "Ciao Marco! Ho fatto tutto il Giorno A", time: "Ieri 19:30" },
      { from: "trainer", text: "Grandissima! Venerdì aumentiamo il carico dello squat", time: "Ieri 20:05" },
      { from: "client", text: "Posso spostare la seduta di venerdì alle 18 a sabato?", time: "09:12" },
    ],
  },
  {
    clientId: "sara-conti",
    unread: 1,
    messages: [
      { from: "trainer", text: "Ti resta 1 lezione nel pacchetto", time: "Lun 10:00" },
      { from: "client", text: "Mi piacerebbe rinnovare il pacchetto, quando ne parliamo?", time: "Lun 11:20" },
    ],
  },
  {
    clientId: "davide-greco",
    unread: 0,
    messages: [
      { from: "client", text: "Nuovo massimale di panca: 90 kg! Grazie per la scheda", time: "Dom 12:30" },
      { from: "trainer", text: "Ottimo lavoro! Settimana prossima proviamo il 5 × 5 a 87,5 kg", time: "Dom 13:10" },
    ],
  },
  {
    clientId: "elena-marini",
    unread: 0,
    messages: [{ from: "client", text: "Giovedì non riesco a collegarmi, possiamo fare venerdì?", time: "Lun 08:45" }],
  },
  {
    clientId: "antonella-russo",
    unread: 0,
    messages: [
      { from: "trainer", text: "Ci vediamo oggi alle 11 in palestra", time: "08:00" },
      { from: "client", text: "Perfetto, a dopo!", time: "08:14" },
    ],
  },
];
