// Dalle righe del database alla forma che usano le pagine del prototipo (magazzino e dati-finti).
// Funzioni pure, senza Supabase: le usa il caricamento sul server (carica.ts) e le provano i test.
// Il verso opposto, dalle pagine al database, è in salva.ts.

import type { Tables } from "@/types/db";
import type { ClienteDati, DatiClienti, Misura, Notifiche, Pacchetto, Pagamento } from "@/libs/dati/tipi";
import { library, type Alert, type AppointmentType, type ChatMessage, type DatiVeri, type NotificationKind, type Revenue, type Tone } from "@/libs/prototipo/dati-finti";
import type { Seduta } from "@/libs/prototipo/leo-azioni";
import type { Day, StatoApp } from "@/libs/prototipo/stato";
import { needsAttention } from "@/libs/domain/attention";
import { daysBetween, romeDayKey } from "@/libs/domain/time";
import { MESI } from "@/libs/dati/iniziali";

type RigheDb = {
  trainers: Tables<"trainers">;
  clients: Tables<"clients">;
  packages: Tables<"packages">;
  payments: Tables<"payments">;
  measurements: Tables<"measurements">;
  sessions: Tables<"sessions">;
  messages: Tables<"messages">;
  workout_plans: Tables<"workout_plans">;
  plan_days: Tables<"plan_days">;
  plan_exercises: Tables<"plan_exercises">;
  workout_logs: Tables<"workout_logs">;
  alerts: Tables<"alerts">;
  ai_messages: Tables<"ai_messages">;
};
type Riga<K extends keyof RigheDb> = RigheDb[K];

// Tutto quello che il trainer (o il cliente) può leggere, così come arriva dal database.
export type RigheTrainer = {
  trainer: Pick<Riga<"trainers">, "id" | "name" | "slug" | "color" | "logo_path" | "notifications">;
  clients: Omit<Riga<"clients">, "user_id" | "trainer_id" | "status" | "consent_at">[];
  packages: Riga<"packages">[];
  payments: Riga<"payments">[];
  measurements: Riga<"measurements">[];
  sessions: Riga<"sessions">[];
  messages: Riga<"messages">[];
  plans: Riga<"workout_plans">[];
  days: Riga<"plan_days">[];
  exercises: Riga<"plan_exercises">[];
  logs: Riga<"workout_logs">[];
  alerts: Riga<"alerts">[];
  questions: Pick<Riga<"ai_messages">, "client_id" | "content" | "created_at">[];
};

export type Fotografia = {
  stato: Partial<Omit<StatoApp, "focus">>;
  veri: DatiVeri;
  clienteIo?: string; // nell'app del cliente: il suo id
  registrato?: boolean; // nell'app del cliente: ha già dato il consenso (registrazione fatta)
};

// ——— Date e ore nel fuso italiano ———

const oraRoma = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hour12: false });
const GIORNI_BREVI = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

export const dataRoma = (ts: string) => romeDayKey(new Date(ts));
export const oraDi = (ts: string) => oraRoma.format(new Date(ts));

// "2026-10-21" + "18:00" ora italiana → istante UTC (ISO), anche a cavallo dell'ora legale.
export function istanteDa(data: string, ora: string): string {
  const [y, m, d] = data.split("-").map(Number);
  const [hh, mm] = ora.split(":").map(Number);
  const comeUtc = Date.UTC(y, m - 1, d, hh, mm);
  // quanto è avanti l'Italia in quel momento: si prova con l'istante "come se fosse UTC" e si corregge
  const scarto = (t: number) => {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Rome", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(t));
    const v = (k: string) => Number(p.find((x) => x.type === k)?.value);
    return Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute")) - t;
  };
  let t = comeUtc - scarto(comeUtc);
  t = comeUtc - scarto(t);
  return new Date(t).toISOString();
}

// "Dal 05 Ott 2026"
const dal = (ts: string) => {
  const g = dataRoma(ts);
  return `Dal ${g.slice(8, 10)} ${MESI[Number(g.slice(5, 7)) - 1]} ${g.slice(0, 4)}`;
};

// "10:20" oggi, "Lun 18:40" negli altri giorni (come nelle chat della demo)
export function quandoMessaggio(ts: string, oggi: string): string {
  const g = dataRoma(ts);
  if (g === oggi) return oraDi(ts);
  const [y, m, d] = g.split("-").map(Number);
  return `${GIORNI_BREVI[new Date(y, m - 1, d).getDay()]} ${oraDi(ts)}`;
}

// "8 min fa", "2 h fa", "Ieri", "3 giorni fa"
export function quantoFa(ts: string, ora: Date): string {
  const min = Math.max(0, Math.round((ora.getTime() - new Date(ts).getTime()) / 60000));
  if (min < 60) return `${Math.max(1, min)} min fa`;
  if (min < 24 * 60 && dataRoma(ts) === romeDayKey(ora)) return `${Math.round(min / 60)} h fa`;
  const giorni = daysBetween(dataRoma(ts), romeDayKey(ora));
  return giorni <= 1 ? "Ieri" : `${giorni} giorni fa`;
}

function ultimoAllenamento(ultimo: string | undefined, oggi: string): string {
  if (!ultimo) return "Mai";
  const n = daysBetween(ultimo, oggi);
  return n <= 0 ? "Oggi" : n === 1 ? "Ieri" : `${n} giorni fa`;
}

const iniziali = (nome: string) =>
  nome
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

const num = (v: number | null | undefined) => (v === null || v === undefined ? undefined : Number(v));
const TIPI: AppointmentType[] = ["Workout", "Valutazione", "Online", "Corsa"];
const TONI: Tone[] = ["peach", "sky", "rose", "violet", "mint"];
const MESI_LUNGHI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const titolo = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ——— Pezzi ———

export function sedutaDa(s: Riga<"sessions">): Seduta {
  return {
    id: s.id,
    clientId: s.client_id,
    date: dataRoma(s.starts_at),
    time: oraDi(s.starts_at),
    minutes: s.duration_min,
    type: (TIPI as string[]).includes(s.kind) ? (s.kind as AppointmentType) : "Workout",
    place: s.place,
  };
}

export function misuraDa(m: Riga<"measurements">): Misura {
  const v: Misura = { id: m.id, clientId: m.client_id, takenOn: m.taken_on };
  const metti = (k: keyof Misura, x: number | null) => {
    if (x !== null) (v as Record<string, unknown>)[k] = Number(x);
  };
  metti("weightKg", m.weight_kg);
  metti("waistCm", m.waist_cm);
  metti("hipsCm", m.hips_cm);
  metti("chestCm", m.chest_cm);
  metti("armCm", m.arm_cm);
  metti("thighCm", m.thigh_cm);
  if (!m.confirmed) v.daConfermare = true;
  return v;
}

export function pagamentoDa(p: Riga<"payments">): Pagamento | null {
  if (!p.client_id) return null; // le pagine conoscono solo i pagamenti dei clienti
  return { id: p.id, clientId: p.client_id, packageId: p.package_id, description: p.description, amountCents: p.amount_cents, dueOn: p.due_on, paidOn: p.paid_on };
}

// Lezioni usate = sedute del pacchetto fatte, o fissate e già passate (spec: sedute "done"; nel calendario
// dell'app una seduta passata e non annullata vale come fatta).
export function pacchettoDa(p: Riga<"packages">, sedute: Riga<"sessions">[], adesso: Date): Pacchetto {
  const usate = new Set(
    sedute.filter((s) => s.package_id === p.id && (s.status === "done" || (s.status === "scheduled" && new Date(s.starts_at) < adesso))).map((s) => s.id),
  ).size;
  return {
    id: p.id,
    clientId: p.client_id,
    kind: p.kind,
    label: p.label || (p.kind === "lessons" ? `Pacchetto ${p.lessons_total} lezioni` : "Abbonamento"),
    lessonsTotal: p.lessons_total,
    lessonsUsed: usate,
    startsOn: p.starts_on,
    endsOn: p.ends_on,
    priceCents: p.price_cents,
  };
}

export function schedaDa(pianoId: string | undefined, giorni: Riga<"plan_days">[], esercizi: Riga<"plan_exercises">[]): Day[] {
  if (!pianoId) return [];
  return giorni
    .filter((g) => g.plan_id === pianoId)
    .sort((a, b) => a.position - b.position)
    .map((g) => ({
      label: g.label,
      focus: g.focus,
      rows: esercizi
        .filter((e) => e.day_id === g.id)
        .sort((a, b) => a.position - b.position)
        .map((e) => {
          // un esercizio della libreria base si riconosce dal nome: torna a essere quello (con il suo video)
          const base = library.find((x) => x.name.toLowerCase() === (e.name ?? "").toLowerCase());
          return { ...(base ? { exId: base.id } : { name: e.name ?? "Esercizio" }), sets: e.sets, load: e.load, rest: e.rest, key: e.id, ...(e.notes.startsWith("http") ? { video: e.notes } : {}) };
        }),
    }));
}

function messaggioDa(m: Riga<"messages">, oggi: string): ChatMessage {
  return { from: m.sender === "trainer" ? "trainer" : "client", text: m.body, time: quandoMessaggio(m.created_at, oggi) };
}

// Gli ultimi 6 mesi di incassi, il mese di oggi e il confronto con quello prima.
export function incassiDa(pagamenti: Riga<"payments">[], oggi: string): Revenue {
  const mesi = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Number(oggi.slice(0, 4)), Number(oggi.slice(5, 7)) - 1 - (5 - i), 1);
    return { chiave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, mese: d.getMonth(), anno: d.getFullYear() };
  });
  const incassato = (chiave: string) => pagamenti.filter((p) => p.paid_on?.startsWith(chiave)).reduce((s, p) => s + p.amount_cents, 0) / 100;
  const valori = mesi.map((m) => incassato(m.chiave));
  const questo = valori[5];
  const prima = valori[4];
  const daIncassare = pagamenti.filter((p) => !p.paid_on).reduce((s, p) => s + p.amount_cents, 0) / 100;
  const primo = mesi[0];
  const ultimo = mesi[5];
  return {
    month: titolo(MESI_LUNGHI[ultimo.mese]),
    prevMonth: MESI_LUNGHI[mesi[4].mese],
    range: `${MESI_LUNGHI[primo.mese].slice(0, 3)}${primo.anno !== ultimo.anno ? ` ${primo.anno}` : ""} – ${MESI_LUNGHI[ultimo.mese].slice(0, 3)} ${ultimo.anno}`,
    collected: questo,
    outstanding: daIncassare,
    // il previsto: quello che si è incassato più quello che manca
    forecast: questo + daIncassare,
    delta: prima > 0 ? Math.round(((questo - prima) / prima) * 100) : 0,
    months: mesi.map((m, i) => ({ label: MESI[m.mese], value: valori[i] })),
  };
}

const NOTIFICHE_PREDEFINITE: Notifiche = { dolore: true, spostamento: true, pacchetti: true, riepilogo: false, avvisoDolori: true };

// ——— Il trainer ———

export function fotografiaTrainer(r: RigheTrainer, ora: Date): Fotografia {
  const oggi = romeDayKey(ora);
  const sedute = r.sessions.filter((s) => s.status !== "cancelled");
  const pianoAttivo = (clientId: string) => r.plans.find((p) => p.client_id === clientId && p.active);
  const ultimoLog = (clientId: string) =>
    r.logs
      .filter((l) => l.client_id === clientId)
      .map((l) => l.done_on)
      .sort()
      .at(-1);

  const clienti: ClienteDati[] = r.clients.map((c, i) => {
    const ultimo = ultimoLog(c.id);
    const piano = pianoAttivo(c.id);
    return {
      id: c.id,
      name: c.name,
      gender: c.gender === "uomo" ? "uomo" : "donna",
      initials: iniziali(c.name),
      tone: (TONI as string[]).includes(c.tone) ? (c.tone as Tone) : TONI[i % TONI.length],
      since: dal(c.created_at),
      goalLabel: c.goal_label || "Da definire",
      goalUnit: c.goal_unit,
      goalStart: num(c.goal_start) ?? 0,
      goalCurrent: num(c.goal_current) ?? num(c.goal_start) ?? 0,
      goalTarget: num(c.goal_target) ?? 0,
      notes: c.notes,
      lastWorkout: ultimoAllenamento(ultimo, oggi),
      // un cliente appena aggiunto non è "da seguire": lo diventa dopo una settimana senza allenamenti
      needsAttention: daysBetween(dataRoma(c.created_at), oggi) >= 7 && needsAttention(ultimo ? new Date(`${ultimo}T12:00:00Z`) : null, new Date(`${oggi}T12:00:00Z`)),
      plan: piano ? piano.name : "Da preparare",
      questions: r.questions
        .filter((q) => q.client_id === c.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 3)
        .map((q) => q.content),
      ...(c.email ? { email: c.email } : {}),
      ...(c.phone ? { phone: c.phone } : {}),
      ...(c.weigh_frequency ? { pesata: c.weigh_frequency as ClienteDati["pesata"] } : {}),
      ...(c.goal_proposed_start !== null && c.goal_proposed_target !== null ? { obiettivoProposto: { start: Number(c.goal_proposed_start), target: Number(c.goal_proposed_target) } } : {}),
    };
  });

  // un pacchetto per cliente nelle pagine: il più recente
  const pacchetti = clienti.flatMap((c) => {
    const p = r.packages.filter((x) => x.client_id === c.id).sort((a, b) => b.starts_on.localeCompare(a.starts_on))[0];
    return p ? [pacchettoDa(p, r.sessions, ora)] : [];
  });

  const dati: DatiClienti = {
    clienti,
    pacchetti,
    pagamenti: r.payments.map(pagamentoDa).filter((p): p is Pagamento => !!p),
    misure: r.measurements.map(misuraDa),
    notifiche: { ...NOTIFICHE_PREDEFINITE, ...(r.trainer.notifications as Partial<Notifiche>) },
  };

  const perCliente = new Map<string, Riga<"messages">[]>();
  [...r.messages].sort((a, b) => a.created_at.localeCompare(b.created_at)).forEach((m) => perCliente.set(m.client_id, [...(perCliente.get(m.client_id) ?? []), m]));
  const threads = Object.fromEntries([...perCliente].map(([id, ms]) => [id, ms.map((m) => messaggioDa(m, oggi))]));
  const conversations = [...perCliente]
    .sort((a, b) => b[1].at(-1)!.created_at.localeCompare(a[1].at(-1)!.created_at))
    .map(([clientId, ms]) => ({ clientId, unread: ms.filter((m) => m.sender === "client" && !m.read_at).length, messages: threads[clientId] }));

  const nome = (id: string | null) => clienti.find((c) => c.id === id)?.name ?? "Cliente";
  const dolori = r.alerts.filter((a) => a.kind === "pain" && !a.read && a.client_id);
  const ultimiDaiClienti = [...r.messages]
    .filter((m) => m.sender === "client")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .filter((m, i, tutti) => tutti.findIndex((x) => x.client_id === m.client_id) === i);
  const alerts: Alert[] = [
    ...dolori.map((a) => ({ clientId: a.client_id!, text: a.text, urgent: true })),
    ...ultimiDaiClienti.map((m) => ({ clientId: m.client_id, text: m.body })),
  ];

  type Evento = { kind: NotificationKind; clientId: string; text: string; ts: string; to: "cliente" | "messaggi" | "incassi" };
  const eventi: Evento[] = [
    ...r.logs.map((l) => ({ kind: "allenamento" as const, clientId: l.client_id, text: "ha completato un allenamento", ts: l.created_at, to: "cliente" as const })),
    ...r.measurements.filter((m) => m.weight_kg !== null).map((m) => ({ kind: "misure" as const, clientId: m.client_id, text: "ha aggiornato le misure", ts: m.created_at, to: "cliente" as const })),
    ...r.alerts.map((a) => ({ kind: "messaggio" as const, clientId: a.client_id ?? "", text: a.kind === "change_request" ? "chiede di spostare una seduta" : a.kind === "pain" ? "ha segnalato un dolore" : a.text, ts: a.created_at, to: "messaggi" as const })),
    ...r.payments.filter((p) => p.paid_on && p.client_id).map((p) => ({ kind: "pagamento" as const, clientId: p.client_id!, text: `ha pagato ${p.description.toLowerCase()} · € ${p.amount_cents / 100}`, ts: p.created_at, to: "incassi" as const })),
  ];
  const notifications = eventi
    .filter((e) => clienti.some((c) => c.id === e.clientId))
    .sort((a, b) => b.ts.localeCompare(a.ts))
    .slice(0, 5)
    .map(({ ts, ...e }) => ({ ...e, when: quantoFa(ts, ora) }));

  return {
    stato: {
      dati,
      sedute: sedute.map(sedutaDa),
      threads,
      plans: Object.fromEntries(clienti.map((c) => [c.id, schedaDa(pianoAttivo(c.id)?.id, r.days, r.exercises)])),
      videos: {},
      sent: [],
      replied: [],
      documenti: [],
    },
    veri: {
      trainer: { name: r.trainer.name, initials: iniziali(r.trainer.name), photo: FOTO_VUOTA, color: r.trainer.color },
      pathCards: clienti.slice(0, 3).map((c) => c.id),
      revenue: incassiDa(r.payments, oggi),
      alerts,
      notifications,
      conversations,
      urgent: dolori.map((a) => ({ kind: "dolore" as const, clientId: a.client_id!, title: "Dolore segnalato", detail: `${nome(a.client_id)} · ${a.text}` })),
    },
  };
}

// La foto di chi non ne ha ancora caricata una (le foto arriveranno con lo Storage).
export const FOTO_VUOTA = "/brand/persona.svg";

// ——— Il cliente ———

export type RigheCliente = Omit<RigheTrainer, "trainer" | "clients" | "alerts" | "questions"> & {
  trainer: { name: string; color: string };
  io: Omit<Riga<"clients">, "user_id" | "status" | "notes" | "created_at"> & { created_at?: string };
};

export function fotografiaCliente(r: RigheCliente, ora: Date): Fotografia {
  const base = fotografiaTrainer(
    {
      ...r,
      trainer: { id: r.io.trainer_id, name: r.trainer.name, slug: "", color: r.trainer.color, logo_path: null, notifications: {} },
      clients: [{ ...r.io, notes: "", created_at: r.io.created_at ?? ora.toISOString() }],
      alerts: [],
      questions: [],
    },
    ora,
  );
  const p = base.stato.dati!.pacchetti[0];
  return {
    ...base,
    clienteIo: r.io.id,
    registrato: !!r.io.consent_at,
    veri: {
      ...base.veri,
      cliente: { name: r.io.name.split(" ")[0], lessonsLeft: p && p.kind === "lessons" ? Math.max(0, (p.lessonsTotal ?? 0) - p.lessonsUsed) : 0 },
    },
  };
}
