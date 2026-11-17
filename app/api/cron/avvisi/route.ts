import { NextResponse, type NextRequest } from "next/server";
import config from "@/config";
import { createAdminClient } from "@/libs/supabase/admin";
import { giroAvvisi } from "@/libs/avvisi/giro";
import { mandaEmail } from "@/libs/email/inviti";

export const dynamic = "force-dynamic";

// Il controllo di ogni mattina (Vercel Cron, vercel.json): avvisi dei pacchetti che finiscono, email degli avvisi
// nuovi, il lunedì il riepilogo. Vercel lo chiama con "Authorization: Bearer <CRON_SECRET>": senza quella variabile
// (o con un'altra chiave) non parte niente, così nessuno lo fa girare da fuori.
export async function GET(req: NextRequest) {
  const segreto = process.env.CRON_SECRET;
  if (!segreto || req.headers.get("authorization") !== `Bearer ${segreto}`) return NextResponse.json({ errore: "non autorizzato" }, { status: 401 });
  const esiti = await giroAvvisi(createAdminClient(), { siteUrl: new URL(req.url).origin, prodotto: config.productName, manda: (a, e) => mandaEmail(a, e) });
  const errori = esiti.flatMap((e) => e.errori.map((x) => `${e.trainer}: ${x}`));
  if (errori.length) console.error("Avvisi con errori", errori);
  return NextResponse.json({ trainer: esiti.length, nuoviPacchetti: esiti.reduce((s, e) => s + e.nuoviPacchetti, 0), email: esiti.reduce((s, e) => s + e.email, 0), errori: errori.length });
}
