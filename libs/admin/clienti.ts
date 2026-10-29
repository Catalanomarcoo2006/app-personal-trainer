// Il trainer invita un suo cliente nell'app: si crea l'accesso (link via email, senza password) e si collega
// alla riga del cliente. Gira con la chiave di servizio: chi lo chiama (app/dashboard/actions.ts) ha già letto il
// cliente con le regole del trainer, quindi è uno dei suoi.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";
import { createAdminClient } from "@/libs/supabase/admin";

type Db = SupabaseClient<Database>;

export type InvitoCliente = { ok: true; link: string } | { ok: false; error: "email_mancante" | "email_di_altri" };

export const ERRORI_INVITO: Record<"email_mancante" | "email_di_altri", string> = {
  email_mancante: "Manca l'email del cliente: aggiungila e riprova",
  email_di_altri: "Questa email ha già un account con un altro ruolo o un altro trainer: usane un'altra",
};

const linkDa = (siteUrl: string, hash: string, type: "invite" | "magiclink", slug: string) =>
  `${siteUrl}/api/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=${type}&next=${encodeURIComponent(`/${slug}`)}`;

export async function invitaCliente(
  c: { id: string; email: string | null; user_id: string | null },
  slug: string,
  siteUrl: string,
  db: Db = createAdminClient(),
): Promise<InvitoCliente> {
  const email = c.email?.trim().toLowerCase();
  if (!email) return { ok: false, error: "email_mancante" };

  // già collegato: un link d'accesso nuovo (il primo scade, o il cliente ha cambiato telefono)
  if (c.user_id) {
    const u = await db.auth.admin.getUserById(c.user_id);
    if (u.error || !u.data.user.email) throw new Error("Accesso del cliente non trovato");
    const l = await db.auth.admin.generateLink({ type: "magiclink", email: u.data.user.email });
    if (l.error) throw new Error(`Link non creato: ${l.error.message}`);
    return { ok: true, link: linkDa(siteUrl, l.data.properties.hashed_token, "magiclink", slug) };
  }

  const l = await db.auth.admin.generateLink({ type: "invite", email });
  if (l.error) {
    if (l.error.code === "email_exists" || l.error.status === 422) return { ok: false, error: "email_di_altri" };
    throw new Error(`Invito non creato: ${l.error.message}`);
  }
  const userId = l.data.user.id;
  const annulla = async () => {
    await db.from("profiles").delete().eq("id", userId);
    await db.auth.admin.deleteUser(userId);
  };
  const p = await db.from("profiles").insert({ id: userId, role: "client" });
  if (p.error) {
    await annulla();
    throw new Error(`Profilo non creato: ${p.error.message}`);
  }
  const k = await db.from("clients").update({ user_id: userId }).eq("id", c.id).is("user_id", null).select("id");
  if (k.error || !k.data?.length) {
    await annulla();
    throw new Error(`Cliente non collegato: ${k.error?.message ?? "collegato nel frattempo"}`);
  }
  return { ok: true, link: linkDa(siteUrl, l.data.properties.hashed_token, "invite", slug) };
}
