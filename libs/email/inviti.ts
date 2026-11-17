// Indirizzo del sito e invio delle email, per le azioni sul server (admin, trainer, pagine d'accesso).
// Con RESEND_API_KEY le email partono da Resend (in italiano, modelli in modelli.ts); senza, chi ha chiesto
// l'invito copia il link dalla pagina, e link d'accesso e password dimenticata restano quelli di Supabase.

import { headers } from "next/headers";
import config from "@/config";
import { mittente, type Email } from "./modelli";

export async function indirizzoSito(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? config.domainName;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export const conResend = () => !!process.env.RESEND_API_KEY;

// Manda un'email; false se Resend non c'è o non è andata (l'errore resta nei log del server).
// nomeMittente: per le email ai clienti si legge il nome del trainer ("Marco Rossi <ciao@spotter.it>").
export async function mandaEmail(a: string, email: Email, nomeMittente?: string): Promise<boolean> {
  if (!conResend()) return false;
  try {
    const { sendEmail } = await import("@/libs/resend");
    await sendEmail({
      from: mittente(process.env.EMAIL_FROM || config.resend.fromNoReply, nomeMittente),
      to: a,
      subject: email.oggetto,
      text: email.testo,
      html: email.html,
      replyTo: config.resend.supportEmail,
    });
    return true;
  } catch (e) {
    console.error("Email non partita", e instanceof Error ? e.message : e);
    return false;
  }
}
