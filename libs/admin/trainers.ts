// Le operazioni del pannello admin sui trainer (piano v1, Task 7): crea con invito, rinnova, sospendi.
// Girano con la chiave di servizio: chi le chiama (app/admin/actions.ts) ha già controllato che sia l'admin.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";
import { createAdminClient } from "@/libs/supabase/admin";
import { slugify, validateSlug } from "@/libs/slug";
import { aggiungiMesi, romeDayKey } from "@/libs/domain/time";

type Db = SupabaseClient<Database>;

export type CreaTrainerErrore = "email_esistente" | "email_formato" | "nome_vuoto" | "slug_riservato" | "slug_formato" | "slug_occupato";
export type CreaTrainerEsito =
  | { ok: true; trainerId: string; slug: string; licenseExpiresAt: string; inviteLink: string }
  | { ok: false; error: CreaTrainerErrore };

export const ERRORI_TRAINER: Record<CreaTrainerErrore, string> = {
  email_esistente: "Questa email ha già un account (trainer o cliente): usane un'altra",
  email_formato: "L'email non è scritta bene",
  nome_vuoto: "Manca il nome del trainer",
  slug_riservato: "Questo indirizzo è riservato all'app: scegline un altro",
  slug_formato: "L'indirizzo può avere solo lettere minuscole, numeri e trattini (da 3 a 40 caratteri)",
  slug_occupato: "Questo indirizzo è già di un altro trainer: scegline un altro",
};

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const unAnnoDopo = (giorno: string) => aggiungiMesi(giorno, 12);

// Crea l'utente con un link d'invito (nessuna email partita da Supabase: la manda chi chiama, o Marco copia il link),
// il profilo "trainer" e la riga trainers con la licenza di un anno. Se un passo fallisce, annulla i precedenti.
export async function createTrainer(
  input: { name: string; email: string; slug?: string; siteUrl: string; today?: string },
  db: Db = createAdminClient(),
): Promise<CreaTrainerEsito> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) return { ok: false, error: "nome_vuoto" };
  if (!EMAIL.test(email)) return { ok: false, error: "email_formato" };

  const slug = input.slug?.trim() ? input.slug.trim() : slugify(name);
  const v = validateSlug(slug);
  if ("reason" in v) return { ok: false, error: v.reason === "riservato" ? "slug_riservato" : "slug_formato" };
  const occupato = await db.from("trainers").select("id").eq("slug", slug).maybeSingle();
  if (occupato.data) return { ok: false, error: "slug_occupato" };

  const link = await db.auth.admin.generateLink({ type: "invite", email });
  if (link.error) {
    if (link.error.code === "email_exists" || link.error.status === 422) return { ok: false, error: "email_esistente" };
    throw new Error(`Invito non creato: ${link.error.message}`);
  }
  const userId = link.data.user.id;
  const annulla = async () => {
    await db.from("profiles").delete().eq("id", userId);
    await db.auth.admin.deleteUser(userId);
  };

  const profilo = await db.from("profiles").insert({ id: userId, role: "trainer" });
  if (profilo.error) {
    await annulla();
    throw new Error(`Profilo non creato: ${profilo.error.message}`);
  }

  const licenseExpiresAt = unAnnoDopo(input.today ?? romeDayKey(new Date()));
  const trainer = await db.from("trainers").insert({ user_id: userId, name, slug, license_expires_at: licenseExpiresAt }).select("id").single();
  if (trainer.error) {
    await annulla();
    if (trainer.error.code === "23505") return { ok: false, error: "slug_occupato" }; // preso nel frattempo
    throw new Error(`Trainer non creato: ${trainer.error.message}`);
  }

  const inviteLink = `${input.siteUrl}/api/auth/confirm?token_hash=${encodeURIComponent(link.data.properties.hashed_token)}&type=invite`;
  return { ok: true, trainerId: trainer.data.id, slug, licenseExpiresAt, inviteLink };
}

// Un anno in più dalla scadenza attuale, o da oggi se è già scaduta; il trainer torna attivo.
export async function renewTrainer(trainerId: string, db: Db = createAdminClient(), today = romeDayKey(new Date())): Promise<string> {
  const { data, error } = await db.from("trainers").select("license_expires_at").eq("id", trainerId).single();
  if (error) throw new Error(`Trainer non trovato: ${error.message}`);
  const base = data.license_expires_at > today ? data.license_expires_at : today;
  const nuova = unAnnoDopo(base);
  const r = await db.from("trainers").update({ license_expires_at: nuova, status: "active" }).eq("id", trainerId);
  if (r.error) throw new Error(`Rinnovo non riuscito: ${r.error.message}`);
  return nuova;
}

// Sospendere non cancella nulla: le regole di accesso chiudono la porta a lui e ai suoi clienti.
export async function setTrainerStatus(trainerId: string, status: "active" | "suspended", db: Db = createAdminClient()): Promise<void> {
  const r = await db.from("trainers").update({ status }).eq("id", trainerId).select("id").single();
  if (r.error) throw new Error(`Stato non cambiato: ${r.error.message}`);
}

// Un nuovo link d'invito per un trainer che non ha ancora scelto la password (il primo scade dopo 24 ore).
export async function newInviteLink(trainerId: string, siteUrl: string, db: Db = createAdminClient()): Promise<string> {
  const t = await db.from("trainers").select("user_id").eq("id", trainerId).single();
  if (t.error) throw new Error(`Trainer non trovato: ${t.error.message}`);
  const u = await db.auth.admin.getUserById(t.data.user_id);
  if (u.error || !u.data.user.email) throw new Error("Utente del trainer non trovato");
  // chi ha già scelto la password riceve un link di recupero, chi no un nuovo invito
  const type = u.data.user.last_sign_in_at ? "recovery" : "invite";
  const link = await db.auth.admin.generateLink({ type, email: u.data.user.email });
  if (link.error) throw new Error(`Link non creato: ${link.error.message}`);
  return `${siteUrl}/api/auth/confirm?token_hash=${encodeURIComponent(link.data.properties.hashed_token)}&type=${type}`;
}
