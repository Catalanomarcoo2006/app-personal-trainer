// Legge dal database tutto quello che serve alle pagine, con le regole di accesso di chi è collegato (RLS):
// il trainer i suoi clienti, il cliente solo le sue righe. Gira sul server (pagine /dashboard e /<slug>).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";
import { fotografiaCliente, fotografiaTrainer, type Fotografia, type RigheTrainer } from "./mappa";

type Db = SupabaseClient<Database>;

function righe<T>(r: { data: T[] | null; error: { message: string } | null }, cosa: string): T[] {
  if (r.error) throw new Error(`Lettura di ${cosa} non riuscita: ${r.error.message}`);
  return r.data ?? [];
}

// Schede: quelle attive, con giorni ed esercizi.
async function schede(db: Db) {
  const plans = righe(await db.from("workout_plans").select("*").eq("active", true), "schede");
  const ids = plans.map((p) => p.id);
  const days = ids.length ? righe(await db.from("plan_days").select("*").in("plan_id", ids), "giorni delle schede") : [];
  const dayIds = days.map((d) => d.id);
  const exercises = dayIds.length ? righe(await db.from("plan_exercises").select("*").in("day_id", dayIds), "esercizi delle schede") : [];
  return { plans, days, exercises };
}

export async function caricaTrainer(db: Db, trainerId: string, ora = new Date()): Promise<Fotografia> {
  const [t, clients, packages, payments, measurements, sessions, messages, logs, alerts, questions, s] = await Promise.all([
    db.from("trainers").select("id, name, slug, color, logo_path, notifications").eq("id", trainerId).single(),
    db.from("clients").select("id, name, email, phone, gender, tone, goal_label, goal_unit, goal_start, goal_current, goal_target, goal_proposed_start, goal_proposed_target, weigh_frequency, notes, created_at").eq("status", "active").order("created_at"),
    db.from("packages").select("*"),
    db.from("payments").select("*"),
    db.from("measurements").select("*").order("taken_on"),
    db.from("sessions").select("*").order("starts_at"),
    db.from("messages").select("*").order("created_at"),
    db.from("workout_logs").select("*"),
    db.from("alerts").select("*").order("created_at", { ascending: false }).limit(50),
    db.from("ai_messages").select("client_id, content, created_at").eq("role", "user").order("created_at", { ascending: false }).limit(200),
    schede(db),
  ]);
  if (t.error) throw new Error(`Trainer non trovato: ${t.error.message}`);
  const r: RigheTrainer = {
    trainer: t.data,
    clients: righe(clients, "clienti"),
    packages: righe(packages, "pacchetti"),
    payments: righe(payments, "pagamenti"),
    measurements: righe(measurements, "misure"),
    sessions: righe(sessions, "sedute"),
    messages: righe(messages, "messaggi"),
    logs: righe(logs, "allenamenti"),
    alerts: righe(alerts, "avvisi"),
    questions: righe(questions, "domande all'assistente"),
    ...s,
  };
  return fotografiaTrainer(r, ora);
}

export async function caricaCliente(db: Db, slug: string, ora = new Date()): Promise<Fotografia | null> {
  const [io, marchio, packages, payments, measurements, sessions, messages, logs, s] = await Promise.all([
    db.rpc("my_client"),
    db.rpc("trainer_branding", { p_slug: slug }),
    db.from("packages").select("*"),
    db.from("payments").select("*"),
    db.from("measurements").select("*").order("taken_on"),
    db.from("sessions").select("*").order("starts_at"),
    db.from("messages").select("*").order("created_at"),
    db.from("workout_logs").select("*"),
    schede(db),
  ]);
  const cliente = io.data?.[0];
  const m = marchio.data?.[0];
  if (!cliente || !m) return null;
  return fotografiaCliente(
    {
      trainer: { name: m.name, color: m.color },
      io: cliente,
      packages: righe(packages, "pacchetti"),
      payments: righe(payments, "pagamenti"),
      measurements: righe(measurements, "misure"),
      sessions: righe(sessions, "sedute"),
      messages: righe(messages, "messaggi"),
      logs: righe(logs, "allenamenti"),
      ...s,
    },
    ora,
  );
}
