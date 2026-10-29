// Dati di prova per i test d'integrazione: due trainer, un cliente ciascuno, un admin.
// Tutte le email finiscono in @prova.test: resetTestData cancella solo quelle.

import { adminClient, type Db } from "./supabase";

export const DOMINIO_PROVA = "@prova.test";
const PASSWORD = "Prova-1234-sicura";

export type Utente = { id: string; email: string; password: string };
export type TrainerProva = Utente & { trainerId: string; slug: string };
export type ClienteProva = Utente & { clientId: string; trainerId: string };
export type Seed = { trainerA: TrainerProva; trainerB: TrainerProva; clientA1: ClienteProva; clientB1: ClienteProva; admin: Utente };

const run = () => Math.random().toString(36).slice(2, 8);

function ok<T>(r: { data: T; error: { message: string } | null }, cosa: string): NonNullable<T> {
  if (r.error || r.data == null) throw new Error(`${cosa}: ${r.error?.message ?? "nessun dato"}`);
  return r.data as NonNullable<T>;
}

export async function creaUtente(db: Db, nome: string, ruolo: "admin" | "trainer" | "client"): Promise<Utente> {
  const email = `${nome}-${run()}${DOMINIO_PROVA}`;
  const { user } = ok(await db.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true }), `utente ${email}`);
  ok(await db.from("profiles").insert({ id: user.id, role: ruolo }).select().single(), `profilo ${email}`);
  return { id: user.id, email, password: PASSWORD };
}

async function creaTrainer(db: Db, nome: string): Promise<TrainerProva> {
  const u = await creaUtente(db, nome, "trainer");
  const slug = `${nome}-${run()}`;
  const t = ok(
    await db.from("trainers").insert({ user_id: u.id, name: nome, slug, license_expires_at: "2099-01-01" }).select().single(),
    `trainer ${nome}`,
  );
  return { ...u, trainerId: t.id, slug };
}

async function creaCliente(db: Db, nome: string, trainerId: string): Promise<ClienteProva> {
  const u = await creaUtente(db, nome, "client");
  const c = ok(
    await db
      .from("clients")
      .insert({ trainer_id: trainerId, user_id: u.id, name: nome, email: u.email, notes: `nota privata su ${nome}` })
      .select()
      .single(),
    `cliente ${nome}`,
  );
  // un po' di dati suoi: una misura, un pacchetto, una seduta
  ok(await db.from("measurements").insert({ client_id: c.id, taken_on: "2026-10-01", weight_kg: 70 }).select(), "misura");
  const p = ok(
    await db.from("packages").insert({ client_id: c.id, kind: "lessons", lessons_total: 10, starts_on: "2026-10-01", price_cents: 50000 }).select().single(),
    "pacchetto",
  );
  ok(
    await db
      .from("sessions")
      .insert({ trainer_id: trainerId, client_id: c.id, starts_at: "2026-11-02T09:00:00Z", duration_min: 60, package_id: p.id })
      .select(),
    "seduta",
  );
  return { ...u, clientId: c.id, trainerId };
}

export async function seedTwoTrainers(): Promise<Seed> {
  const db = adminClient();
  const trainerA = await creaTrainer(db, "trainer-a");
  const trainerB = await creaTrainer(db, "trainer-b");
  const clientA1 = await creaCliente(db, "cliente-a1", trainerA.trainerId);
  const clientB1 = await creaCliente(db, "cliente-b1", trainerB.trainerId);
  const admin = await creaUtente(db, "admin", "admin");
  return { trainerA, trainerB, clientA1, clientB1, admin };
}

// Cancella trainer (con tutti i loro dati) e utenti di prova.
export async function resetTestData(): Promise<void> {
  const db = adminClient();
  const ids: string[] = [];
  for (let page = 1; ; page++) {
    const { users } = ok(await db.auth.admin.listUsers({ page, perPage: 1000 }), "elenco utenti");
    ids.push(...users.filter((u) => u.email?.endsWith(DOMINIO_PROVA)).map((u) => u.id));
    if (users.length < 1000) break;
  }
  if (!ids.length) return;
  const del = await db.from("trainers").delete().in("user_id", ids);
  if (del.error) throw new Error(`pulizia trainer: ${del.error.message}`);
  for (const id of ids) {
    const r = await db.auth.admin.deleteUser(id);
    if (r.error) throw new Error(`pulizia utente ${id}: ${r.error.message}`);
  }
}
