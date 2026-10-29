// Dal magazzino al database: dopo ogni cambiamento (pagine, Leo, "Annulla") si confronta lo stato di adesso con
// quello già salvato e si scrivono solo le differenze. Così le pagine e lo sportello restano quelli della demo.
// differenze() è pura (la provano i test); scrivi() le manda a Supabase con le regole di accesso di chi è collegato.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesInsert } from "@/types/db";
import type { ClienteDati, Misura, Pacchetto, Pagamento } from "@/libs/dati/tipi";
import type { ChatMessage } from "@/libs/prototipo/dati-finti";
import type { Seduta } from "@/libs/prototipo/leo-azioni";
import { rowName, type Day, type StatoApp } from "@/libs/prototipo/stato";
import { istanteDa } from "./mappa";

type Db = SupabaseClient<Database>;
export type Ruolo = { tipo: "trainer"; trainerId: string } | { tipo: "cliente"; clientId: string };
type Salvato = Pick<StatoApp, "dati" | "sedute" | "threads" | "plans">;

export type Operazione =
  | { t: "clients"; op: "insert" | "update"; id: string; v: Partial<TablesInsert<"clients">> }
  | { t: "clients"; op: "delete"; id: string }
  | { t: "packages"; op: "insert" | "update"; id: string; v: Partial<TablesInsert<"packages">> }
  | { t: "packages"; op: "delete"; id: string }
  | { t: "payments"; op: "insert" | "update"; id: string; v: Partial<TablesInsert<"payments">> }
  | { t: "payments"; op: "delete"; id: string }
  | { t: "measurements"; op: "insert" | "update"; id: string; v: Partial<TablesInsert<"measurements">> }
  | { t: "measurements"; op: "delete"; id: string }
  | { t: "sessions"; op: "insert" | "update"; id: string; v: Partial<TablesInsert<"sessions">> }
  | { t: "messages"; op: "insert"; v: TablesInsert<"messages"> }
  | { t: "notifiche"; v: Database["public"]["Tables"]["trainers"]["Update"]["notifications"] }
  | { t: "scheda"; clientId: string; giorni: Day[] }
  | { t: "registrazione"; v: Database["public"]["Functions"]["complete_registration"]["Args"] };

const uguali = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// Per ogni elenco con id: aggiunti, cambiati, tolti.
function confronta<T extends { id: string }>(prima: T[], dopo: T[]) {
  const vecchi = new Map(prima.map((x) => [x.id, x]));
  const nuovi = new Map(dopo.map((x) => [x.id, x]));
  return {
    aggiunti: dopo.filter((x) => !vecchi.has(x.id)),
    cambiati: dopo.filter((x) => vecchi.has(x.id) && !uguali(vecchi.get(x.id), x)),
    tolti: prima.filter((x) => !nuovi.has(x.id)),
  };
}

const colonneCliente = (c: ClienteDati): Partial<TablesInsert<"clients">> => ({
  name: c.name,
  email: c.email ?? null,
  phone: c.phone ?? null,
  gender: c.gender,
  tone: c.tone,
  goal_label: c.goalLabel,
  goal_unit: c.goalUnit,
  goal_start: c.goalStart,
  goal_current: c.goalCurrent,
  goal_target: c.goalTarget,
  goal_proposed_start: c.obiettivoProposto?.start ?? null,
  goal_proposed_target: c.obiettivoProposto?.target ?? null,
  weigh_frequency: c.pesata ?? null,
  notes: c.notes,
});

const colonnePacchetto = (p: Pacchetto): Partial<TablesInsert<"packages">> => ({
  client_id: p.clientId,
  kind: p.kind,
  label: p.label,
  lessons_total: p.lessonsTotal,
  starts_on: p.startsOn,
  ends_on: p.endsOn,
  price_cents: p.priceCents,
});

const colonnePagamento = (p: Pagamento, trainerId: string): Partial<TablesInsert<"payments">> => ({
  trainer_id: trainerId,
  client_id: p.clientId,
  package_id: p.packageId,
  amount_cents: p.amountCents,
  due_on: p.dueOn,
  paid_on: p.paidOn,
  description: p.description,
});

const colonneMisura = (m: Misura): Partial<TablesInsert<"measurements">> => ({
  client_id: m.clientId,
  taken_on: m.takenOn,
  weight_kg: m.weightKg ?? null,
  waist_cm: m.waistCm ?? null,
  hips_cm: m.hipsCm ?? null,
  chest_cm: m.chestCm ?? null,
  arm_cm: m.armCm ?? null,
  thigh_cm: m.thighCm ?? null,
  confirmed: !m.daConfermare,
});

const colonneSeduta = (s: Seduta, trainerId: string): Partial<TablesInsert<"sessions">> => ({
  trainer_id: trainerId,
  client_id: s.clientId,
  starts_at: istanteDa(s.date, s.time),
  duration_min: s.minutes,
  kind: s.type,
  place: s.place,
  online: s.type === "Online",
});

// Messaggi nuovi: quelli in più in fondo a ogni conversazione, scritti da chi è collegato.
function messaggiNuovi(prima: Record<string, ChatMessage[]>, dopo: Record<string, ChatMessage[]>, da: "trainer" | "client"): Operazione[] {
  return Object.entries(dopo).flatMap(([clientId, ms]) =>
    ms
      .slice(prima[clientId]?.length ?? 0)
      .filter((m) => m.from === da && m.text.trim())
      .map((m) => ({ t: "messages" as const, op: "insert" as const, v: { client_id: clientId, sender: da, body: m.text.slice(0, 1000) } })),
  );
}

export function differenze(prima: Salvato, dopo: Salvato, ruolo: Ruolo): Operazione[] {
  const ops: Operazione[] = [];

  if (ruolo.tipo === "cliente") {
    // il cliente scrive le sue misure, i suoi messaggi e i dati della registrazione
    const m = confronta(prima.dati.misure, dopo.dati.misure);
    m.aggiunti.filter((x) => x.clientId === ruolo.clientId).forEach((x) => ops.push({ t: "measurements", op: "insert", id: x.id, v: { id: x.id, ...colonneMisura(x) } }));
    m.tolti.filter((x) => x.daConfermare).forEach((x) => ops.push({ t: "measurements", op: "delete", id: x.id }));
    const io = (d: Salvato) => d.dati.clienti.find((c) => c.id === ruolo.clientId);
    const a = io(prima);
    const b = io(dopo);
    if (b && (a?.pesata !== b.pesata || !uguali(a?.obiettivoProposto, b.obiettivoProposto)))
      ops.push({
        t: "registrazione",
        v: { p_consent: true, p_gender: b.gender, p_weigh_frequency: b.pesata, p_goal_start: b.obiettivoProposto?.start, p_goal_target: b.obiettivoProposto?.target },
      });
    ops.push(...messaggiNuovi(prima.threads, dopo.threads, "client"));
    return ops;
  }

  const { trainerId } = ruolo;
  const c = confronta(prima.dati.clienti, dopo.dati.clienti);
  c.aggiunti.forEach((x) => ops.push({ t: "clients", op: "insert", id: x.id, v: { id: x.id, trainer_id: trainerId, ...colonneCliente(x) } }));
  c.cambiati.forEach((x) => ops.push({ t: "clients", op: "update", id: x.id, v: colonneCliente(x) }));

  // i pacchetti: lessonsUsed viene dalle sedute, non si salva
  const senzaUsate = (ps: Pacchetto[]) => ps.map((p) => ({ ...p, lessonsUsed: 0 }));
  const p = confronta(senzaUsate(prima.dati.pacchetti), senzaUsate(dopo.dati.pacchetti));
  p.aggiunti.forEach((x) => ops.push({ t: "packages", op: "insert", id: x.id, v: { id: x.id, ...colonnePacchetto(x) } }));
  p.cambiati.forEach((x) => ops.push({ t: "packages", op: "update", id: x.id, v: colonnePacchetto(x) }));

  const g = confronta(prima.dati.pagamenti, dopo.dati.pagamenti);
  g.aggiunti.forEach((x) => ops.push({ t: "payments", op: "insert", id: x.id, v: { id: x.id, ...colonnePagamento(x, trainerId) } }));
  g.cambiati.forEach((x) => ops.push({ t: "payments", op: "update", id: x.id, v: colonnePagamento(x, trainerId) }));
  g.tolti.forEach((x) => ops.push({ t: "payments", op: "delete", id: x.id }));

  const m = confronta(prima.dati.misure, dopo.dati.misure);
  m.aggiunti.forEach((x) => ops.push({ t: "measurements", op: "insert", id: x.id, v: { id: x.id, ...colonneMisura(x) } }));
  m.cambiati.forEach((x) => ops.push({ t: "measurements", op: "update", id: x.id, v: colonneMisura(x) }));
  m.tolti.forEach((x) => ops.push({ t: "measurements", op: "delete", id: x.id }));

  // i pacchetti tolti dopo le misure e i pagamenti che li citano; i clienti tolti per ultimi
  p.tolti.forEach((x) => ops.push({ t: "packages", op: "delete", id: x.id }));

  if (!uguali(prima.dati.notifiche, dopo.dati.notifiche)) ops.push({ t: "notifiche", v: dopo.dati.notifiche });

  // sedute: una seduta tolta resta nel database come annullata
  const s = confronta(prima.sedute, dopo.sedute);
  s.aggiunti.forEach((x) => ops.push({ t: "sessions", op: "insert", id: x.id, v: { id: x.id, ...colonneSeduta(x, trainerId) } }));
  s.cambiati.forEach((x) => ops.push({ t: "sessions", op: "update", id: x.id, v: { ...colonneSeduta(x, trainerId), status: "scheduled" } }));
  s.tolti.forEach((x) => ops.push({ t: "sessions", op: "update", id: x.id, v: { status: "cancelled" } }));

  ops.push(...messaggiNuovi(prima.threads, dopo.threads, "trainer"));

  Object.entries(dopo.plans).forEach(([clientId, giorni]) => {
    if (!uguali(prima.plans[clientId], giorni) && dopo.dati.clienti.some((x) => x.id === clientId)) ops.push({ t: "scheda", clientId, giorni });
  });

  c.tolti.forEach((x) => ops.push({ t: "clients", op: "delete", id: x.id }));
  return ops;
}

// ——— Scrittura ———

async function scriviScheda(db: Db, clientId: string, giorni: Day[]) {
  const esistente = await db.from("workout_plans").select("id").eq("client_id", clientId).eq("active", true).maybeSingle();
  if (esistente.error) throw esistente.error;
  let planId = esistente.data?.id;
  if (!planId) {
    const nuovo = await db.from("workout_plans").insert({ client_id: clientId, name: "Scheda" }).select("id").single();
    if (nuovo.error) throw nuovo.error;
    planId = nuovo.data.id;
  } else {
    const via = await db.from("plan_days").delete().eq("plan_id", planId);
    if (via.error) throw via.error;
  }
  for (const [i, g] of giorni.entries()) {
    const d = await db.from("plan_days").insert({ plan_id: planId, position: i, label: g.label, focus: g.focus }).select("id").single();
    if (d.error) throw d.error;
    if (!g.rows.length) continue;
    const r = await db.from("plan_exercises").insert(
      g.rows.map((row, j) => ({ day_id: d.data.id, position: j, name: rowName(row), sets: row.sets, load: row.load, rest: row.rest, notes: row.video ?? "" })),
    );
    if (r.error) throw r.error;
  }
}

export async function scrivi(db: Db, ops: Operazione[], ruolo: Ruolo): Promise<void> {
  for (const o of ops) {
    let r: { error: { message: string } | null };
    if (o.t === "notifiche") {
      if (ruolo.tipo !== "trainer") continue;
      r = await db.from("trainers").update({ notifications: o.v }).eq("id", ruolo.trainerId);
    } else if (o.t === "scheda") {
      await scriviScheda(db, o.clientId, o.giorni);
      continue;
    } else if (o.t === "registrazione") {
      r = await db.rpc("complete_registration", o.v);
    } else if (o.t === "messages") {
      r = await db.from("messages").insert(o.v);
    } else if (o.op === "delete") {
      r = await db.from(o.t).delete().eq("id", o.id);
    } else if (o.op === "insert") {
      r = await db.from(o.t).insert(o.v as never);
    } else {
      r = await db.from(o.t).update(o.v as never).eq("id", o.id);
    }
    if (r.error) throw new Error(`${o.t}: ${r.error.message}`);
  }
}

// ——— Il salvataggio continuo ———
// Si aspetta un attimo dopo l'ultimo cambiamento (chi scrive una scheda cambia lo stato a ogni tasto), poi si
// salvano le differenze, una scrittura alla volta, nell'ordine in cui sono avvenute.

export function avviaSalvataggio(o: {
  db: Db;
  ruolo: Ruolo;
  leggi: () => Salvato;
  ascolta: (fn: () => void) => () => void;
  errore: (messaggio: string) => void;
  attesa?: number;
}): () => void {
  let salvato = o.leggi();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let coda = Promise.resolve();

  const salva = () => {
    coda = coda.then(async () => {
      const adesso = o.leggi();
      const ops = differenze(salvato, adesso, o.ruolo);
      salvato = adesso;
      if (!ops.length) return;
      try {
        await scrivi(o.db, ops, o.ruolo);
      } catch (e) {
        console.error("Salvataggio non riuscito", e);
        o.errore("Una modifica non è stata salvata: ricarica la pagina e riprova");
      }
    });
  };

  const smetti = o.ascolta(() => {
    clearTimeout(timer);
    timer = setTimeout(salva, o.attesa ?? 500);
  });
  // chiudendo la pagina si salva subito quello che resta
  const subito = () => {
    clearTimeout(timer);
    salva();
  };
  if (typeof window !== "undefined") window.addEventListener("pagehide", subito);
  return () => {
    smetti();
    if (typeof window !== "undefined") window.removeEventListener("pagehide", subito);
    subito();
  };
}
