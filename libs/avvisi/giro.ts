// Il giro degli avvisi, con la chiave di servizio (solo sul server): per ogni trainer attivo crea gli avvisi dei
// pacchetti che finiscono, manda per email gli avvisi nuovi secondo le sue notifiche e, il lunedì, il riepilogo.
// Lo chiama ogni mattina /api/cron/avvisi; dopo un dolore segnalato lo chiama anche l'app del cliente, solo per
// il suo trainer e solo per i dolori (soloDolori), così l'email parte subito.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/db";
import type { Notifiche } from "@/libs/dati/tipi";
import { avvisiTrainer, riepilogoLunedi, type Email } from "@/libs/email/modelli";
import { avvisiDaMandare, eLunedi, pacchettiDaAvvisare, rigaAvviso, riepilogoSettimana } from "./calcola";

type Db = SupabaseClient<Database>;
type Manda = (a: string, email: Email) => Promise<boolean>;

export type EsitoGiro = { trainer: string; nuoviPacchetti: number; email: number; errori: string[] };

function leggi<T>(r: { data: T[] | null; error: { message: string } | null }, cosa: string): T[] {
  if (r.error) throw new Error(`${cosa}: ${r.error.message}`);
  return r.data ?? [];
}

async function giroTrainer(db: Db, t: Tables<"trainers">, o: { siteUrl: string; prodotto: string; adesso: Date; manda: Manda; soloDolori: boolean }): Promise<EsitoGiro> {
  const esito: EsitoGiro = { trainer: t.slug, nuoviPacchetti: 0, email: 0, errori: [] };
  const clients = leggi(await db.from("clients").select("id, name").eq("trainer_id", t.id).eq("status", "active"), "clienti");
  const nomi = new Map(clients.map((c) => [c.id, c.name.split(" ")[0]]));

  // 1. pacchetti che finiscono → avvisi (uno per pacchetto: l'indice unico ferma i doppioni)
  if (!o.soloDolori && clients.length) {
    const ids = clients.map((c) => c.id);
    const [packages, sessions, gia] = await Promise.all([
      db.from("packages").select("*").in("client_id", ids),
      db.from("sessions").select("*").eq("trainer_id", t.id),
      db.from("alerts").select("package_id").eq("trainer_id", t.id).eq("kind", "package_expiring"),
    ]);
    const nuovi = pacchettiDaAvvisare(
      { clients, packages: leggi(packages, "pacchetti"), sessions: leggi(sessions, "sedute"), giaAvvisati: new Set(leggi(gia, "avvisi").map((a) => a.package_id ?? "")) },
      o.adesso,
    );
    for (const n of nuovi) {
      const r = await db.from("alerts").insert({ trainer_id: t.id, client_id: n.clientId, kind: "package_expiring", package_id: n.packageId, text: n.testo });
      if (!r.error) esito.nuoviPacchetti++;
      else if (r.error.code !== "23505") esito.errori.push(`avviso del pacchetto: ${r.error.message}`);
    }
  }

  // 2. avvisi nuovi per email (o chiusi senza email: notifica spenta, troppo vecchi)
  let q = db.from("alerts").select("*").eq("trainer_id", t.id).is("emailed_at", null);
  if (o.soloDolori) q = q.eq("kind", "pain");
  const { email: daMandare, chiudi } = avvisiDaMandare(leggi(await q, "avvisi da mandare"), t.notifications as Partial<Notifiche>, o.adesso);
  const segna = async (avvisi: Tables<"alerts">[]) => {
    if (!avvisi.length) return;
    const r = await db.from("alerts").update({ emailed_at: o.adesso.toISOString() }).in("id", avvisi.map((a) => a.id));
    if (r.error) esito.errori.push(`avvisi segnati: ${r.error.message}`);
  };
  await segna(chiudi);

  const utente = await db.auth.admin.getUserById(t.user_id);
  const indirizzo = utente.data.user?.email;
  const link = `${o.siteUrl}/dashboard`;
  const nome = t.name.split(" ")[0];
  if (daMandare.length && indirizzo) {
    const righe = daMandare.map((a) => rigaAvviso(a, nomi));
    if (await o.manda(indirizzo, avvisiTrainer({ nome, prodotto: o.prodotto, righe, link }))) {
      esito.email++;
      await segna(daMandare);
    }
  }

  // 3. il lunedì, il riepilogo della settimana (se l'ha acceso)
  if (!o.soloDolori && indirizzo && eLunedi(o.adesso) && (t.notifications as Partial<Notifiche>).riepilogo) {
    const [payments, sessions] = await Promise.all([db.from("payments").select("*").eq("trainer_id", t.id), db.from("sessions").select("*").eq("trainer_id", t.id)]);
    const righe = riepilogoSettimana({ payments: leggi(payments, "pagamenti"), sessions: leggi(sessions, "sedute") }, o.adesso);
    if (await o.manda(indirizzo, riepilogoLunedi({ nome, prodotto: o.prodotto, righe, link }))) esito.email++;
  }
  return esito;
}

export async function giroAvvisi(db: Db, o: { siteUrl: string; prodotto: string; manda: Manda; adesso?: Date; trainerId?: string; soloDolori?: boolean }): Promise<EsitoGiro[]> {
  const adesso = o.adesso ?? new Date();
  let q = db.from("trainers").select("*").eq("status", "active");
  if (o.trainerId) q = q.eq("id", o.trainerId);
  const trainers = leggi(await q, "trainer");
  const esiti: EsitoGiro[] = [];
  // un trainer alla volta: un errore su uno non ferma gli altri
  for (const t of trainers) {
    try {
      esiti.push(await giroTrainer(db, t, { siteUrl: o.siteUrl, prodotto: o.prodotto, adesso, manda: o.manda, soloDolori: !!o.soloDolori }));
    } catch (e) {
      esiti.push({ trainer: t.slug, nuoviPacchetti: 0, email: 0, errori: [e instanceof Error ? e.message : String(e)] });
    }
  }
  return esiti;
}
