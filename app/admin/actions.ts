"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/libs/supabase/server";
import { createTrainer, ERRORI_TRAINER, newInviteLink, renewTrainer, setTrainerStatus } from "@/libs/admin/trainers";
import config from "@/config";

export type EsitoAzione = { ok: true; messaggio: string; link?: string } | { ok: false; messaggio: string } | null;

// Ogni azione ricontrolla che chi chiama sia l'admin (is_admin nel database), poi usa la chiave di servizio.
async function soloAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_admin");
  if (data !== true) throw new Error("Solo l'amministratore può farlo");
}

async function indirizzoSito() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? config.domainName;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

const html = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Email d'invito con Resend, se la chiave c'è; altrimenti Marco copia il link dal pannello e lo manda lui.
async function mandaInvito(email: string, nome: string, link: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const { sendEmail } = await import("@/libs/resend");
    await sendEmail({
      to: email,
      subject: `Il tuo account su ${config.appName}`,
      text: `Ciao ${nome}, il tuo account è pronto. Apri questo link per scegliere la password (vale 24 ore): ${link}`,
      html: `<p>Ciao ${html(nome)},</p><p>il tuo account è pronto. <a href="${html(link)}">Scegli la password</a> (il link vale 24 ore).</p>`,
    });
    return true;
  } catch {
    return false;
  }
}

export async function creaTrainerAction(_: EsitoAzione, form: FormData): Promise<EsitoAzione> {
  await soloAdmin();
  const name = String(form.get("name") ?? "");
  const email = String(form.get("email") ?? "");
  const slug = String(form.get("slug") ?? "");
  const r = await createTrainer({ name, email, slug, siteUrl: await indirizzoSito() });
  if ("error" in r) return { ok: false, messaggio: ERRORI_TRAINER[r.error] };
  revalidatePath("/admin");
  const inviata = await mandaInvito(email.trim(), name.trim(), r.inviteLink);
  return {
    ok: true,
    messaggio: inviata ? `Creato: invito mandato a ${email.trim()}` : "Creato. L'email non è partita (manca Resend): manda tu questo link al trainer",
    link: inviata ? undefined : r.inviteLink,
  };
}

export async function rinnovaAction(trainerId: string): Promise<EsitoAzione> {
  await soloAdmin();
  const scadenza = await renewTrainer(trainerId);
  revalidatePath("/admin");
  return { ok: true, messaggio: `Rinnovato fino al ${scadenza.split("-").reverse().join("/")}` };
}

export async function cambiaStatoAction(trainerId: string, status: "active" | "suspended"): Promise<EsitoAzione> {
  await soloAdmin();
  await setTrainerStatus(trainerId, status);
  revalidatePath("/admin");
  return { ok: true, messaggio: status === "suspended" ? "Sospeso: lui e i suoi clienti non entrano più" : "Riattivato" };
}

export async function nuovoLinkAction(trainerId: string): Promise<EsitoAzione> {
  await soloAdmin();
  const link = await newInviteLink(trainerId, await indirizzoSito());
  return { ok: true, messaggio: "Nuovo link d'accesso (vale 24 ore): mandalo al trainer", link };
}
