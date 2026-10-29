"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/libs/supabase/server";
import { createTrainer, ERRORI_TRAINER, newInviteLink, renewTrainer, setTrainerStatus } from "@/libs/admin/trainers";
import config from "@/config";
import { indirizzoSito, mandaLink } from "@/libs/email/inviti";

export type EsitoAzione = { ok: true; messaggio: string; link?: string } | { ok: false; messaggio: string } | null;

// Ogni azione ricontrolla che chi chiama sia l'admin (is_admin nel database), poi usa la chiave di servizio.
async function soloAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_admin");
  if (data !== true) throw new Error("Solo l'amministratore può farlo");
}

// Un errore imprevisto (database, chiave di servizio) torna come messaggio nel pannello, invece della pagina
// "Qualcosa è andato storto": all'admin serve sapere cosa non va.
async function conErrore(fn: () => Promise<EsitoAzione>): Promise<EsitoAzione> {
  try {
    return await fn();
  } catch (e) {
    console.error("Azione admin non riuscita", e);
    return { ok: false, messaggio: `Non riuscito: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function creaTrainerAction(prima: EsitoAzione, form: FormData): Promise<EsitoAzione> {
  return conErrore(() => creaTrainer_(prima, form));
}

async function creaTrainer_(_: EsitoAzione, form: FormData): Promise<EsitoAzione> {
  await soloAdmin();
  const name = String(form.get("name") ?? "");
  const email = String(form.get("email") ?? "");
  const slug = String(form.get("slug") ?? "");
  const r = await createTrainer({ name, email, slug, siteUrl: await indirizzoSito() });
  if ("error" in r) return { ok: false, messaggio: ERRORI_TRAINER[r.error] };
  revalidatePath("/admin");
  const inviata = await mandaLink({
    email: email.trim(),
    nome: name.trim(),
    link: r.inviteLink,
    oggetto: `Il tuo account su ${config.appName}`,
    frase: "il tuo account è pronto. Apri il link per scegliere la password (vale 24 ore):",
    tasto: "Scegli la password",
  });
  return {
    ok: true,
    messaggio: inviata ? `Creato: invito mandato a ${email.trim()}` : "Creato. L'email non è partita (manca Resend): manda tu questo link al trainer",
    link: inviata ? undefined : r.inviteLink,
  };
}

export async function rinnovaAction(trainerId: string): Promise<EsitoAzione> {
  return conErrore(async () => {
    await soloAdmin();
    const scadenza = await renewTrainer(trainerId);
    revalidatePath("/admin");
    return { ok: true, messaggio: `Rinnovato fino al ${scadenza.split("-").reverse().join("/")}` };
  });
}

export async function cambiaStatoAction(trainerId: string, status: "active" | "suspended"): Promise<EsitoAzione> {
  return conErrore(async () => {
    await soloAdmin();
    await setTrainerStatus(trainerId, status);
    revalidatePath("/admin");
    return { ok: true, messaggio: status === "suspended" ? "Sospeso: lui e i suoi clienti non entrano più" : "Riattivato" };
  });
}

export async function nuovoLinkAction(trainerId: string): Promise<EsitoAzione> {
  return conErrore(async () => {
    await soloAdmin();
    const link = await newInviteLink(trainerId, await indirizzoSito());
    return { ok: true, messaggio: "Nuovo link d'accesso (vale 24 ore): mandalo al trainer", link };
  });
}
