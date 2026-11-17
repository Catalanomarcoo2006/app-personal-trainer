"use server";

import config from "@/config";
import { createAdminClient } from "@/libs/supabase/admin";
import { createClient } from "@/libs/supabase/server";
import { giroAvvisi } from "@/libs/avvisi/giro";
import { linkAccessoCliente } from "@/libs/admin/accesso";
import { conResend, indirizzoSito, mandaEmail } from "@/libs/email/inviti";

// Il cliente chiede il link per entrare. Con Resend lo mandiamo noi (in italiano, col marchio del trainer, valido
// anche aperto dall'app della posta); senza, la pagina usa ancora l'email di Supabase (supabase: true).
// La risposta è sempre la stessa, che l'email sia di un cliente o no.
export async function chiediLinkAction(slug: string, email: string): Promise<{ supabase: boolean }> {
  if (!conResend()) return { supabase: true };
  try {
    const m = await linkAccessoCliente(createAdminClient(), { slug, email, siteUrl: await indirizzoSito() });
    if (m) await mandaEmail(m.a, m.email, m.mittente);
  } catch (e) {
    console.error("Link d'accesso del cliente non mandato", e instanceof Error ? e.message : e);
  }
  return { supabase: false };
}

// Dopo un dolore segnalato a Leo (report_pain): l'email al trainer parte subito, se lui la vuole, senza aspettare
// il controllo del mattino. Chi chiama dev'essere un cliente collegato: si avvisa solo il suo trainer.
export async function avvisaDoloreAction(): Promise<void> {
  if (!conResend()) return;
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("my_client");
    const trainerId = data?.[0]?.trainer_id;
    if (!trainerId) return;
    await giroAvvisi(createAdminClient(), { siteUrl: await indirizzoSito(), prodotto: config.productName, manda: (a, e) => mandaEmail(a, e), trainerId, soloDolori: true });
  } catch (e) {
    console.error("Email del dolore non mandata", e instanceof Error ? e.message : e);
  }
}
