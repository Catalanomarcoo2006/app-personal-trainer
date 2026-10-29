// Indirizzo del sito e email degli inviti, per le azioni sul server (admin e trainer).

import { headers } from "next/headers";
import config from "@/config";

export async function indirizzoSito(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? config.domainName;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

const html = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Email con il link d'accesso, con Resend se la chiave c'è; altrimenti false, e chi ha chiesto l'invito copia il
// link dalla pagina e lo manda lui (WhatsApp, email).
export async function mandaLink(o: { email: string; nome: string; link: string; oggetto: string; frase: string; tasto: string }): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const { sendEmail } = await import("@/libs/resend");
    await sendEmail({
      to: o.email,
      subject: o.oggetto,
      text: `Ciao ${o.nome}, ${o.frase} ${o.link}`,
      html: `<p>Ciao ${html(o.nome)},</p><p>${html(o.frase)}</p><p><a href="${html(o.link)}">${html(o.tasto)}</a></p>`,
    });
    return true;
  } catch {
    return false;
  }
}
