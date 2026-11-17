"use server";

import config from "@/config";
import { createAdminClient } from "@/libs/supabase/admin";
import { linkNuovaPassword } from "@/libs/admin/accesso";
import { conResend, indirizzoSito, mandaEmail } from "@/libs/email/inviti";

// "Password dimenticata" del trainer. Con Resend la mandiamo noi (in italiano, valida anche aperta dall'app della
// posta); senza, la pagina usa ancora l'email di Supabase (supabase: true). Stessa risposta che l'email esista o no.
export async function passwordDimenticataAction(email: string): Promise<{ supabase: boolean }> {
  if (!conResend()) return { supabase: true };
  try {
    const m = await linkNuovaPassword(createAdminClient(), { email, siteUrl: await indirizzoSito(), prodotto: config.productName });
    if (m) await mandaEmail(m.a, m.email);
  } catch (e) {
    console.error("Link per la nuova password non mandato", e instanceof Error ? e.message : e);
  }
  return { supabase: false };
}
