"use server";

import { createClient } from "@/libs/supabase/server";
import { ERRORI_INVITO, invitaCliente } from "@/libs/admin/clienti";
import { indirizzoSito, mandaLink } from "@/libs/email/inviti";

export type EsitoInvito = { ok: true; messaggio: string; link?: string } | { ok: false; messaggio: string };

// Il trainer invita un suo cliente nell'app. Il cliente si legge con le regole del trainer: se non è suo, non c'è.
export async function invitaClienteAction(clientId: string): Promise<EsitoInvito> {
  const supabase = await createClient();
  const { data: c } = await supabase.from("clients").select("id, name, email, user_id, trainer_id").eq("id", clientId).maybeSingle();
  if (!c) return { ok: false, messaggio: "Cliente non ancora salvato: riprova tra un attimo" };
  const { data: t } = await supabase.from("trainers").select("slug, name").eq("id", c.trainer_id).single();
  if (!t) return { ok: false, messaggio: "Area del trainer non trovata" };

  let r: Awaited<ReturnType<typeof invitaCliente>>;
  try {
    r = await invitaCliente(c, t.slug, await indirizzoSito());
  } catch (e) {
    console.error("Invito del cliente non riuscito", e);
    return { ok: false, messaggio: `Invito non riuscito: ${e instanceof Error ? e.message : String(e)}` };
  }
  if ("error" in r) return { ok: false, messaggio: ERRORI_INVITO[r.error] };
  const inviata = await mandaLink({
    email: c.email!,
    nome: c.name.split(" ")[0],
    link: r.link,
    oggetto: `La tua app con ${t.name}`,
    frase: `${t.name} ti ha invitato nella sua app: scheda, progressi e messaggi. Apri il link dal telefono per entrare (vale 24 ore):`,
    tasto: "Entra nell'app",
  });
  return inviata
    ? { ok: true, messaggio: `Invito mandato a ${c.email}` }
    : { ok: true, messaggio: "Link pronto: mandalo al cliente (l'email automatica arriva quando c'è Resend)", link: r.link };
}
