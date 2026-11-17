// Link d'accesso del cliente e "password dimenticata" del trainer, con le nostre email (Resend, in italiano)
// invece di quelle di Supabase. Gira con la chiave di servizio: chi chiama non è collegato, quindi qui si
// controlla tutto. A chi chiede si risponde sempre allo stesso modo (non si rivela chi è registrato): queste
// funzioni tornano l'email da mandare, o null se non c'è niente da mandare.
// Al massimo un link al minuto per account (app_metadata.ultimo_link): niente raffiche di email a un cliente.

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/db";
import { accessoCliente, nuovaPassword, type Email } from "@/libs/email/modelli";
import { indirizzoMarchio } from "@/libs/vera/marchio";
import { validateSlug } from "@/libs/slug";

type Db = SupabaseClient<Database>;
export type DaMandare = { a: string; email: Email; mittente?: string };

export const PAUSA_LINK_MS = 60_000;

const emailValida = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;
// per ilike: % e _ valgono come lettere, non come jolly
const esatta = (e: string) => e.replace(/[\\%_]/g, (c) => `\\${c}`);

export function troppoPresto(ultimo: unknown, ora: Date): boolean {
  if (typeof ultimo !== "string") return false;
  const t = Date.parse(ultimo);
  return Number.isFinite(t) && ora.getTime() - t < PAUSA_LINK_MS;
}

async function segnaLink(db: Db, u: User, ora: Date) {
  await db.auth.admin.updateUserById(u.id, { app_metadata: { ...u.app_metadata, ultimo_link: ora.toISOString() } });
}

const link = (siteUrl: string, hash: string, type: "magiclink" | "recovery", next: string) =>
  `${siteUrl}/api/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=${type}&next=${encodeURIComponent(next)}`;

// Il cliente scrive la sua email nella pagina del suo trainer (/<slug>): solo i clienti attivi già invitati
// (con un accesso) di un trainer attivo ricevono il link.
export async function linkAccessoCliente(db: Db, o: { slug: string; email: string; siteUrl: string; ora?: Date }): Promise<DaMandare | null> {
  const ora = o.ora ?? new Date();
  const email = o.email.trim().toLowerCase();
  if (!emailValida(email) || !validateSlug(o.slug).ok) return null;
  const t = await db.from("trainers").select("*").eq("slug", o.slug).eq("status", "active").maybeSingle();
  if (!t.data) return null;
  const c = await db.from("clients").select("name, user_id").eq("trainer_id", t.data.id).eq("status", "active").ilike("email", esatta(email)).not("user_id", "is", null).limit(1).maybeSingle();
  if (!c.data?.user_id) return null;
  const u = await db.auth.admin.getUserById(c.data.user_id);
  const utente = u.data.user;
  if (u.error || !utente?.email || troppoPresto(utente.app_metadata?.ultimo_link, ora)) return null;
  const l = await db.auth.admin.generateLink({ type: "magiclink", email: utente.email });
  if (l.error) return null;
  await segnaLink(db, utente, ora);
  const trainer = { nome: t.data.name, colore: t.data.color, logo: indirizzoMarchio(t.data.logo_path) };
  return {
    a: utente.email,
    mittente: t.data.name,
    email: accessoCliente({ nome: c.data.name.split(" ")[0], trainer, link: link(o.siteUrl, l.data.properties.hashed_token, "magiclink", `/${o.slug}`) }),
  };
}

// "Password dimenticata" dalla pagina /signin: solo trainer e admin (i clienti entrano senza password).
export async function linkNuovaPassword(db: Db, o: { email: string; siteUrl: string; prodotto: string; ora?: Date }): Promise<DaMandare | null> {
  const ora = o.ora ?? new Date();
  const email = o.email.trim().toLowerCase();
  if (!emailValida(email)) return null;
  const l = await db.auth.admin.generateLink({ type: "recovery", email });
  const utente = l.data?.user;
  if (l.error || !utente?.email) return null;
  const p = await db.from("profiles").select("role").eq("id", utente.id).maybeSingle();
  if (p.data?.role !== "trainer" && p.data?.role !== "admin") return null;
  if (troppoPresto(utente.app_metadata?.ultimo_link, ora)) return null;
  await segnaLink(db, utente, ora);
  return { a: utente.email, email: nuovaPassword({ prodotto: o.prodotto, link: link(o.siteUrl, l.data.properties.hashed_token, "recovery", "/nuova-password") }) };
}
